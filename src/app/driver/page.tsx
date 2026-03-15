
"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Loader2, AlertTriangle, Clock, Info, MapPin, Bus, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Capacitor, registerPlugin } from '@capacitor/core';

// استخدام الإضافة لتمكين تتبع الموقع في الخلفية على أندرويد
const BackgroundGeolocation = registerPlugin<any>("BackgroundGeolocation");

type TripStatus = "Scheduled" | "Departed" | "Delayed" | "Arrived";

export default function DriverDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus>("Scheduled");
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // البحث عن الحافلة المرتبطة ببريد السائق
  const busesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "buses"), where("driverEmail", "==", user.email.toLowerCase().trim()));
  }, [firestore, user?.email]);

  const { data: assignedBuses, isLoading: isBusesLoading } = useCollection(busesQuery);
  const myBus = assignedBuses?.[0];

  // البحث عن الرحلات المجدولة لهذه الحافلة
  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !myBus) return null;
    return query(collection(firestore, "busTrips"), where("busId", "==", myBus.id));
  }, [firestore, myBus]);

  const { data: myTrips, isLoading: isTripsLoading } = useCollection(tripsQuery);

  // تعيين الرحلة الافتراضية إذا لم تكن مختارة
  useEffect(() => {
    if (myTrips && myTrips.length > 0 && !activeTripId) {
      const active = myTrips.find(t => t.status === "Departed" || t.status === "Delayed") || myTrips[0];
      if (active) {
        setActiveTripId(active.id);
        setTripStatus(active.status as TripStatus);
      }
    }
  }, [myTrips, activeTripId]);

  const updateFirebaseLocation = (lat: number, lng: number) => {
    if (!activeTripId) return;
    const now = Date.now();
    // إرسال التحديث كل 15 ثانية لتوفير البيانات والبطارية
    if (now - lastUpdateRef.current < 15000) return;

    lastUpdateRef.current = now;
    const tripRef = doc(firestore, "busTrips", activeTripId);
    
    updateDocumentNonBlocking(tripRef, {
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date().toISOString(),
      isLive: true,
      status: "Departed",
      currentLocationDescription: "على الطريق"
    });
  };

  const startTracking = async () => {
    if (!activeTripId) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى اختيار رحلة أولاً" });
      return;
    }
    
    try {
      if (Capacitor.isNativePlatform()) {
        const id = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: "العوجان للسفر: جاري إرسال موقع الحافلة للركاب...",
            backgroundTitle: "بث موقع الرحلة نشط",
            requestPermissions: true,
            stale: false,
            distanceFilter: 10
          },
          (location: any, error: any) => {
            if (error) {
              console.error(error);
              return;
            }
            if (location) {
              updateFirebaseLocation(location.latitude, location.longitude);
            }
          }
        );
        watchIdRef.current = id;
        setIsTracking(true);
        toast({ title: "بدأ البث المباشر", description: "موقعك يظهر الآن للركاب على الخريطة" });
      } else {
        if (navigator.geolocation) {
          const id = navigator.geolocation.watchPosition(
            (pos) => updateFirebaseLocation(pos.coords.latitude, pos.coords.longitude),
            () => toast({ variant: "destructive", title: "خطأ في استقبال GPS" }),
            { enableHighAccuracy: true }
          );
          watchIdRef.current = id.toString();
          setIsTracking(true);
          toast({ title: "بدأ البث المباشر", description: "يتم استخدام متصفح الويب لمشاركة الموقع" });
        }
      }
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في التتبع", 
        description: "يرجى التأكد من تفعيل الموقع الجغرافي للهاتف" 
      });
      setIsTracking(false);
    }
  };

  const stopTracking = async () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      if (Capacitor.isNativePlatform()) {
        await BackgroundGeolocation.removeWatcher({ id: watchIdRef.current });
      } else {
        navigator.geolocation.clearWatch(parseInt(watchIdRef.current));
      }
      watchIdRef.current = null;
    }
    
    if (activeTripId) {
      const tripRef = doc(firestore, "busTrips", activeTripId);
      updateDocumentNonBlocking(tripRef, { isLive: false });
    }
  };

  const handleStatusChange = (newStatus: TripStatus) => {
    if (!activeTripId) return;
    
    const tripRef = doc(firestore, "busTrips", activeTripId);
    setTripStatus(newStatus);

    if (newStatus === "Departed") {
      updateDocumentNonBlocking(tripRef, {
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
        currentLocationDescription: "على الطريق"
      });
      startTracking();
    } else {
      stopTracking();
      updateDocumentNonBlocking(tripRef, {
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
        currentLocationDescription: newStatus === "Arrived" ? "وصل للمحطة النهائية" : "في المحطة"
      });
    }

    toast({ title: "تم تحديث الحالة", description: `الرحلة الآن في حالة: ${newStatus}` });
  };

  if (isBusesLoading || isTripsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-6 animate-in fade-in zoom-in">
      <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black text-slate-900">حساب السائق غير مرتبط</h1>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
          عذراً، بريدك الإلكتروني ({user?.email}) غير مرتب بأي حافلة حالياً. يرجى مراجعة الإدارة لربط بريدك بحافلة من قسم "إدارة الأسطول".
        </p>
      </div>
      <Button variant="outline" className="rounded-xl h-12 px-8" onClick={() => window.location.reload()}>تحديث الصفحة</Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 text-right animate-in fade-in">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-sm border border-primary/5">
        <div className="text-right">
          <h1 className="text-2xl font-black text-primary leading-tight">لوحة القائد</h1>
          <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest flex items-center gap-1 justify-end">
             {myBus.licensePlate} | {user?.email} <Bus className="h-2.5 w-2.5" />
          </p>
        </div>
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
          isTracking ? "bg-emerald-600 animate-pulse" : "bg-primary/5 border border-primary/10"
        )}>
          {isTracking ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Bus className="h-8 w-8 text-primary" />}
        </div>
      </header>

      <Card className="border-primary/10 shadow-lg rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 border-b py-4">
          <CardTitle className="text-sm font-black flex items-center gap-2 justify-end text-primary">
            إدارة رحلات اليوم للحافلة ({myBus.licensePlate})
            <Clock className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground pr-1">1. اختر الرحلة المجدولة</label>
              <Select 
                value={activeTripId || ""} 
                onValueChange={(val) => {
                  setActiveTripId(val);
                  const selected = myTrips?.find(t => t.id === val);
                  if (selected) setTripStatus(selected.status);
                }}
                disabled={isTracking}
              >
                <SelectTrigger className="h-16 rounded-2xl border-primary/10 font-bold text-right text-lg shadow-sm">
                  <SelectValue placeholder="اختر الرحلة للبدء" />
                </SelectTrigger>
                <SelectContent>
                  {myTrips?.map(trip => (
                    <SelectItem key={trip.id} value={trip.id} className="text-right justify-end font-bold">
                      {trip.id} | {trip.originName} ⬅ {trip.destinationName}
                    </SelectItem>
                  ))}
                  {(!myTrips || myTrips.length === 0) && (
                    <SelectItem value="none" disabled>لا توجد رحلات مجدولة لحافلتك</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {activeTripId ? (
              <div className="space-y-6 pt-4 border-t border-dashed animate-in slide-in-from-top-4">
                <div className="text-center p-4 bg-muted/20 rounded-2xl">
                   <p className="text-[10px] font-black text-muted-foreground mb-1 uppercase tracking-widest">حالة الرحلة المختارة</p>
                   <Badge className={cn(
                     "px-6 py-1.5 rounded-full font-black text-sm",
                     tripStatus === "Departed" ? "bg-emerald-600" : "bg-primary"
                   )}>
                     {tripStatus === "Scheduled" ? "مجدولة" : 
                      tripStatus === "Departed" ? "في الطريق" : 
                      tripStatus === "Delayed" ? "متأخرة" : "وصلت"}
                   </Badge>
                </div>

                {tripStatus !== "Departed" ? (
                  <Button 
                    onClick={() => handleStatusChange("Departed")} 
                    className="w-full h-20 text-xl font-black gap-3 rounded-[2rem] bg-primary shadow-2xl hover:scale-[1.02] transition-all"
                  >
                    <Play className="h-8 w-8 fill-white" /> بدء الرحلة وبث الموقع المباشر
                  </Button>
                ) : (
                  <div className="space-y-4 animate-in zoom-in duration-300">
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem] flex flex-col items-center gap-4 text-center">
                      <div className="relative">
                        <div className="h-4 w-4 rounded-full bg-emerald-600 animate-ping absolute inset-0 m-auto" />
                        <div className="h-4 w-4 rounded-full bg-emerald-600 relative z-10" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-black text-emerald-800">جاري بث موقعك للركاب الآن</span>
                        <p className="text-[10px] text-emerald-700 opacity-70">الموقع المباشر يظهر على خرائط تتبع العملاء</p>
                      </div>
                      <Badge className="bg-emerald-600 font-black px-6 py-1 text-lg">LIVE</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" onClick={() => handleStatusChange("Delayed")} className="h-16 rounded-[1.5rem] font-black border-red-100 text-red-600 hover:bg-red-50 text-base">
                        إبلاغ عن تأخير
                      </Button>
                      <Button variant="default" onClick={() => handleStatusChange("Arrived")} className="h-16 rounded-[1.5rem] font-black bg-slate-900 shadow-xl text-base gap-2">
                        <CheckCircle2 className="h-5 w-5" /> إنهاء ووصول
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center bg-muted/10 rounded-[2rem] border-2 border-dashed border-primary/5">
                 <MapPin className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                 <p className="text-muted-foreground font-bold text-sm">بانتظار اختيار رحلة لتفعيل التحكم</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="p-8 bg-accent/5 rounded-[2.5rem] border border-accent/10 text-right">
        <h4 className="text-sm font-black text-accent mb-4 flex items-center gap-2 justify-end">
          تعليمات الكابتن (مهم جداً)
          <Info className="h-4 w-4" />
        </h4>
        <ul className="text-xs text-muted-foreground space-y-4 leading-relaxed font-bold">
          <li className="flex items-start gap-3 justify-end">
            <span>تأكد من تفعيل الموقع الجغرافي (GPS) في هاتفك قبل الضغط على "بدء الرحلة".</span>
            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">1</div>
          </li>
          <li className="flex items-start gap-3 justify-end">
            <span>إذا طلب الهاتف صلاحيات الموقع، اختر <strong>"Allow all the time"</strong> لضمان استمرار البث.</span>
            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">2</div>
          </li>
          <li className="flex items-start gap-3 justify-end">
            <span>لا تقم بإغلاق التطبيق؛ اتركه يعمل في الخلفية أثناء القيادة ليتمكن الركاب من تتبعك.</span>
            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">3</div>
          </li>
          <li className="flex items-start gap-3 justify-end">
            <span>عند الوصول للمحطة النهائية، اضغط على <strong>"إنهاء ووصول"</strong> لإيقاف البث وتوفير البطارية.</span>
            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent">4</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
