
"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, Loader2, AlertTriangle, Clock, Info, MapPin, Bus } from "lucide-react";
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
      setActiveTripId(active.id);
      setTripStatus(active.status as TripStatus);
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
        toast({ title: "بدأ البث", description: "جاري مشاركة موقعك المباشر في الخلفية" });
      } else {
        if (navigator.geolocation) {
          const id = navigator.geolocation.watchPosition(
            (pos) => updateFirebaseLocation(pos.coords.latitude, pos.coords.longitude),
            () => toast({ variant: "destructive", title: "خطأ GPS" }),
            { enableHighAccuracy: true }
          );
          watchIdRef.current = id.toString();
          setIsTracking(true);
        }
      }
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في التتبع", 
        description: "يرجى تفعيل صلاحيات الموقع 'Always' من إعدادات الهاتف" 
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
        currentLocationDescription: newStatus === "Arrived" ? "وصل للمحطة" : "في المحطة"
      });
    }

    toast({ title: "تم تحديث الحالة", description: `حالة الرحلة الآن: ${newStatus}` });
  };

  if (isBusesLoading || isTripsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-6">
      <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black text-slate-900">حساب السائق غير مرتبط</h1>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
          عذراً، بريدك الإلكتروني ({user?.email}) غير مرتب بأي حافلة حالياً. يرجى مراجعة الإدارة لربط بريدك بحافلة من "إدارة الأسطول".
        </p>
      </div>
      <Button variant="outline" className="rounded-xl h-12 px-8" onClick={() => window.location.reload()}>تحديث الصفحة</Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-sm border border-primary/5">
        <div className="text-right">
          <h1 className="text-2xl font-black text-primary leading-tight">لوحة القائد</h1>
          <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">
            {myBus.licensePlate} | {user?.displayName || "كابتن العوجان"}
          </p>
        </div>
        <div className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
          isTracking ? "bg-green-600 animate-pulse" : "bg-primary/10"
        )}>
          {isTracking ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Bus className="h-6 w-6 text-primary" />}
        </div>
      </header>

      <Card className="border-primary/10 shadow-lg rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-primary/5 border-b py-4">
          <CardTitle className="text-sm font-black flex items-center gap-2 justify-end text-primary">
            إدارة رحلات اليوم
            <Clock className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground pr-1">اختر الرحلة للبدء</label>
              <Select 
                value={activeTripId || ""} 
                onValueChange={(val) => {
                  setActiveTripId(val);
                  const selected = myTrips?.find(t => t.id === val);
                  if (selected) setTripStatus(selected.status);
                }}
                disabled={isTracking}
              >
                <SelectTrigger className="h-14 rounded-2xl border-primary/10 font-bold text-right">
                  <SelectValue placeholder="اختر رحلة من الجدول" />
                </SelectTrigger>
                <SelectContent>
                  {myTrips?.map(trip => (
                    <SelectItem key={trip.id} value={trip.id} className="text-right justify-end">
                      {trip.id} | {trip.originName} ⬅ {trip.destinationName}
                    </SelectItem>
                  ))}
                  {(!myTrips || myTrips.length === 0) && (
                    <SelectItem value="none" disabled>لا توجد رحلات مجدولة</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {activeTripId && (
              <div className="grid grid-cols-1 gap-4 pt-2">
                {tripStatus !== "Departed" ? (
                  <Button 
                    onClick={() => handleStatusChange("Departed")} 
                    className="w-full h-16 text-lg font-black gap-2 rounded-[1.75rem] bg-primary shadow-xl hover:scale-[1.02] transition-transform"
                  >
                    <Play className="h-6 w-6" /> بدء الرحلة وبث الموقع
                  </Button>
                ) : (
                  <div className="space-y-4 animate-in zoom-in duration-300">
                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-[1.75rem] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                        <span className="text-xs font-black text-emerald-800">جاري البث المباشر للركاب...</span>
                      </div>
                      <Badge className="bg-emerald-600 font-black px-4">LIVE</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" onClick={() => handleStatusChange("Delayed")} className="h-14 rounded-2xl font-black border-red-100 text-red-600 hover:bg-red-50">تأخير</Button>
                      <Button variant="default" onClick={() => handleStatusChange("Arrived")} className="h-14 rounded-2xl font-black bg-slate-900 shadow-md">إنهاء ووصول</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="p-6 bg-accent/5 rounded-[2rem] border border-accent/10 text-right">
        <h4 className="text-xs font-black text-accent mb-3 flex items-center gap-2 justify-end">دليل القائد للأندرويد <Info className="h-3 w-3" /></h4>
        <ul className="text-[10px] text-muted-foreground space-y-3 leading-relaxed font-bold">
          <li className="flex items-start gap-2 justify-end"><span>1. تأكد من تفعيل الـ GPS في هاتفك قبل بدء الرحلة.</span></li>
          <li className="flex items-start gap-2 justify-end"><span>2. عند الطلب، اختر <strong>"Allow all the time"</strong> للموقع.</span></li>
          <li className="flex items-start gap-2 justify-end"><span>3. لا تقم بإغلاق التطبيق تماماً؛ اتركه يعمل في الخلفية.</span></li>
          <li className="flex items-start gap-2 justify-end"><span>4. اضغط "إنهاء" فور وصولك للمحطة لتوفير البطارية.</span></li>
        </ul>
      </div>
    </div>
  );
}
