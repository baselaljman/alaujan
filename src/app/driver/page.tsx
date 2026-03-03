
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bus, MapPin, Users, CheckCircle2, Play, Square, Loader2, AlertTriangle, Clock, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

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
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: "1", name: "أحمد محمد علي", seat: 5, checkedIn: true },
    { id: "2", name: "سارة خالد", seat: 12, checkedIn: false },
    { id: "3", name: "محمود حسن", seat: 18, checkedIn: false },
    { id: "4", name: "ليلى يوسف", seat: 22, checkedIn: true },
  ]);

  // معرف الرحلة الثابت للتجربة (يجب استبداله بمعرف ديناميكي للسائق المسجل)
  const TRIP_ID = "AWJ-TRIP-TEST";

  const toggleCheckIn = (id: string) => {
    setPassengers(prev => prev.map(p => 
      p.id === id ? { ...p, checkedIn: !p.checkedIn } : p
    ));
    toast({
      title: "تحديث الحالة",
      description: "تم تغيير حالة صعود الراكب بنجاح.",
    });
  };

  const handleStatusChange = (newStatus: TripStatus) => {
    setTripStatus(newStatus);
    if (newStatus === "Departed" || newStatus === "Delayed") {
      setIsTracking(true);
    } else {
      setIsTracking(false);
    }

    // تحديثFirestore بشكل فوري (Non-blocking) ليرى المستخدم التغيير
    const tripRef = doc(firestore, "busTrips", TRIP_ID);
    updateDocumentNonBlocking(tripRef, {
      status: newStatus,
      lastUpdatedAt: new Date().toISOString(),
      // في تطبيق حقيقي، سنقوم بتحديث الموقع الجغرافي هنا أيضاً
      currentLocationDescription: newStatus === "Delayed" ? "إجراءات الحدود" : "على الطريق"
    });

    toast({
      title: "تحديث حالة الرحلة",
      description: `تم تغيير حالة الرحلة إلى: ${newStatus}`,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">لوحة القائد</h1>
          <p className="text-xs text-muted-foreground">مرحباً كابتن: محمد العتوم</p>
        </div>
        <Badge 
          variant={tripStatus === "Departed" ? "default" : tripStatus === "Delayed" ? "destructive" : "secondary"}
          className={cn(
            tripStatus === "Departed" && "bg-green-600",
            tripStatus === "Delayed" && "bg-red-600 animate-pulse"
          )}
        >
          {tripStatus === "Scheduled" && "مجدولة"}
          {tripStatus === "Departed" && "رحلة نشطة"}
          {tripStatus === "Delayed" && "تأخير مسجل"}
          {tripStatus === "Arrived" && "مكتملة"}
        </Badge>
      </header>

      <Card className="border-primary/10 shadow-lg overflow-hidden">
        <CardHeader className="bg-primary/5 border-b py-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              حافلة رقم: AWJ-700
            </CardTitle>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">الرياض ⮕ دمشق</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {tripStatus === "Scheduled" ? (
              <Button onClick={() => handleStatusChange("Departed")} className="w-full h-14 text-lg font-bold gap-2 rounded-xl bg-primary">
                <Play className="h-5 w-5" /> بدء الرحلة وبث الموقع
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-xs font-bold text-right pr-1">تحديث حالة الرحلة للركاب</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={tripStatus === "Delayed" ? "destructive" : "outline"} 
                      onClick={() => handleStatusChange("Delayed")}
                      className="h-12 rounded-xl gap-2 text-xs"
                    >
                      <AlertTriangle className="h-4 w-4" /> تسجيل تأخير
                    </Button>
                    <Button 
                      variant={tripStatus === "Departed" ? "default" : "outline"} 
                      onClick={() => handleStatusChange("Departed")}
                      className={cn("h-12 rounded-xl gap-2 text-xs", tripStatus === "Departed" && "bg-green-600")}
                    >
                      <Clock className="h-4 w-4" /> في الموعد
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-2xl border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isTracking && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    <span className="text-sm font-bold">بث الموقع المباشر مفعل</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleStatusChange("Arrived")}>
                    <Square className="h-4 w-4 ml-2" /> إنهاء الرحلة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            تحضير الركاب ({passengers.filter(p => p.checkedIn).length}/{passengers.length})
          </h2>
        </div>
        
        <div className="space-y-2">
          {passengers.map((passenger) => (
            <Card key={passenger.id} className={`transition-all border-none shadow-sm ring-1 ${passenger.checkedIn ? 'ring-green-200 bg-green-50/20' : 'ring-border bg-white'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black ${passenger.checkedIn ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {passenger.seat}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{passenger.name}</p>
                    <p className="text-[10px] text-muted-foreground">تذكرة: VIP-00{passenger.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground">{passenger.checkedIn ? "صعد" : "لم يصعد"}</span>
                  <Switch 
                    checked={passenger.checkedIn} 
                    onCheckedChange={() => toggleCheckIn(passenger.id)}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-4 bg-accent/5 rounded-2xl border border-accent/20 text-right space-y-2">
        <h4 className="text-sm font-bold text-accent flex items-center gap-2 justify-end">
          تعليمات هامة للقائد
          <Info className="h-4 w-4" />
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          عند حدوث أي تأخير في إجراءات الجمارك أو الحدود، يرجى الضغط على "تسجيل تأخير" ليتم إبلاغ الركاب وذويهم آلياً عبر نظام التتبع. لا تنسَ إنهاء الرحلة عند الوصول لتوفير البطارية وإيقاف البث.
        </p>
      </div>
    </div>
  );
}
