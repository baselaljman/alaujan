
"use client"

import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, Square, Loader2, AlertTriangle, Clock, Info, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, getDocs } from "firebase/firestore";

type TripStatus = "Scheduled" | "Departed" | "Delayed" | "Arrived";

export default function DriverDashboard() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus>("Scheduled");
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const busesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "buses"), where("driverEmail", "==", user.email));
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

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "خطأ", description: "GPS غير مدعوم في هذا الجهاز" });
      return;
    }

    if (!activeTripId) return;

    setIsTracking(true);
    const tripRef = doc(firestore, "busTrips", activeTripId);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < 10000) return;

        const { latitude, longitude } = position.coords;
        lastUpdateRef.current = now;
        
        updateDocumentNonBlocking(tripRef, {
          currentLat: latitude,
          currentLng: longitude,
          lastLocationUpdate: new Date().toISOString(),
          isLive: true,
          status: "Departed"
        });
      },
      (error) => {
        // Avoid console.error to prevent red screen overlay in studio
        toast({ 
          variant: "destructive", 
          title: "تنبيه الـ GPS", 
          description: "تعذر تحديث موقعك المباشر. يرجى تفعيل خدمة الموقع وإعادة المحاولة." 
        });
        setIsTracking(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  };

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    if (activeTripId) {
      const tripRef = doc(firestore, "busTrips", activeTripId);
      updateDocumentNonBlocking(tripRef, { isLive: false });
    }
  };

  const syncParcelsStatus = async (newTripStatus: TripStatus) => {
    if (!activeTripId) return;
    try {
      const q = query(collection(firestore, "parcels"), where("busTripId", "==", activeTripId));
      const snapshot = await getDocs(q);
      snapshot.forEach((parcelDoc) => {
        let status = "Pending Pickup";
        if (newTripStatus === "Departed") status = "In Transit";
        if (newTripStatus === "Arrived") status = "Arrived at Station";
        updateDocumentNonBlocking(doc(firestore, "parcels", parcelDoc.id), {
          status,
          lastUpdatedAt: new Date().toISOString()
        });
      });
    } catch (e) {}
  };

  const handleStatusChange = (newStatus: TripStatus) => {
    if (!activeTripId) return;
    setTripStatus(newStatus);
    const tripRef = doc(firestore, "busTrips", activeTripId);
    
    updateDocumentNonBlocking(tripRef, {
      status: newStatus,
      lastUpdatedAt: new Date().toISOString(),
      currentLocationDescription: newStatus === "Departed" ? "على الطريق" : 
                                   newStatus === "Arrived" ? "وصل للمحطة" : "في المحطة"
    });

    if (newStatus === "Departed") {
      startLocationTracking();
    } else if (newStatus === "Arrived") {
      stopLocationTracking();
    }

    syncParcelsStatus(newStatus);
    toast({ title: "تم تحديث الحالة", description: `حالة الرحلة الآن: ${newStatus}` });
  };

  if (isBusesLoading || isTripsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (!myBus) return (
    <div className="p-12 text-center space-y-4">
      <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-xl font-bold">لا توجد حافلة مرتبطة بحسابك</h1>
      <p className="text-muted-foreground text-sm text-center">يرجى من الإدارة ربط بريدك {user?.email} بحافلة من لوحة الإدارة.</p>
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
          {tripStatus === "Departed" ? "بث مباشر" : "انتظار"}
        </Badge>
      </header>

      {!activeTripId ? (
        <Card className="p-8 text-center bg-muted/20">
          <Clock className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-bold">لا توجد رحلات مجدولة لهذه الحافلة اليوم</p>
        </Card>
      ) : (
        <Card className="border-primary/10 shadow-lg">
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
                  <Play className="h-6 w-6" /> بدء الرحلة وتفعيل GPS
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-800">جاري إرسال موقعك الآن...</span>
                    </div>
                    <Badge className="bg-emerald-600">LIVE</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => handleStatusChange("Delayed")} className="h-14 rounded-xl font-bold border-red-200 text-red-600">تسجيل تأخير</Button>
                    <Button variant="default" onClick={() => handleStatusChange("Arrived")} className="h-14 rounded-xl font-bold">إنهاء الرحلة</Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 text-right">
        <h4 className="text-xs font-bold text-accent mb-1 flex items-center gap-2 justify-end">تنبيه فني <Info className="h-3 w-3" /></h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">تأكد من بقاء هذه الصفحة مفتوحة في المتصفح أثناء القيادة لضمان استمرار ظهور موقع الحافلة للركاب ولأصحاب الطرود.</p>
      </div>
    </div>
  );
}
