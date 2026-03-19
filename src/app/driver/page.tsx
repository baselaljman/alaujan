"use client"

import { useState, useRef, useEffect } from "react";
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
  Navigation,
  Activity,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Capacitor } from '@capacitor/core';

type TripStatus = "Scheduled" | "Departed" | "Delayed" | "Arrived";

export default function DriverDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
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

  const { data: myTrips, isLoading: isTrpsLoading } = useCollection(tripsQuery);

  const updateFirebaseLocation = (tripId: string, lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 8000) return; 

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
    if (!Capacitor.isNativePlatform()) {
      toast({ 
        variant: "destructive", 
        title: "منصة غير مدعومة", 
        description: "يجب تشغيل هذه الميزة من داخل تطبيق الأندرويد الفعلي." 
      });
      return;
    }

    setIsInitializing(true);
    try {
      // استيراد ديناميكي صريح لضمان نجاح البناء (Build)
      const { Geolocation } = await import('@capacitor/geolocation');
      const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');

      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted') {
        toast({ 
          variant: "destructive", 
          title: "صلاحيات الموقع", 
          description: "يجب اختيار 'السماح طوال الوقت' من إعدادات الهاتف ليعمل البث في الخلفية." 
        });
        setIsInitializing(false);
        return;
      }

      if (watcherIdRef.current) {
        try { await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current }); } catch (e) {}
      }

      setActiveTripId(tripId);

      const id = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: "يتم الآن بث موقع الحافلة للركاب مباشرة.",
          backgroundTitle: "البث المباشر نشط",
          requestPermissions: false,
          stale: false,
          distanceFilter: 10
        },
        (location, error) => {
          if (error) {
            console.error("Watcher Error:", error);
            return;
          }
          if (location) {
            updateFirebaseLocation(tripId, location.latitude, location.longitude);
          }
        }
      );
      watcherIdRef.current = id;

      const tripRef = doc(firestore, "busTrips", tripId);
      updateDocumentNonBlocking(tripRef, { status: "Departed", isLive: true });

      setIsTracking(true);
      toast({ title: "بدأ البث المباشر", description: "موقعك يظهر الآن للركاب على الخريطة" });
    } catch (e: any) {
      console.error("Critical Tracking Error:", e);
      toast({ 
        variant: "destructive", 
        title: "خطأ في التتبع", 
        description: e.message || "تأكد من تثبيت كافة المكتبات وتفعيل الصلاحيات."
      });
      setIsTracking(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopTracking = async (newStatus: TripStatus = "Arrived") => {
    setIsTracking(false);
    try {
      const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');
      if (watcherIdRef.current) {
        await BackgroundGeolocation.removeWatcher({ id: watcherIdRef.current });
      }
    } catch (e) {}
    
    watcherIdRef.current = null;
    
    if (activeTripId) {
      updateDocumentNonBlocking(doc(firestore, "busTrips", activeTripId), { 
        isLive: false,
        status: newStatus
      });
      setActiveTripId(null);
    }
  };

  if (isBusesLoading || isTrpsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-6">
      <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto border border-red-100 shadow-xl">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-xl font-black text-center">حساب غير مرتبط بحافلة</h1>
      <p className="text-sm text-muted-foreground">يرجى مراجعة الإدارة لربط بريدك بحافلة من الأسطول.</p>
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
          {isTracking ? <Activity className="h-8 w-8 text-white" /> : <Bus className="h-8 w-8 text-primary" />}
        </div>
      </header>

      <Card className="bg-amber-50 border-amber-200 rounded-[1.5rem] overflow-hidden border-2">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-right">
            <h4 className="text-xs font-black text-amber-900 mb-1">خطوة ضرورية للعمل في الخلفية</h4>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              لضمان استمرار البث، اذهب إلى: <br/>
              إعدادات الهاتف &gt; التطبيقات &gt; العوجان للسفر &gt; الموقع <br/>
              واختر <b>"السماح طوال الوقت"</b>.
            </p>
          </div>
        </CardContent>
      </Card>

      {isTracking && activeTripId ? (
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-emerald-600 flex items-center justify-center mx-auto shadow-2xl">
              <Navigation className="h-10 w-10 text-white animate-bounce" />
            </div>
            <div className="space-y-2">
              <Badge className="bg-emerald-600 text-white px-4 py-1 rounded-full font-black animate-pulse">جاري البث المباشر</Badge>
              <h2 className="text-xl font-black text-emerald-900">الرحلة النشطة: {activeTripId}</h2>
              <p className="text-xs text-emerald-700/70">موقع الحافلة يظهر الآن على خريطة الركاب</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Button onClick={() => stopTracking("Arrived")} className="w-full h-16 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-lg font-black gap-2 shadow-xl">
                <CheckCircle2 className="h-6 w-6" /> تأكيد الوصول وإنهاء الرحلة
              </Button>
              <Button variant="ghost" onClick={() => stopTracking("Departed")} className="text-emerald-700 font-bold">
                توقف مؤقت للبث
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-black text-lg text-primary">الرحلات المجدولة لك</h3>
            <Badge variant="outline" className="rounded-lg">{myTrips?.length || 0} رحلات</Badge>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {myTrips?.filter(t => t.status !== "Arrived").sort((a,b) => b.createdAt?.localeCompare(a.createdAt)).map(trip => (
              <Card key={trip.id} className="border-primary/5 shadow-sm rounded-3xl overflow-hidden bg-white/50 hover:bg-white transition-colors">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-right">
                      <h4 className="font-black text-lg">{trip.originName} {" ⬅ "} {trip.destinationName}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-1">
                        <ActivityIcon className="h-2 w-2" /> الحالة: {trip.status === "Departed" ? "على الطريق" : "مجدولة"}
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary font-black px-3">{trip.id}</Badge>
                  </div>
                  
                  <Button 
                    disabled={isInitializing}
                    onClick={() => startTracking(trip.id)} 
                    className={cn(
                      "w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-md",
                      trip.status === "Departed" ? "bg-amber-600 hover:bg-amber-700" : "bg-primary"
                    )}
                  >
                    {isInitializing ? <Loader2 className="h-5 w-5 animate-spin" /> : trip.status === "Departed" ? (
                      <><RefreshCw className="h-5 w-5" /> إعادة تشغيل البث المباشر</>
                    ) : (
                      <><Play className="h-5 w-5 fill-white" /> بدء البث المباشر للرحلة</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-3">
        <h4 className="font-bold text-sm flex items-center gap-2 justify-end">تعليمات القائد <ShieldCheck className="h-4 w-4 text-emerald-600" /></h4>
        <ul className="text-[10px] text-muted-foreground space-y-1 text-right">
          <li>• تأكد من اختيار "السماح طوال الوقت" للموقع ليعمل البث والشاشة مقفلة.</li>
          <li>• سيظهر لك إشعار دائم في أعلى الهاتف طوال فترة البث.</li>
          <li>• عند الوصول للمحطة النهائية، اضغط "تأكيد الوصول" لإغلاق الرحلة.</li>
        </ul>
      </div>
    </div>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}