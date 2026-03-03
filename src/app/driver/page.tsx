
"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bus, Users, Play, Square, Loader2, AlertTriangle, Clock, Info, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, where, getDocs } from "firebase/firestore";

interface Passenger {
  id: string;
  name: string;
  seat: number;
  checkedIn: boolean;
}

type TripStatus = "Scheduled" | "Departed" | "Delayed" | "Arrived";

export default function DriverDashboard() {
  const firestore = useFirestore();
  const [tripStatus, setTripStatus] = useState<TripStatus>("Scheduled");
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: "1", name: "أحمد محمد علي", seat: 5, checkedIn: true },
    { id: "2", name: "سارة خالد", seat: 12, checkedIn: false },
    { id: "3", name: "محمود حسن", seat: 18, checkedIn: false },
    { id: "4", name: "ليلى يوسف", seat: 22, checkedIn: true },
  ]);

  // معرف الرحلة التجريبي (يمكن تغييره ديناميكياً)
  const TRIP_ID = "AWJ-TRIP-TEST";

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "خطأ في التتبع",
        description: "متصفحك لا يدعم نظام تحديد المواقع (GPS).",
      });
      return;
    }

    setIsTracking(true);
    
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // إرسال التحديث فقط إذا مر 10 ثوانٍ على الأقل للحفاظ على البطارية والبيانات
        if (now - lastUpdateRef.current < 10000) return;

        const { latitude, longitude } = position.coords;
        lastUpdateRef.current = now;
        
        const tripRef = doc(firestore, "busTrips", TRIP_ID);
        updateDocumentNonBlocking(tripRef, {
          currentLat: latitude,
          currentLng: longitude,
          lastLocationUpdate: new Date().toISOString(),
          isLive: true
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsTracking(false);
        toast({
          variant: "destructive",
          title: "فشل تتبع الموقع",
          description: "يرجى التأكد من تفعيل الـ GPS وإعطاء الإذن للمتصفح.",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    
    const tripRef = doc(firestore, "busTrips", TRIP_ID);
    updateDocumentNonBlocking(tripRef, { isLive: false });
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) stopLocationTracking();
    };
  }, []);

  const toggleCheckIn = (id: string) => {
    setPassengers(prev => prev.map(p => 
      p.id === id ? { ...p, checkedIn: !p.checkedIn } : p
    ));
    toast({ title: "تحديث الحالة", description: "تم تغيير حالة صعود الراكب." });
  };

  const syncParcelsStatus = async (newTripStatus: TripStatus) => {
    try {
      const parcelsRef = collection(firestore, "parcels");
      const q = query(parcelsRef, where("busTripId", "==", TRIP_ID));
      const snapshot = await getDocs(q);

      snapshot.forEach((parcelDoc) => {
        let newParcelStatus = "Pending Pickup";
        if (newTripStatus === "Departed") newParcelStatus = "In Transit";
        if (newTripStatus === "Delayed") newParcelStatus = "Delayed in Transit";
        if (newTripStatus === "Arrived") newParcelStatus = "Arrived at Station";

        updateDocumentNonBlocking(doc(firestore, "parcels", parcelDoc.id), {
          status: newParcelStatus,
          lastUpdatedAt: new Date().toISOString()
        });
      });
    } catch (error) {
      console.error("Error syncing parcels:", error);
    }
  };

  const handleStatusChange = (newStatus: TripStatus) => {
    setTripStatus(newStatus);
    
    if (newStatus === "Departed") {
      startLocationTracking();
    } else if (newStatus === "Arrived" || newStatus === "Scheduled") {
      stopLocationTracking();
    }

    const tripRef = doc(firestore, "busTrips", TRIP_ID);
    updateDocumentNonBlocking(tripRef, {
      status: newStatus,
      lastUpdatedAt: new Date().toISOString(),
      currentLocationDescription: newStatus === "Delayed" ? "إجراءات الحدود" : 
                                   newStatus === "Departed" ? "على الطريق" : 
                                   newStatus === "Arrived" ? "تم الوصول للمحطة" : "في المحطة"
    });

    syncParcelsStatus(newStatus);

    toast({
      title: "تحديث حالة الرحلة",
      description: `تم تغيير الحالة إلى: ${newStatus} وبدأ بث الموقع المباشر.`,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">لوحة القائد</h1>
          <p className="text-xs text-muted-foreground">كابتن: محمد العتوم (حافلة AWJ-700)</p>
        </div>
        <Badge 
          variant={tripStatus === "Departed" ? "default" : tripStatus === "Delayed" ? "destructive" : "secondary"}
          className={cn(
            tripStatus === "Departed" && "bg-green-600 animate-pulse",
            tripStatus === "Delayed" && "bg-red-600 animate-pulse"
          )}
        >
          {tripStatus === "Scheduled" && "مجدولة"}
          {tripStatus === "Departed" && "بث الموقع مباشر"}
          {tripStatus === "Delayed" && "تأخير مسجل"}
          {tripStatus === "Arrived" && "مكتملة"}
        </Badge>
      </header>

      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Bus className="h-5 w-5" />
              التحكم في البث الحي
            </CardTitle>
            {isTracking && (
              <span className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
                <MapPin className="h-3 w-3 animate-bounce" /> جاري إرسال الموقع...
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {tripStatus === "Scheduled" ? (
              <Button onClick={() => handleStatusChange("Departed")} className="w-full h-16 text-lg font-bold gap-2 rounded-2xl bg-primary shadow-xl">
                <Play className="h-6 w-6" /> بدء الرحلة وتفعيل الـ GPS
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={tripStatus === "Delayed" ? "destructive" : "outline"} 
                    onClick={() => handleStatusChange("Delayed")}
                    className="h-14 rounded-xl gap-2 text-sm font-bold"
                  >
                    <AlertTriangle className="h-4 w-4" /> تسجيل تأخير
                  </Button>
                  <Button 
                    variant={tripStatus === "Arrived" ? "secondary" : "default"} 
                    onClick={() => handleStatusChange("Arrived")}
                    className="h-14 rounded-xl gap-2 text-sm font-bold"
                  >
                    <Square className="h-4 w-4" /> إنهاء الرحلة
                  </Button>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">بث الإحداثيات نشط الآن</span>
                  </div>
                  <Badge className="bg-emerald-600">LIVE</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-bold flex items-center gap-2 px-1">
          <Users className="h-5 w-5 text-primary" />
          تحضير الركاب ({passengers.filter(p => p.checkedIn).length}/{passengers.length})
        </h2>
        
        <div className="space-y-2">
          {passengers.map((passenger) => (
            <Card key={passenger.id} className={`transition-all border-none shadow-sm ring-1 ${passenger.checkedIn ? 'ring-emerald-100 bg-emerald-50/20' : 'ring-border bg-white'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black ${passenger.checkedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                    {passenger.seat}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{passenger.name}</p>
                    <p className="text-[10px] text-muted-foreground">رقم التذكرة: AWJ-{passenger.id}00</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">{passenger.checkedIn ? "صعد" : "انتظار"}</span>
                  <Switch 
                    checked={passenger.checkedIn} 
                    onCheckedChange={() => toggleCheckIn(passenger.id)}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 text-right space-y-2">
        <h4 className="text-sm font-bold text-accent flex items-center gap-2 justify-end">
          تنبيه فني للقائد
          <Info className="h-4 w-4" />
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          يرجى إبقاء هذه الصفحة مفتوحة في المتصفح طوال فترة الرحلة لضمان استمرار بث موقعك. يتم تحديث الموقع في قاعدة البيانات كل 10 ثوانٍ لضمان الدقة مع توفير الطاقة.
        </p>
      </div>
    </div>
  );
}
