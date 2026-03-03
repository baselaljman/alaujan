
"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Truck, 
  MapPin, 
  Save, 
  PlusCircle, 
  LayoutDashboard, 
  Loader2, 
  Banknote, 
  AlertCircle, 
  ChevronDown, 
  User, 
  Phone,
  ListFilter
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function AdminParcelEntry() {
  const firestore = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    senderName: "",
    recipientName: "",
    recipientPhone: "",
    destinationLocationId: "",
    busTripId: "",
    parcelCount: "1",
    notes: "",
    collectedAmount: ""
  });

  // جلب المدن (المحافظات) من قاعدة البيانات
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading: isLocsLoading } = useCollection(locationsRef);

  // جلب الرحلات النشطة لربط الطرد بها
  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  // جلب كافة الطرود لعرض بيان الشحنات
  const parcelsRef = useMemoFirebase(() => collection(firestore, "parcels"), [firestore]);
  const { data: allParcels, isLoading: isParcelsLoading } = useCollection(parcelsRef);

  // تصفية الرحلات بناءً على الوجهة المختارة في النموذج
  const filteredTrips = useMemo(() => {
    if (!trips || !formData.destinationLocationId) return [];
    return trips.filter(t => 
      t.status !== "Arrived" && 
      t.destinationId === formData.destinationLocationId
    );
  }, [trips, formData.destinationLocationId]);

  // تجميع الطرود حسب الحافلة/الرحلة
  const tripsWithParcels = useMemo(() => {
    if (!trips || !allParcels) return [];
    
    return trips.map(trip => {
      const tripParcels = allParcels.filter(p => p.busTripId === trip.id);
      if (tripParcels.length === 0) return null;
      
      const totalAmount = tripParcels.reduce((sum, p) => sum + (Number(p.collectedAmount) || 0), 0);
      const totalCount = tripParcels.reduce((sum, p) => sum + (Number(p.parcelCount) || 0), 0);
      
      return {
        ...trip,
        parcels: tripParcels,
        stats: { totalAmount, totalCount }
      };
    }).filter(Boolean);
  }, [trips, allParcels]);

  const trackingNumber = useMemo(() => {
    return `AWJ-PRC-${Math.floor(100000 + Math.random() * 900000)}`;
  }, [isSaving]); // يتغير بعد كل حفظ ناجح

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

    if (!formData.busTripId) {
      toast({
        variant: "destructive",
        title: "لم يتم ربط رحلة",
        description: "يرجى اختيار الحافلة المتجهة لهذه المحافظة.",
      });
      return;
    }

    setIsSaving(true);

    const destinationName = locations?.find(l => l.id === formData.destinationLocationId)?.name || "";
    const selectedTrip = trips?.find(t => t.id === formData.busTripId);

    addDocumentNonBlocking(collection(firestore, "parcels"), {
      trackingNumber,
      senderName: formData.senderName,
      recipientName: formData.recipientName,
      recipientPhoneNumber: formData.recipientPhone,
      destinationLocationId: formData.destinationLocationId,
      destinationName: destinationName,
      busTripId: formData.busTripId,
      busLabel: selectedTrip?.busLabel || "",
      parcelCount: Number(formData.parcelCount),
      notes: formData.notes,
      collectedAmount: Number(formData.collectedAmount || 0),
      status: "Pending Pickup",
      lastUpdatedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      recipientAddress: destinationName
    });

    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "تم تسجيل الطرد بنجاح",
        description: `رقم التتبع: ${trackingNumber} - القيمة: ${formData.collectedAmount} ريال`,
      });
      setFormData({
        senderName: "",
        recipientName: "",
        recipientPhone: "",
        destinationLocationId: "",
        busTripId: "",
        parcelCount: "1",
        notes: "",
        collectedAmount: ""
      });
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-32">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-headline text-primary">إدارة الطرود والشحنات</h1>
        </div>
      </header>

      {/* قسم تسجيل طرد جديد */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2 text-primary">
            <PlusCircle className="h-5 w-5" />
            تسجيل شحنة جديدة
          </CardTitle>
          <CardDescription>أدخل بيانات الشحنة واربطها برحلة حافلة نشطة</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSave} className="space-y-6 text-right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold opacity-70">رقم الشحنة (تلقائي)</Label>
                <Input value={trackingNumber} className="bg-muted font-mono h-12" readOnly />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold">المحافظة المستهدفة</Label>
                <Select 
                  onValueChange={(val) => {
                    setFormData({...formData, destinationLocationId: val, busTripId: ""});
                  }}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label className="text-xs font-bold">عدد الطرود</Label>
                <Input 
                  type="number" 
                  className="rounded-xl h-12" 
                  value={formData.parcelCount}
                  onChange={e => setFormData({...formData, parcelCount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-primary flex items-center gap-1">
                  <Banknote className="h-3 w-3" /> القيمة المحصلة (ريال)
                </Label>
                <Input 
                  type="number" 
                  placeholder="0.00"
                  className="rounded-xl h-12 border-primary/20" 
                  value={formData.collectedAmount}
                  onChange={e => setFormData({...formData, collectedAmount: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">نوع الطرد / ملاحظات</Label>
              <Textarea 
                placeholder="مثال: كرتون ملابس، قطع غيار، إلخ..." 
                className="rounded-xl min-h-[80px]"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-accent font-bold text-sm mb-2">
                  <Truck className="h-4 w-4" />
                  ربط بالحافلة المتجهة للوجهة المختارة
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Select 
                      onValueChange={(val) => setFormData({...formData, busTripId: val})}
                      value={formData.busTripId}
                      disabled={!formData.destinationLocationId || filteredTrips.length === 0}
                    >
                      <SelectTrigger className="rounded-xl h-12 bg-white">
                        <SelectValue placeholder={
                          !formData.destinationLocationId ? "اختر الوجهة أولاً" : 
                          isTripsLoading ? "جاري التحميل..." : 
                          filteredTrips.length === 0 ? "لا توجد رحلات نشطة لهذه الوجهة" : 
                          "اختر الحافلة والرحلة"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTrips.map(t => (
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
              disabled={isSaving || isLocsLoading || filteredTrips.length === 0}
              type="submit"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> تسجيل وحفظ الشحنة</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* قسم بيان شحنات الحافلات */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <ListFilter className="h-5 w-5" />
            بيان شحنات الحافلات النشطة
          </h2>
          <Badge variant="outline" className="bg-primary/5 text-primary">
            {tripsWithParcels.length} حافلات محملة
          </Badge>
        </div>

        {isParcelsLoading || isTripsLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
        ) : tripsWithParcels.length === 0 ? (
          <div className="text-center p-16 bg-muted/10 rounded-3xl border-2 border-dashed">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground font-medium">لا توجد طرود مسجلة حالياً على أي حافلة نشطة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {tripsWithParcels.map((trip: any) => (
              <Card key={trip.id} className="border-none shadow-sm ring-1 ring-primary/10 overflow-hidden bg-white/50">
                <CardHeader className="bg-primary/5 border-b py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                        <Bus className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-right">
                        <CardTitle className="text-sm font-bold">{trip.busLabel}</CardTitle>
                        <CardDescription className="text-[10px] flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {trip.originName} ⮕ {trip.destinationName}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-emerald-600">
                        {trip.stats.totalCount} طرد
                      </Badge>
                      <Badge variant="outline" className="border-primary/20 text-primary font-black">
                        {trip.stats.totalAmount} ريال
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-muted/30 border-b">
                        <tr>
                          <th className="px-4 py-3 font-bold">رقم الشحنة</th>
                          <th className="px-4 py-3 font-bold">المرسل / المستلم</th>
                          <th className="px-4 py-3 font-bold">العدد / القيمة</th>
                          <th className="px-4 py-3 font-bold">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {trip.parcels.map((parcel: any) => (
                          <tr key={parcel.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-mono font-bold text-primary">{parcel.trackingNumber}</p>
                              <p className="text-[9px] text-muted-foreground">{parcel.notes || "لا توجد ملاحظات"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1"><User className="h-2 w-2 opacity-50" /> <span className="text-muted-foreground">{parcel.senderName || "مجهول"}</span></div>
                                <div className="flex items-center gap-1"><ChevronDown className="h-2 w-2 opacity-50 rotate-90" /> <span className="font-bold">{parcel.recipientName}</span></div>
                                <div className="flex items-center gap-1"><Phone className="h-2 w-2 opacity-50" /> <span>{parcel.recipientPhoneNumber}</span></div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-black text-primary">{parcel.parcelCount} قطع</p>
                              <p className="font-bold text-emerald-600">{parcel.collectedAmount} ريال</p>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary" className="text-[9px] px-2 py-0 h-5 bg-blue-50 text-blue-600 border-none">
                                {parcel.status === "Pending Pickup" ? "بانتظار التحميل" : parcel.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// أيقونات إضافية غير موجودة في lucide-react (محاكاة)
function Bus({ className }: { className?: string }) {
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
      <path d="M8 6v6" />
      <path d="M15 6v6" />
      <path d="M2 12h19.6" />
      <path d="M18 18h3s1-1.33 1-3c0-4.67-3.33-8-8-8H7c-4.67 0-8 3.33-8 8 0 1.67 1 3 1 3h3" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}
