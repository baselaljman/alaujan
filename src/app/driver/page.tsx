"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  Loader2, 
  AlertTriangle, 
  Clock, 
  Info, 
  MapPin, 
  Bus, 
  CheckCircle2,
  RefreshCw,
  Navigation,
  ChevronLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Geolocation } from '@capacitor/geolocation';

type TripStatus = "Scheduled" | "Departed" | "Delayed" | "Arrived";

export default function DriverDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
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

  const updateFirebaseLocation = (tripId: string, lat: number, lng: number) => {
    const now = Date.now();
    // إرسال التحديث كل 10 ثوانٍ لضمان التتبع المباشر وتوفير البيانات
    if (now - lastUpdateRef.current < 10000) return;

    lastUpdateRef.current = now;
    const tripRef = doc(firestore, "busTrips", tripId);
    
    updateDocumentNonBlocking(tripRef, {
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date().toISOString(),
      isLive: true,
      status: "Departed",
      currentLocationDescription: "على الطريق"
    });
  };

  const startTracking = async (tripId: string) => {
    try {
      // 1. طلب تصاريح الموقع بجميع مستوياتها (بما في ذلك الخلفية)
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        toast({ 
          variant: "destructive", 
          title: "تم رفض الوصول للموقع", 
          description: "يجب الموافقة على تصاريح الموقع لتمكين البث للركاب" 
        });
        return;
      }

      setActiveTripId(tripId);
      
      // 2. بدء مراقبة الموقع بدقة عالية
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error(err);
            return;
          }
          if (position) {
            updateFirebaseLocation(tripId, position.coords.latitude, position.coords.longitude);
          }
        }
      );

      watchIdRef.current = watchId;

      const tripRef = doc(firestore, "busTrips", tripId);
      updateDocumentNonBlocking(tripRef, {
        status: "Departed",
        lastUpdatedAt: new Date().toISOString(),
        currentLocationDescription: "على الطريق",
        isLive: true
      });

      setIsTracking(true);
      toast({ title: "بدأ البث المباشر", description: "موقعك يظهر الآن للركاب على الخريطة" });
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في التتبع", 
        description: "يرجى التأكد من تفعيل GPS الهاتف وإعطاء التصاريح" 
      });
      setIsTracking(false);
    }
  };

  const stopTracking = async (newStatus: TripStatus = "Arrived") => {
    setIsTracking(false);
    if (watchIdRef.current) {
      await Geolocation.clearWatch({ id: watchIdRef.current });
      watchIdRef.current = null;
    }
    
    if (activeTripId) {
      const tripRef = doc(firestore, "busTrips", activeTripId);
      updateDocumentNonBlocking(tripRef, { 
        isLive: false,
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
        currentLocationDescription: newStatus === "Arrived" ? "وصل للمحطة النهائية" : "في المحطة"
      });
      setActiveTripId(null);
    }

    toast({ title: "تم التوقف", description: `تم تحديث حالة الرحلة إلى: ${newStatus}` });
  };

  if (isBusesLoading || isTripsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-6">
      <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto border border-red-100 shadow-xl">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-black">حساب السائق غير مرتبط</h1>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
          عذراً، بريدك الإلكتروني ({user?.email}) غير مرتب بأي حافلة حالياً. يرجى مراجعة الإدارة لربط بريدك بحافلة نشطة.
        </p>
      </div>
      <Button variant="outline" className="rounded-xl h-12 px-8" onClick={() => window.location.reload()}>تحديث الصفحة <RefreshCw className="h-4 w-4 mr-2" /></Button>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 text-right animate-in fade-in">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-sm border border-primary/5">
        <div className="text-right">
          <h1 className="text-2xl font-black text-primary leading-tight">لوحة القائد</h1>
          <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest flex items-center gap-1 justify-end">
             {myBus.licensePlate} | {myBus.model} <Bus className="h-2.5 w-2.5" />
          </p>
        </div>
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl",
          isTracking ? "bg-emerald-600 animate-pulse" : "bg-primary/5 border border-primary/10"
        )}>
          {isTracking ? <Loader2 className="h-8 w-8 text-white animate-spin" /> : <Bus className="h-8 w-8 text-primary" />}
        </div>
      </header>

      {isTracking && activeTripId ? (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300">
          <CardContent className="p-8 text-center space-y-6">
            <div className="relative inline-block">
              <div className="h-24 w-24 rounded-full bg-emerald-600 animate-ping absolute inset-0 m-auto opacity-20" />
              <div className="h-20 w-20 rounded-full bg-emerald-600 flex items-center justify-center relative z-10 shadow-2xl">
                <Navigation className="h-10 w-10 text-white animate-bounce" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Badge className="bg-emerald-600 text-white px-4 py-1 rounded-full font-black animate-pulse">بث الموقع المباشر نشط</Badge>
              <h2 className="text-xl font-black text-emerald-900">جاري بث موقع الرحلة {activeTripId}</h2>
              <p className="text-xs text-emerald-700/70 font-bold">الموقع المباشر يظهر الآن للركاب على الخريطة</p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button onClick={() => stopTracking("Arrived")} className="h-16 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-lg font-black gap-2 shadow-xl">
                <CheckCircle2 className="h-6 w-6" /> إنهاء الرحلة (وصلت للمحطة)
              </Button>
              <Button variant="outline" onClick={() => stopTracking("Delayed")} className="h-14 rounded-2xl border-emerald-200 text-emerald-800 font-bold">
                توقف مؤقت / الإبلاغ عن تأخير
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-lg text-primary">الرحلات المجدولة لك</h3>
            <Badge variant="outline" className="border-primary/10 text-primary">{myTrips?.length || 0} رحلة</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myTrips?.filter(t => t.status !== "Arrived").map(trip => (
              <Card key={trip.id} className="border-primary/5 shadow-sm rounded-3xl overflow-hidden hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <h4 className="font-black text-lg">{trip.originName} ⬅ {trip.destinationName}</h4>
                        <Badge className="bg-primary/10 text-primary font-black border-none">{trip.id}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-bold flex items-center gap-2 justify-end">
                        <Clock className="h-3 w-3" /> {new Date(trip.departureTime).toLocaleString('ar-EG', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => startTracking(trip.id)} 
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 font-black text-lg gap-3 shadow-lg"
                  >
                    <Play className="h-5 w-5 fill-white" /> بدء الرحلة وبث الموقع
                  </Button>
                </CardContent>
              </Card>
            ))}

            {(!myTrips || myTrips.length === 0) && (
              <div className="text-center p-16 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-primary/5">
                <Clock className="h-12 w-12 text-primary/10 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold text-sm">لا توجد رحلات مجدولة لحافلتك حالياً</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-6 bg-accent/5 rounded-[2rem] border border-accent/10">
        <h4 className="text-sm font-black text-accent mb-3 flex items-center gap-2 justify-end">
          تعليمات هامة للقائد
          <Info className="h-4 w-4" />
        </h4>
        <ul className="text-[10px] text-muted-foreground space-y-2 leading-relaxed font-bold text-right">
          <li>• تأكد من تفعيل الـ GPS في هاتفك قبل الضغط على "بدء الرحلة".</li>
          <li>• يفضل إبقاء التطبيق في الواجهة لضمان دقة البث للركاب.</li>
          <li>• اضغط على "إنهاء الرحلة" فور الوصول للمحطة النهائية لإبلاغ الركاب.</li>
          <li>• تم تفعيل خاصية البث في الخلفية لضمان استمرار التتبع حتى عند قفل الشاشة.</li>
        </ul>
      </div>
    </div>
  );
}