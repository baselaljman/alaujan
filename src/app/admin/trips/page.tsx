
"use client"

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where, increment } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  Users, 
  FileText, 
  AlertCircle, 
  Clock, 
  Phone, 
  Mail, 
  CreditCard, 
  Package, 
  Edit, 
  Save, 
  Printer, 
  Ticket, 
  QrCode, 
  PlaneTakeoff, 
  Search,
  XCircle,
  RotateCcw,
  Banknote,
  Copy
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
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [printDate, setPrintDate] = useState<string>("");
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  const [manifestSearchQuery, setManifestSearchQuery] = useState("");
  
  const [printingTicket, setPrintingTicket] = useState<{ passenger: any; trip: any; booking: any; } | null>(null);
  const [editingPassenger, setEditingPassenger] = useState<{ bookingId: string; passengerIndex: number; fullName: string; passportNumber: string; } | null>(null);

  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState(350);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [arrivalDate, setArrivalDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  const [arrTime, setArrTime] = useState("20:00");

  useEffect(() => {
    setPrintDate(format(new Date(), "PPPP p", { locale: ar }));
  }, []);

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

  const currentTrip = trips?.find(t => t.id === viewingManifestId);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !viewingManifestId) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", viewingManifestId));
  }, [firestore, viewingManifestId]);

  const { data: manifestBookings, isLoading: isManifestLoading } = useCollection(bookingsQuery);

  const filteredManifestItems = useMemo(() => {
    if (!manifestBookings) return [];
    const search = manifestSearchQuery.toLowerCase();
    const allItems: { booking: any, passenger: any, index: number }[] = [];
    manifestBookings.forEach(booking => {
      booking.passengers?.forEach((p: any, idx: number) => {
        if (p.fullName.toLowerCase().includes(search) || p.passportNumber.toLowerCase().includes(search) || booking.id.toLowerCase().includes(search)) {
          allItems.push({ booking, passenger: p, index: idx });
        }
      });
    });
    return allItems;
  }, [manifestBookings, manifestSearchQuery]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) return;

    const [dHours, dMinutes] = depTime.split(":").map(Number);
    const finalDepDate = setMinutes(setHours(departureDate, dHours), dMinutes);
    const [aHours, aMinutes] = arrTime.split(":").map(Number);
    const finalArrDate = setMinutes(setHours(arrivalDate, aHours), aMinutes);

    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";
    const selectedBus = buses?.find(b => b.id === busId);

    addDocumentNonBlocking(tripsRef, {
      busId,
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "",
      originId,
      originName,
      destinationId,
      destinationName,
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepDate.toISOString(),
      arrivalTime: finalArrDate.toISOString(),
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة" });
    setIsAdding(false);
  };

  const copyTripId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "تم نسخ كود التتبع", description: id });
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">{isAdding ? "إلغاء" : <Plus className="h-4 w-4" />}</Button>
      </header>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="ابحث بالوجهة أو الحافلة..." className="rounded-xl pr-10" value={mainSearchQuery} onChange={(e) => setMainSearchQuery(e.target.value)} />
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 shadow-lg text-right">
          <form onSubmit={handleAddTrip} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>من</Label><Select onValueChange={setOriginId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger><SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>إلى</Label><Select onValueChange={setDestinationId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger><SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>الحافلة</Label><Select onValueChange={setBusId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر حافلة" /></SelectTrigger><SelectContent>{buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>التاريخ</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full text-right">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخاً"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent></Popover></div>
              <div className="space-y-2"><Label>الوقت</Label><Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} /></div>
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl">حفظ الرحلة</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? <Loader2 className="animate-spin h-8 w-8 mx-auto" /> : filteredTrips.map(trip => (
          <Card key={trip.id} className="p-4 border-none shadow-sm ring-1 ring-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-5 w-5 text-primary" /></div>
                <div className="text-right">
                  <p className="font-bold text-sm">{trip.originName} ⮕ {trip.destinationName}</p>
                  <p className="text-[10px] text-muted-foreground">{trip.busLabel} | متاح: {trip.availableSeats}</p>
                  <button onClick={() => copyTripId(trip.id)} className="flex items-center gap-1 text-[9px] text-primary font-bold hover:underline">
                    <Copy className="h-2 w-2" /> كود التتبع: {trip.id.substring(0, 8)}...
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                 <Dialog onOpenChange={(open) => { if (open) { setViewingManifestId(trip.id); } else { setViewingManifestId(null); } }}>
                    <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-xl text-xs">الركاب</Button></DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                       <DialogHeader><DialogTitle>بيان الركاب - رحلة {trip.id.substring(0, 8)}</DialogTitle></DialogHeader>
                       <Table dir="rtl">
                         <TableHeader><TableRow><TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">المقعد</TableHead><TableHead className="text-center">إجراءات</TableHead></TableRow></TableHeader>
                         <TableBody>
                           {manifestBookings?.map(b => b.passengers?.map((p: any, i: number) => (
                             <TableRow key={`${b.id}-${i}`} className={cn(p.status === 'Cancelled' && "opacity-50 grayscale")}>
                               <TableCell className="font-bold text-xs">{p.fullName}</TableCell>
                               <TableCell><Badge variant="outline">{p.seatNumber}</Badge></TableCell>
                               <TableCell className="text-center">
                                 <div className="flex justify-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="طباعة تذكرة" onClick={() => setPrintingTicket({ passenger: p, trip, booking: b })}><Ticket className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" title="إلغاء" onClick={() => {
                                      const updated = [...b.passengers];
                                      const newStatus = p.status === 'Cancelled' ? 'Confirmed' : 'Cancelled';
                                      updated[i].status = newStatus;
                                      updateDocumentNonBlocking(doc(firestore, "bookings", b.id), { passengers: updated });
                                      updateDocumentNonBlocking(doc(firestore, "busTrips", trip.id), { availableSeats: increment(newStatus === 'Cancelled' ? 1 : -1) });
                                    }}>{p.status === 'Cancelled' ? <RotateCcw className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}</Button>
                                 </div>
                               </TableCell>
                             </TableRow>
                           )))}
                         </TableBody>
                       </Table>
                    </DialogContent>
                 </Dialog>
                 <Button variant="ghost" size="icon" onClick={() => setTripToDelete(trip.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
