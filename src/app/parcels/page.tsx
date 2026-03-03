
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Truck, MapPin, ArrowLeft, Info, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ParcelsPage() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = () => {
    if (!trackingId) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsTracking(true);
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold text-primary font-headline">خدمة الطرود</h1>
        <p className="text-muted-foreground">شحن وتتبع الطرود بين المحافظات</p>
      </header>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="text-right">
          <CardTitle className="text-lg">تتبع طردك</CardTitle>
          <CardDescription>أدخل رقم الشحنة المرتبط بالحافلة والمحافظة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="مثلاً: AWJ-PRC-772"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="h-12 rounded-xl"
            />
            <Button onClick={handleTrack} disabled={isLoading} className="h-12 px-8 rounded-xl bg-primary">
              {isLoading ? "جاري البحث..." : <><Search className="h-4 w-4 ml-2" /> تتبع</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isTracking ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden border-primary/20 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-primary/5 border-b py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-sm">شحنة رقم: {trackingId}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Al-Awajan Express</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3 font-bold">
                  على متن الحافلة
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-right">
              {/* ربط الحافلة والمحافظة */}
              <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-accent" />
                    <span className="text-xs font-bold text-accent">حافلة رقم: AWJ-700</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">المحافظة الحالية: عمان</span>
                  </div>
                </div>
                <Progress value={65} className="h-1.5" />
                <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase">
                  <span>الرياض (نقطة الانطلاق)</span>
                  <span>دمشق (الوجهة النهائية)</span>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:right-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-muted/40">
                <div className="relative pr-8 flex items-start gap-3">
                  <div className="absolute right-1.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                  <div>
                    <p className="text-sm font-bold">عمان - مركز الفرز</p>
                    <p className="text-xs text-muted-foreground">تم تحميل الطرد على الحافلة AWJ-700 المتوجهة لدمشق</p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-bold">اليوم • 09:30 صباحاً</p>
                  </div>
                </div>
                <div className="relative pr-8 flex items-start gap-3 opacity-60">
                  <div className="absolute right-1.5 top-1 h-3 w-3 rounded-full bg-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold">الرياض - المكتب الرئيسي</p>
                    <p className="text-xs text-muted-foreground">تم استلام الطرد من المرسل</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    يتم تتبع الطرد بناءً على موقع هاتف السائق المرتبط بالحافلة. سيتم إخطارك عند وصول الطرد إلى مكتب المحافظة المستهدفة.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-none shadow-sm hover:bg-primary/10 transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center gap-2">
              <Truck className="h-10 w-10 text-primary opacity-70" />
              <h4 className="font-bold text-sm">شحن دولي</h4>
              <p className="text-[10px] text-muted-foreground">الرياض - عمان - دمشق</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none shadow-sm hover:bg-primary/10 transition-colors">
            <CardContent className="p-6 flex flex-col items-center text-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-primary opacity-70" />
              <h4 className="font-bold text-sm">توصيل للمكتب</h4>
              <p className="text-[10px] text-muted-foreground">استلام آمن من كافة الفروع</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
