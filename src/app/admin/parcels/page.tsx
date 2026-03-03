
"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Truck, MapPin, Save, PlusCircle, LayoutDashboard, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";

export default function AdminParcelEntry() {
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    senderName: "",
    recipientName: "",
    recipientPhone: "",
    destinationLocationId: "",
    busTripId: "",
    weight: "1"
  });

  // جلب المدن (المحافظات) من قاعدة البيانات
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading: isLocsLoading } = useCollection(locationsRef);

  // جلب الرحلات النشطة لربط الطرد بها
  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  const trackingNumber = useMemo(() => {
    return `AWJ-PRC-${Math.floor(100000 + Math.random() * 900000)}`;
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destinationLocationId || !formData.recipientName || !formData.recipientPhone) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "يرجى اختيار الوجهة وإدخال بيانات المستلم.",
      });
      return;
    }

    setIsSaving(true);

    const parcelsRef = collection(firestore, "parcels");
    const destinationName = locations?.find(l => l.id === formData.destinationLocationId)?.name || "";

    addDocumentNonBlocking(parcelsRef, {
      trackingNumber,
      senderName: formData.senderName,
      recipientName: formData.recipientName,
      recipientPhoneNumber: formData.recipientPhone,
      destinationLocationId: formData.destinationLocationId,
      destinationName: destinationName,
      busTripId: formData.busTripId,
      weightKg: Number(formData.weight),
      status: "Pending Pickup",
      lastUpdatedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      recipientAddress: destinationName // افتراضياً المحطة في تلك المدينة
    });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "تم تسجيل الطرد بنجاح",
        description: `رقم التتبع: ${trackingNumber} - الوجهة: ${destinationName}`,
      });
      setFormData({
        senderName: "",
        recipientName: "",
        recipientPhone: "",
        destinationLocationId: "",
        busTripId: "",
        weight: "1"
      });
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-primary">إدارة الطرود</h1>
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
                <Input value={trackingNumber} className="bg-muted font-mono" readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">المحافظة المستهدفة (الوجهة)</Label>
                <Select 
                  onValueChange={(val) => setFormData({...formData, destinationLocationId: val})}
                  value={formData.destinationLocationId}
                >
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder={isLocsLoading ? "جاري التحميل..." : "اختر المحافظة"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.country})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">اسم المرسل</Label>
                <Input 
                  placeholder="أدخل اسم المرسل" 
                  className="rounded-xl h-12"
                  value={formData.senderName}
                  onChange={e => setFormData({...formData, senderName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">اسم المستلم</Label>
                <Input 
                  placeholder="أدخل اسم المستلم" 
                  className="rounded-xl h-12" 
                  value={formData.recipientName}
                  onChange={e => setFormData({...formData, recipientName: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold">هاتف المستلم</Label>
                <Input 
                  placeholder="05XXXXXXXX" 
                  className="rounded-xl h-12" 
                  value={formData.recipientPhone}
                  onChange={e => setFormData({...formData, recipientPhone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">الوزن التقديري (كغ)</Label>
                <Input 
                  type="number" 
                  className="rounded-xl h-12" 
                  value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})}
                />
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
                    <Label className="text-xs">اختر الرحلة المتجهة لهذه المحافظة</Label>
                    <Select 
                      onValueChange={(val) => setFormData({...formData, busTripId: val})}
                      value={formData.busTripId}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-white">
                        <SelectValue placeholder={isTripsLoading ? "جاري التحميل..." : "اختر الرحلة النشطة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {trips?.filter(t => t.status !== "Arrived").map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.originName} ⮕ {t.destinationName} ({t.busLabel})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full h-14 text-lg font-bold rounded-2xl gap-2 shadow-xl" 
              disabled={isSaving || isLocsLoading}
              type="submit"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> تسجيل وحفظ البيانات</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
