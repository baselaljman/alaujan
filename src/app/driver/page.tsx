"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Loader2, 
  AlertTriangle, 
  Bus, 
  CheckCircle2,
  RefreshCw,
  Navigation
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';

type TripStatus = "Scheduled" | "Departed" | "Delayed" | "Arrived";

export default function DriverDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watcherIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const busesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "buses"), where("driverEmail", "==", user.email.toLowerCase().trim()));
  }, [firestore, user?.email]);

  const { data: assignedBuses, isLoading: isBusesLoading } = useCollection(busesQuery);
  const myBus = assignedBuses?.[0];

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !myBus) return null;
    return query(collection(firestore, "busTrips"), where("busId", "==", myBus.id));
  }, [firestore, myBus]);

  const { data: myTrips, isLoading: isTripsLoading } = useCollection(tripsQuery);

  const updateFirebaseLocation = (tripId: string, lat: number, lng: number) => {
    const now = Date.now();
    // تقييد التحديثات لتكون كل 10 ثوانٍ لضمان استقرار البث والبطارية
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
      setActiveTripId(tripId);
      
      // بدء مراقبة الموقع باستخدام BackgroundGeolocation (الحزمة المجتمعية)
      // تضمن هذه الحزمة استمرار العمل حتى لو أغلق التطبيق أو قفل الهاتف
      const id = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "يتم الآن بث موقع الحافلة للركاب في الخلفية.",
          backgroundTitle: "البث المباشر نشط - العوجان للسفر",
          requestPermissions: true,
          stale: false,
          distanceFilter: 10 // تحديث كل 10 أمتار حركة
        },
        (location, error) => {
          if (error) {
            console.error("Background Tracking Error:", error);
            if (error.code === "NOT_AUTHORIZED") {
              toast({ 
                variant: "destructive", 
                title: "تصريح الموقع مطلوب", 
                description: "يرجى تفعيل 'السماح دوماً' في إعدادات التطبيق." 
              });
            }
            return;
          }
          if (location) {
            updateFirebaseLocation(tripId, location.latitude, location.longitude);
          }
        }
      );

      watcherIdRef.current = id;

      const tripRef = doc(firestore, "busTrips", tripId);
      updateDocumentNonBlocking(tripRef, {
        status: "Departed",
        lastUpdatedAt: new Date().toISOString(),
        currentLocationDescription: "بدأت الرحلة",
        isLive: true
      });

      setIsTracking(true);
      toast({ title: "تم تفعيل البث المباشر", description: "البث يعمل الآن في الخلفية وبدقة عالية" });
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "خطأ في التتبع", 
        description: "يرجى التأكد من تفعيل الـ GPS وصلاحيات الخلفية." 
      });
      setIsTracking(false);
    }
  };

  const stopTracking = async (newStatus: TripStatus = "Arrived") => {
    setIsTracking(false);
    if (watcherIdRef.current) {
      await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
      watcherIdRef.current = null;
    }
    
    if (activeTripId) {
      const tripRef = doc(firestore, "busTrips", activeTripId);
      updateDocumentNonBlocking(tripRef, { 
        isLive: false,
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
        currentLocationDescription: newStatus === "Arrived" ? "وصل للمحطة النهائية" : "توقف مؤقت"
      });
      setActiveTripId(null);
    }

    toast({ title: "تم تحديث الحالة", description: `حالة الرحلة الآن: ${newStatus}` });
  };

  if (isBusesLoading || isTripsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-6">
      <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto border border-red-100 shadow-xl">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <div className="space-y-2 text-right">
        <h1 className="text-xl font-black text-center">حساب غير مرتبط بحافلة</h1>
        <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto text-center">
          بريدك الإلكتروني ({user?.email}) غير مرتب بأي حافلة حالياً.
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
             لوحة: {myBus.licensePlate} | {myBus.model} <Bus className="h-2.5 w-2.5" />
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
              <Badge className="bg-emerald-600 text-white px-4 py-1 rounded-full font-black animate-pulse">جاري البث المباشر (خلفية)</Badge>
              <h2 className="text-xl font-black text-emerald-900">الرحلة النشطة: {activeTripId}</h2>
              <p className="text-xs text-emerald-700/70 font-bold">البث يعمل حتى لو أغلقت التطبيق</p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Button onClick={() => stopTracking("Arrived")} className="h-16 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-lg font-black gap-2 shadow-xl">
                <CheckCircle2 className="h-6 w-6" /> تأكيد الوصول للمحطة النهائية
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-lg text-primary">الرحلات المجدولة لك</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myTrips?.filter(t => t.status !== "Arrived").map(trip => (
              <Card key={trip.id} className="border-primary/5 shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2 justify-end">
                        <h4 className="font-black text-lg">{trip.originName} ⬅ {trip.destinationName}</h4>
                        <Badge className="bg-primary/10 text-primary font-black border-none">{trip.id}</Badge>
                      </div>
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
          </div>
        </div>
      )}
    </div>
  );
}