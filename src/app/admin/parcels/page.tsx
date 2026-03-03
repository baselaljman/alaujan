
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, MapPin, Save, PlusCircle, LayoutDashboard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AdminParcelEntry() {
  const [isSaving, setIsSaving] = useState(false);

  // بيانات افتراضية للمحافظات والحافلات المتاحة للربط
  const provinces = ["الرياض", "الدمام", "عمان", "دمشق", "حمص", "حماة", "الرقة", "دير الزور"];
  const activeTrips = [
    { id: "AWJ-700", route: "الرياض ⮕ دمشق" },
    { id: "AWJ-800", route: "الدمام ⮕ عمان" },
    { id: "AWJ-900", route: "الرياض ⮕ حمص" }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "تم تسجيل الطرد",
        description: "تم ربط الطرد بالحافلة والمحافظة بنجاح.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">لوحة المسؤول | الطرود</h1>
        </div>
      </header>

      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            تسجيل طرد جديد
          </CardTitle>
          <CardDescription>أدخل بيانات الشحنة واربطها برحلة نشطة ومحافظة</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">رقم الشحنة (تلقائي)</Label>
                <Input defaultValue="AWJ-PRC-772" className="bg-muted" readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">المحافظة المستهدفة (الوجهة)</Label>
                <Select>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="اختر المحافظة" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">اسم المرسل</Label>
                <Input placeholder="أدخل اسم المرسل" className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">اسم المستلم</Label>
                <Input placeholder="أدخل اسم المستلم" className="rounded-xl h-12" />
              </div>
            </div>

            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-accent font-bold text-sm mb-2">
                  <Truck className="h-4 w-4" />
                  ربط بالحافلة والرحلة
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">اختر الحافلة المتجهة للمحافظة</Label>
                    <Select>
                      <SelectTrigger className="rounded-xl h-12 bg-white">
                        <SelectValue placeholder="اختر الرحلة النشطة" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeTrips.map(t => <SelectItem key={t.id} value={t.id}>{t.id} - {t.route}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full h-14 text-lg font-bold rounded-2xl gap-2 shadow-xl" disabled={isSaving}>
              {isSaving ? "جاري الحفظ..." : <><Save className="h-5 w-5" /> تسجيل وحفظ البيانات</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <h3 className="font-bold text-sm px-1">آخر الطرود المسجلة</h3>
        {[1, 2].map((i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">AWJ-PRC-77{i}</p>
                  <p className="text-[10px] text-muted-foreground">وجهة: دمشق | حافلة: AWJ-700</p>
                </div>
              </div>
              <div className="text-left">
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10">قيد التحميل</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
