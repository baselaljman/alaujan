"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  
  const [intermediateStops, setIntermediateStops] = useState<any[]>([]);

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إكمال البيانات الأساسية" });
      return;
    }

    const nextId = `aw${Math.floor(100 + Math.random() * 899)}`;
    const [dHours, dMinutes] = depTime.split(":").map(Number);
    const finalDepDate = setMinutes(setHours(departureDate, dHours), dMinutes);
    
    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";
    const selectedBus = buses?.find(b => b.id === busId);
    
    setDocumentNonBlocking(doc(firestore, "busTrips", nextId), {
      id: nextId,
      busId,
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "",
      originId,
      originName,
      destinationId,
      destinationName,
      intermediateStops,
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepDate.toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "تم الحفظ", description: "تمت إضافة الرحلة للجدول بنجاح" });
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setBusId("");
    setOriginId("");
    setDestinationId("");
    setPricePerSeat("350");
    setDepartureDate(undefined);
    setDepTime("08:00");
    setIntermediateStops([]);
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary font-headline">الرحلات الدولية</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl h-12 gap-2 shadow-md">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-xl animate-in slide-in-from-top-4 duration-500 rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleAddTrip} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold pr-1">من مدينة الانطلاق</Label>
                  <Select onValueChange={setOriginId} value={originId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-primary/5">
                      <SelectValue placeholder="اختر مدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold pr-1">إلى مدينة الوصول</Label>
                  <Select onValueChange={setDestinationId} value={destinationId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-primary/5">
                      <SelectValue placeholder="اختر مدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold pr-1">تاريخ السفر</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-14 rounded-2xl bg-slate-50 border-primary/5 justify-between px-4 font-normal",
                          !departureDate && "text-muted-foreground"
                        )}
                      >
                        {departureDate ? format(departureDate, "PPP", { locale: ar }) : <span>اختر تاريخ</span>}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-primary/5" align="start">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={setDepartureDate}
                        locale={ar}
                        initialFocus
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold pr-1">وقت الانطلاق</Label>
                  <div className="relative">
                    <Input 
                      type="time" 
                      value={depTime} 
                      onChange={e => setDepTime(e.target.value)} 
                      className="h-14 rounded-2xl bg-slate-50 border-primary/5 pl-10"
                    />
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold pr-1">الحافلة المخصصة</Label>
                  <Select onValueChange={setBusId} value={busId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-primary/5">
                      <SelectValue placeholder="اختر حافلة من الأسطول" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses?.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.licensePlate} - {b.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold pr-1">سعر التذكرة (ريال)</Label>
                  <Input 
                    type="number" 
                    value={pricePerSeat} 
                    onChange={e => setPricePerSeat(e.target.value)} 
                    className="h-14 rounded-2xl bg-slate-50 border-primary/5" 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 rounded-[1.5rem] font-black text-lg bg-primary shadow-xl hover:scale-[1.01] transition-transform">
                حفظ ونشر الرحلة
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-10 w-10 opacity-20" /></div>
        ) : trips?.length === 0 ? (
          <div className="text-center p-16 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-primary/5">
            <Bus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground font-bold">لا توجد رحلات مجدولة حالياً</p>
          </div>
        ) : (
          trips?.map(trip => (
            <Card key={trip.id} className="border-none shadow-sm ring-1 ring-primary/5 hover:ring-primary/20 transition-all rounded-[1.5rem] overflow-hidden bg-white">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <Bus className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-900">{trip.originName}</p>
                      <ArrowLeft className="h-3 w-3 text-primary opacity-30" />
                      <p className="font-black text-slate-900">{trip.destinationName}</p>
                      <Badge variant="outline" className="text-[9px] font-mono h-5 px-1.5 border-primary/10 text-primary">#{trip.id}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {format(new Date(trip.departureTime), "p", { locale: ar })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-black text-primary">{trip.pricePerSeat} ريال</p>
                    <p className="text-[9px] text-muted-foreground">للمقعد الواحد</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { if(confirm("حذف الرحلة؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} className="text-red-500 rounded-full hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
