"use client"

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  ArrowLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes } from "date-fns";
import { ar } from "date-fns/locale";

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
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إكمال البيانات" });
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

    toast({ title: "تم الحفظ", description: "تمت إضافة الرحلة للجدول" });
    setIsAdding(false);
    setIntermediateStops([]);
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary font-headline">الرحلات الدولية</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl h-12">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4 ml-2" /> إضافة رحلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="p-6 border-primary/20 shadow-lg animate-in slide-in-from-top-4">
          <form onSubmit={handleAddTrip} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من مدينة</Label>
                <Select onValueChange={setOriginId}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>إلى مدينة</Label>
                <Select onValueChange={setDestinationId}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الانطلاق</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-11 rounded-xl">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخ"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent></Popover>
              </div>
              <div className="space-y-2">
                <Label>الحافلة</Label>
                <Select onValueChange={setBusId}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر حافلة" /></SelectTrigger><SelectContent>{buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>سعر التذكرة (ريال)</Label>
              <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl font-bold">حفظ الرحلة</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          trips?.map(trip => (
            <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-6 w-6 text-primary" /></div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{trip.originName} <ArrowLeft className="h-3 w-3 inline mx-1 opacity-30" /> {trip.destinationName}</p>
                      <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold uppercase tracking-widest">{trip.id}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(trip.departureTime), "PPP p", { locale: ar })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id))} className="text-red-500 rounded-full hover:bg-red-50">
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
