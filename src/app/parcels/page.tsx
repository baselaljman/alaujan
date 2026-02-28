"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, CheckCircle2, Truck, Box, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ParcelsPage() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary font-headline">خدمة الطرود</h1>
        <p className="text-muted-foreground">شحن وتتبع الطرود بين المدن</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-right">تتبع طردك</CardTitle>
          <CardDescription className="text-right">أدخل رقم التتبع للحصول على تحديثات الحالة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="مثلاً: AWJ-PRC-772"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="h-12"
            />
            <Button onClick={() => setIsTracking(true)} className="h-12 px-6">
              <Search className="h-4 w-4 ml-2" /> تتبع
            </Button>
          </div>
        </CardContent>
      </Card>

      {isTracking ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <Card>
            <CardContent className="p-6 space-y-6 text-right">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold">AWJ-PRC-772</h3>
                    <p className="text-xs text-muted-foreground">شحن قياسي</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-accent">قيد الانتقال</p>
                  <p className="text-xs text-muted-foreground">تحديث قبل ساعة</p>
                </div>
              </div>

              <div className="space-y-4">
                <Progress value={65} className="h-2" />
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span>الرياض</span>
                  <span>عمان</span>
                  <span>دمشق</span>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                <div className="relative pr-10 flex items-start gap-3">
                  <div className="absolute right-2.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                  <div>
                    <p className="text-sm font-bold">في الطريق - مركز عمان</p>
                    <p className="text-xs text-muted-foreground">وصل إلى مركز الفرز في عمان، الأردن</p>
                    <p className="text-[10px] text-muted-foreground mt-1">24 أكتوبر 2023 • 09:30 صباحاً</p>
                  </div>
                </div>
                <div className="relative pr-10 flex items-start gap-3">
                  <div className="absolute right-2.5 top-1 h-3 w-3 rounded-full bg-border" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">غادر مركز الرياض الرئيسي</p>
                    <p className="text-xs text-muted-foreground">23 أكتوبر 2023 • 10:00 مساءً</p>
                  </div>
                </div>
                <div className="relative pr-10 flex items-start gap-3">
                  <div className="absolute right-2.5 top-1 h-3 w-3 rounded-full bg-border" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">تم استلام الطرد</p>
                    <p className="text-xs text-muted-foreground">23 أكتوبر 2023 • 02:15 مساءً</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              <h4 className="font-bold text-sm">شحن سريع</h4>
              <p className="text-xs text-muted-foreground">من مدينة لمدينة في أقل من 24 ساعة</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Box className="h-8 w-8 text-primary" />
              <h4 className="font-bold text-sm">تغليف آمن</h4>
              <p className="text-xs text-muted-foreground">معاملة احترافية للقطع الحساسة</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              <h4 className="font-bold text-sm">شبكة واسعة</h4>
              <p className="text-xs text-muted-foreground">تغطية في الرياض والأردن وسوريا</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
