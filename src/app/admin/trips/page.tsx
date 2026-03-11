"use client"

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking 
} from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin,
  Banknote,
  Navigation,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * @fileOverview واجهة إدارة الرحلات الدولية المتطورة.
 * تم تصميمها لتعمل كغرفة عمليات (Command Center) لإضافة وإدارة مسارات السفر بدقة هندسية.
 */

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // حالات النموذج (Form State)
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  
  // جلب البيانات الأساسية من Firebase
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading: isLocsLoading } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses, isLoading: isBusesLoading } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  /**
   * دالة معالجة إضافة رحلة جديدة بنظام "الصفر أخطاء".
   */
  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. التحقق الصارم من البيانات
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ 
        variant: "destructive", 
        title: "بيانات ناقصة", 
        description: "يرجى تعبئة كافة الحقول الأساسية للرحلة." 
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. توليد معرف رحلة فريد ومنظم (مثال: AWJ-123)
      const randomSuffix = Math.floor(100 + Math.random() * 899);
      const nextId = `AWJ-${randomSuffix}`;

      // 3. دمج التاريخ والوقت بدقة
      const [hours, minutes] = depTime.split(":").map(Number);
      const finalDepartureTime = setMinutes(setHours(startOfDay(departureDate), hours), minutes);
      
      // 4. استخراج مسميات العرض لضمان السرعة في واجهة المستخدم
      const originName = locations?.find(l => l.id === originId)?.name || "غير محدد";
      const destinationName = locations?.find(l => l.id === destinationId)?.name || "غير محدد";
      const selectedBus = buses?.find(b => b.id === busId);
      
      const tripData = {
        id: nextId,
        busId,
        busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "حافلة غير محددة",
        originId,
        originName,
        destinationId,
        destinationName,
        status: "Scheduled",
        pricePerSeat: Number(pricePerSeat),
        availableSeats: selectedBus?.capacity || 40,
        totalSeats: selectedBus?.capacity || 40,
        departureTime: finalDepartureTime.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 5. حفظ البيانات بنظام غير حاصر
      setDocumentNonBlocking(doc(firestore, "busTrips", nextId), tripData, { merge: true });

      // 6. نجاح العملية وتصفير النموذج
      toast({ 
        title: "تم الحفظ بنجاح", 
        description: `الرحلة الدولية ${nextId} أصبحت نشطة الآن للركاب.` 
      });
      
      resetForm();
      setIsAdding(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ فني", description: "حدث خطأ أثناء معالجة بيانات الرحلة." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBusId("");
    setOriginId("");
    setDestinationId("");
    setPricePerSeat("350");
    setDepartureDate(undefined);
    setDepTime("08:00");
  };

  return (
    <div className="space-y-8 pb-32 text-right animate-in fade-in duration-500">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2rem] shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary leading-none">إدارة الرحلات الدولية</h1>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Al-Awajan Network Logistics</p>
          </div>
        </div>
        <Button 
          onClick={() => isAdding ? setIsAdding(false) : setIsAdding(true)} 
          className={cn(
            "rounded-xl h-12 px-6 gap-2 transition-all shadow-md font-bold",
            isAdding ? "bg-red-50 text-red-600 hover:bg-red-100 border-none" : "bg-primary text-white"
          )}
        >
          {isAdding ? <><X className="h-4 w-4" /> إلغاء</> : <><Plus className="h-4 w-4" /> إضافة رحلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleAddTrip} className="space-y-8">
              {/* قسم المسار */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-primary flex items-center gap-2 pr-1 uppercase tracking-widest">
                  <MapPin className="h-3 w-3" /> خط السير الدولي
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-60 mr-1">نقطة الانطلاق</Label>
                    <Select onValueChange={setOriginId} value={originId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/5 font-bold">
                        <SelectValue placeholder="اختر مدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} - {l.country}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-60 mr-1">وجهة الوصول النهائية</Label>
                    <Select onValueChange={setDestinationId} value={destinationId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/5 font-bold">
                        <SelectValue placeholder="اختر مدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} - {l.country}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* قسم التوقيت */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-primary flex items-center gap-2 pr-1 uppercase tracking-widest">
                  <Clock className="h-3 w-3" /> الجدولة الزمنية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-60 mr-1">تاريخ المغادرة</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-14 rounded-2xl bg-white border-primary/5 justify-between px-4 font-bold text-slate-700",
                            !departureDate && "text-muted-foreground font-normal"
                          )}
                        >
                          {departureDate ? format(departureDate, "PPP", { locale: ar }) : <span>اختر تاريخ السفر</span>}
                          <CalendarIcon className="h-5 w-5 text-primary opacity-30" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-[2.5rem] shadow-2xl border-none" align="center" sideOffset={10}>
                        <Calendar
                          selected={departureDate}
                          onSelect={setDepartureDate}
                          locale={ar}
                          disabled={(date) => date < startOfDay(new Date())}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-60 mr-1">ساعة التحرك</Label>
                    <div className="relative">
                      <Input 
                        type="time" 
                        value={depTime} 
                        onChange={e => setDepTime(e.target.value)} 
                        className="h-14 rounded-2xl bg-white border-primary/5 pl-10 font-black text-right"
                      />
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم المعدات والتسعير */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-primary flex items-center gap-2 pr-1 uppercase tracking-widest">
                  <Bus className="h-3 w-3" /> الأسطول والتكلفة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-60 mr-1">الحافلة المخصصة</Label>
                    <Select onValueChange={setBusId} value={busId}>
                      <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/5 font-bold">
                        <SelectValue placeholder="اختر حافلة من الأسطول" />
                      </SelectTrigger>
                      <SelectContent>
                        {buses?.map(b => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.licensePlate} | {b.model} ({b.capacity} مقعد)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold opacity-60 mr-1">سعر التذكرة (ريال)</Label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        value={pricePerSeat} 
                        onChange={e => setPricePerSeat(e.target.value)} 
                        className="h-14 rounded-2xl bg-white border-primary/5 font-black text-right pr-12" 
                      />
                      <Banknote className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600 opacity-40" />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-16 rounded-[1.75rem] font-black text-lg bg-primary shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all gap-3"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><CheckCircle2 className="h-6 w-6" /> نشر الرحلة الدولية للجمهور</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* قائمة الرحلات المجدولة */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-black text-lg text-primary">الجدول النشط للرحلات</h3>
          <Badge variant="secondary" className="bg-primary/5 text-primary border-none px-4">
            {trips?.length || 0} رحلة مجدولة
          </Badge>
        </div>

        {isTripsLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3 opacity-20">
            <Loader2 className="animate-spin text-primary h-12 w-12" />
            <p className="text-xs font-bold uppercase tracking-widest">جاري استدعاء البيانات...</p>
          </div>
        ) : trips?.length === 0 ? (
          <div className="text-center p-24 bg-muted/10 rounded-[3rem] border-2 border-dashed border-primary/5">
            <Bus className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-10" />
            <p className="text-muted-foreground font-black text-sm">لا توجد رحلات مجدولة في النظام حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {trips?.map(trip => (
              <Card key={trip.id} className="border-none shadow-sm ring-1 ring-primary/5 hover:ring-primary/20 transition-all rounded-[2rem] overflow-hidden bg-white/70">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-primary/5 flex items-center justify-center border border-primary/5 shadow-inner">
                      <Bus className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-slate-900 text-lg leading-tight">{trip.originName}</p>
                        <ArrowLeft className="h-3 w-3 text-primary opacity-30" />
                        <p className="font-black text-slate-900 text-lg leading-tight">{trip.destinationName}</p>
                        <Badge variant="outline" className="text-[10px] font-mono h-5 px-2 border-primary/10 text-primary">#{trip.id}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                          <CalendarIcon className="h-3 w-3 text-primary" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-primary" /> {format(new Date(trip.departureTime), "p", { locale: ar })}
                        </p>
                        <Badge className="bg-emerald-50 text-emerald-600 text-[9px] font-bold border-none h-5">
                          {trip.pricePerSeat} ريال
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left hidden sm:block">
                      <p className="text-[10px] font-bold text-muted-foreground">الحالة:</p>
                      <p className="text-xs font-black text-emerald-600">نشطة</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { 
                        if(confirm("تحذير: هل أنت متأكد من حذف هذه الرحلة؟ سيؤدي ذلك لإلغاء كافة الحجوزات المرتبطة بها.")) {
                          deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id));
                        }
                      }} 
                      className="text-red-500 rounded-full hover:bg-red-50 h-12 w-12"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
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