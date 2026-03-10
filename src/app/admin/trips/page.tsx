
"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where, increment } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  Users, 
  Clock, 
  Printer, 
  Ticket, 
  Search,
  XCircle,
  RotateCcw,
  Copy,
  FileText,
  ArrowLeft,
  Banknote,
  MapPin,
  X
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [viewingManifestId, setViewingManifestId] = useState<string | null>(null);
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  
  // نقاط التوقف بأسعارها
  const [tempStopId, setTempStopId] = useState("");
  const [tempStopPrice, setTempStopPrice] = useState("");
  const [intermediateStops, setIntermediateStops] = useState<any[]>([]);

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    if (!mainSearchQuery) return trips;
    const q = mainSearchQuery.toLowerCase();
    return trips.filter(trip => 
      trip.originName?.toLowerCase().includes(q) || 
      trip.destinationName?.toLowerCase().includes(q) ||
      trip.busLabel?.toLowerCase().includes(q) ||
      trip.id.toLowerCase().includes(q)
    );
  }, [trips, mainSearchQuery]);

  const handleAddStop = () => {
    if (!tempStopId || !tempStopPrice) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى اختيار المدينة وتحديد سعرها من الانطلاق" });
      return;
    }
    
    if (intermediateStops.find(s => s.id === tempStopId)) {
      toast({ variant: "destructive", title: "مكرر", description: "هذه المدينة مضافة بالفعل" });
      return;
    }

    const loc = locations?.find(l => l.id === tempStopId);
    setIntermediateStops([...intermediateStops, { 
      id: tempStopId, 
      name: loc?.name, 
      price: Number(tempStopPrice) 
    }]);
    
    setTempStopId("");
    setTempStopPrice("");
  };

  const removeStop = (stopId: string) => {
    setIntermediateStops(intermediateStops.filter(s => s.id !== stopId));
  };

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId || !pricePerSeat) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال جميع الحقول المطلوبة" });
      return;
    }

    const awTrips = trips?.filter(t => /^aw\d+$/.test(t.id)) || [];
    let nextNum = 1;
    if (awTrips.length > 0) {
      const nums = awTrips.map(t => {
        const n = parseInt(t.id.replace('aw', ''));
        return isNaN(n) ? 0 : n;
      });
      nextNum = Math.max(...nums) + 1;
    }
    const nextId = `aw${nextNum.toString().padStart(3, '0')}`;

    const [dHours, dMinutes] = depTime.split(":").map(Number);
    const finalDepDate = setMinutes(setHours(departureDate, dHours), dMinutes);
    const finalArrDate = new Date(finalDepDate.getTime() + (12 * 60 * 60 * 1000));

    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";
    const selectedBus = buses?.find(b => b.id === busId);
    
    const tripDocRef = doc(firestore, "busTrips", nextId);

    setDocumentNonBlocking(tripDocRef, {
      id: nextId,
      busId,
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "",
      originId,
      originName,
      destinationId,
      destinationName,
      intermediateStops, // تخزين مصفوفة المحطات بأسعارها
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepDate.toISOString(),
      arrivalTime: finalArrDate.toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "تمت إضافة الرحلة", description: `كود الرحلة: ${nextId}` });
    setIsAdding(false);
    setIntermediateStops([]);
  };

  const handleDeleteTrip = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة نهائياً؟")) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", id));
      toast({ title: "تم الحذف", description: "تمت إزالة الرحلة من النظام" });
    }
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات الدولية</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2 h-12 px-6">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة جديدة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="p-6 border-primary/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddTrip} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>مدينة الانطلاق</Label>
                <Select onValueChange={setOriginId}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                  <SelectContent>
                    {locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-right">
                <Label>مدينة الوصول النهائي</Label>
                <Select onValueChange={setDestinationId}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                  <SelectContent>
                    {locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-dashed">
              <Label className="font-bold flex items-center gap-2 justify-end">
                <span>محطات التوقف وأسعارها (من الانطلاق)</span>
                <MapPin className="h-4 w-4 text-primary" />
              </Label>
              <div className="flex gap-2">
                <Select value={tempStopId} onValueChange={setTempStopId}>
                  <SelectTrigger className="rounded-xl h-10 bg-white flex-1"><SelectValue placeholder="اختر المحطة" /></SelectTrigger>
                  <SelectContent>
                    {locations?.filter(l => l.id !== originId && l.id !== destinationId).map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="number" 
                  placeholder="السعر ر.س" 
                  value={tempStopPrice} 
                  onChange={e => setTempStopPrice(e.target.value)} 
                  className="w-24 h-10 rounded-xl bg-white"
                />
                <Button type="button" onClick={handleAddStop} size="sm" className="h-10 px-4 rounded-xl">إضافة</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {intermediateStops.map(stop => (
                  <Badge key={stop.id} className="bg-primary/10 text-primary border-none py-1.5 px-3 rounded-full flex items-center gap-2">
                    {stop.name} ({stop.price} ر.س)
                    <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeStop(stop.id)} />
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>الحافلة المخصصة</Label>
                <Select onValueChange={setBusId}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر حافلة" /></SelectTrigger>
                  <SelectContent>
                    {buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-right">
                <Label className="flex items-center gap-1 justify-end">
                  سعر الوصول النهائي (ريال) <Banknote className="h-3 w-3 text-primary" />
                </Label>
                <Input 
                  type="number" 
                  value={pricePerSeat} 
                  onChange={e => setPricePerSeat(e.target.value)} 
                  className="h-11 rounded-xl"
                  placeholder="350"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>تاريخ الرحلة</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full text-right h-11 rounded-xl">
                      {departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخاً"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 text-right">
                <Label>وقت الانطلاق</Label>
                <Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="h-11 rounded-xl" />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold mt-4 shadow-xl">تأكيد وحفظ الرحلة</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center p-16 bg-muted/10 rounded-3xl border-2 border-dashed">
            <Bus className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground font-medium">لا توجد رحلات مجدولة حالياً</p>
          </div>
        ) : (
          filteredTrips.map(trip => (
            <Card key={trip.id} className="p-4 border-none shadow-sm ring-1 ring-border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Bus className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base">{trip.originName} <ArrowLeft className="inline h-3 w-3 mx-1 opacity-50" /> {trip.destinationName}</p>
                      <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary">{trip.id}</Badge>
                    </div>
                    {trip.intermediateStops && trip.intermediateStops.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">يمر بـ: {trip.intermediateStops.map((s: any) => `${s.name} (${s.price}ر.س)`).join('، ')}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{trip.busLabel} | متاح: {trip.availableSeats} | الأساسي: {trip.pricePerSeat} ريال</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTrip(trip.id)} className="text-red-500 hover:bg-red-50 rounded-xl h-9 w-9">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
