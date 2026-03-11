"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2, AlertTriangle, Clock, Info, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { Capacitor, registerPlugin } from '@capacitor/core';

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

  const busesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "buses"), where("driverEmail", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);

  const { data: assignedBuses, isLoading: isBusesLoading } = useCollection(busesQuery);
  const myBus = assignedBuses?.[0];

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !myBus) return null;
    return query(collection(firestore, "busTrips"), where("busId", "==", myBus.id));
  }, [firestore, myBus]);

  const { data: myTrips, isLoading: isTripsLoading } = useCollection(tripsQuery);

  useEffect(() => {
    if (myTrips && myTrips.length > 0) {
      const active = myTrips.find(t => t.status !== "Arrived") || myTrips[0];
      setActiveTripId(active.id);
      setTripStatus(active.status as TripStatus);
    }
  }, [myTrips]);

  const updateFirebaseLocation = (lat: number, lng: number) => {
    if (!activeTripId) return;
    const now = Date.now();
    if (now - lastUpdateRef.current < 15000) return;

    lastUpdateRef.current = now;
    const tripRef = doc(firestore, "busTrips", activeTripId);
    
    updateDocumentNonBlocking(tripRef, {
      currentLat: lat,
      currentLng: lng,
      lastLocationUpdate: new Date().toISOString(),
      isLive: true,
      status: "Departed"
    });
  };

  const startTracking = async () => {
    if (!activeTripId) return;
    
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
        description: "تأكد من اختيار 'Allow all the time' في إعدادات الموقع" 
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
    
    if (newStatus !== "Departed") {
      stopTracking();
    }

    setTripStatus(newStatus);
    const tripRef = doc(firestore, "busTrips", activeTripId);
    
    updateDocumentNonBlocking(tripRef, {
      status: newStatus,
      lastUpdatedAt: new Date().toISOString(),
      currentLocationDescription: newStatus === "Departed" ? "على الطريق" : 
                                   newStatus === "Arrived" ? "وصل للمحطة" : "في المحطة"
    });

    if (newStatus === "Departed") {
      startTracking();
    }

    toast({ title: "تم تحديث الحالة", description: `حالة الرحلة الآن: ${newStatus}` });
  };

  if (isBusesLoading || isTripsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-4">
      <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold">لا توجد حافلة مرتبطة بحسابك</h1>
      <p className="text-muted-foreground text-sm">يرجى من الإدارة ربط بريدك {user?.email} بحافلة من لوحة الإدارة.</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-bold font-headline text-primary">لوحة القائد</h1>
          <p className="text-xs text-muted-foreground">حافلة: {myBus.licensePlate} | الكابتن: {user?.displayName || user?.email}</p>
        </div>
        <Badge variant={tripStatus === "Departed" ? "default" : "secondary"} className={cn(tripStatus === "Departed" && "bg-green-600 animate-pulse")}>
          {tripStatus === "Departed" ? "بث مباشر نشط" : "انتظار"}
        </Badge>
      </header>

      {!activeTripId ? (
        <Card className="p-8 text-center bg-muted/20">
          <Clock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-bold">لا توجد رحلات مجدولة لهذه الحافلة اليوم</p>
        </Card>
      ) : (
        <Card className="border-primary/10 shadow-lg rounded-[2rem]">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 justify-end">
              <span>التحكم في تتبع الرحلة: {activeTripId}</span>
              <MapPin className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {tripStatus !== "Departed" ? (
                <Button onClick={() => handleStatusChange("Departed")} className="w-full h-16 text-lg font-bold gap-2 rounded-2xl bg-primary shadow-xl">
                  <Play className="h-6 w-6" /> بدء الرحلة وبث الموقع
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-800">جاري البث في الخلفية...</span>
                    </div>
                    <Badge className="bg-emerald-600">LIVE</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => handleStatusChange("Delayed")} className="h-14 rounded-xl font-bold border-red-200 text-red-600">تسجيل تأخير</Button>
                    <Button variant="default" onClick={() => handleStatusChange("Arrived")} className="h-14 rounded-xl font-bold bg-slate-900">إنهاء الرحلة</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 text-right">
        <h4 className="text-xs font-bold text-accent mb-2 flex items-center gap-2 justify-end">دليل السائق للأندرويد <Info className="h-3 w-3" /></h4>
        <ul className="text-[10px] text-muted-foreground space-y-2 leading-relaxed">
          <li>1. اضغط "بدء الرحلة" عند التحرك من المحطة.</li>
          <li>2. في حال طلب النظام، اختر <strong>"Allow all the time"</strong> لضمان استمرار البث عند قفل الشاشة.</li>
          <li>3. تأكد من تفعيل الـ GPS (الموقع) في هاتفك.</li>
          <li>4. سيظهر إشعار في أعلى الهاتف يثبت أن البث نشط، لا تقم بإغلاق التطبيق تماماً.</li>
        </ul>
      </div>
    </div>
  );
}