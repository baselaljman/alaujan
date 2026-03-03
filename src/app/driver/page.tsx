
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bus, MapPin, Users, CheckCircle2, Play, Square, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Passenger {
  id: string;
  name: string;
  seat: number;
  checkedIn: boolean;
}

export default function DriverDashboard() {
  const [isTripActive, setIsTripActive] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>([
    { id: "1", name: "أحمد محمد علي", seat: 5, checkedIn: true },
    { id: "2", name: "سارة خالد", seat: 12, checkedIn: false },
    { id: "3", name: "محمود حسن", seat: 18, checkedIn: false },
    { id: "4", name: "ليلى يوسف", seat: 22, checkedIn: true },
  ]);

  const toggleCheckIn = (id: string) => {
    setPassengers(prev => prev.map(p => 
      p.id === id ? { ...p, checkedIn: !p.checkedIn } : p
    ));
    toast({
      title: "تحديث الحالة",
      description: "تم تغيير حالة صعود الراكب بنجاح.",
    });
  };

  const handleStartTrip = () => {
    setIsTripActive(true);
    setIsTracking(true);
    toast({
      title: "بدء الرحلة",
      description: "تم تفعيل تتبع الموقع المباشر بنجاح.",
    });
  };

  const handleEndTrip = () => {
    setIsTripActive(false);
    setIsTracking(false);
    toast({
      title: "إنهاء الرحلة",
      description: "تم إيقاف التتبع وحفظ تقرير الرحلة.",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline text-primary">لوحة القائد</h1>
          <p className="text-xs text-muted-foreground">مرحباً كابتن: محمد العتوم</p>
        </div>
        <Badge variant={isTripActive ? "default" : "secondary"} className={isTripActive ? "bg-green-600" : ""}>
          {isTripActive ? "رحلة نشطة" : "متوقف"}
        </Badge>
      </header>

      {/* Trip Info Card */}
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
        <CardContent className="p-6 space-y-4">
          {!isTripActive ? (
            <Button onClick={handleStartTrip} className="w-full h-14 text-lg font-bold gap-2 rounded-xl">
              <Play className="h-5 w-5" /> بدء بث الموقع والرحلة
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center gap-2 text-green-800">
                  {isTracking && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span className="text-sm font-bold">جاري بث الموقع الآن...</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleEndTrip}>
                  <Square className="h-4 w-4 ml-1" /> إنهاء
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">الوقت المنقضي</p>
                  <p className="font-bold">02:45:00</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">المسافة المتبقية</p>
                  <p className="font-bold">450 كم</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passengers List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            قائمة الركاب ({passengers.filter(p => p.checkedIn).length}/{passengers.length})
          </h2>
        </div>
        
        <div className="space-y-2">
          {passengers.map((passenger) => (
            <Card key={passenger.id} className={`transition-all border-none shadow-sm ring-1 ${passenger.checkedIn ? 'ring-green-200 bg-green-50/20' : 'ring-border bg-white'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${passenger.checkedIn ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {passenger.seat}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{passenger.name}</p>
                    <p className="text-[10px] text-muted-foreground">رقم التذكرة: TK-00{passenger.id}</p>
                  </div>
                </div>
                <Switch 
                  checked={passenger.checkedIn} 
                  onCheckedChange={() => toggleCheckIn(passenger.id)}
                  className="data-[state=checked]:bg-green-600"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-right space-y-2">
        <h4 className="text-sm font-bold text-primary flex items-center gap-2 justify-end">
          تعليمات الكابتن
          <MapPin className="h-4 w-4" />
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          يرجى التأكد من تفعيل GPS قبل بدء الرحلة. قم بتبديل مفتاح الراكب عند صعوده للحافلة لتحديث حالته في النظام تلقائياً.
        </p>
      </div>
    </div>
  );
}
