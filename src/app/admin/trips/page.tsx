
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, DollarSign, Bus, Loader2, MapPin, ArrowLeft, Users, User, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [viewingManifestId, setViewingManifestId] = useState<string | null>(null);
  
  // States for the new trip form
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [pricePerSeat, setPricePerSeat] = useState(350);
  const [availableSeats, setAvailableSeats] = useState(40);
  
  const [departureDate, setDepartureDate] = useState<Date>();
  const [departureTime, setDepartureTime] = useState("08:00");
  
  const [arrivalDate, setArrivalDate] = useState<Date>();
  const [arrivalTime, setArrivalTime] = useState("20:00");

  // Fetch Locations
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  // Fetch Buses
  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  // Fetch Trips
  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  // Fetch Bookings for the manifest (Fixed: Using top-level collection)
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !viewingManifestId) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", viewingManifestId));
  }, [firestore, viewingManifestId]);

  const { data: manifestBookings, isLoading: isManifestLoading } = useCollection(bookingsQuery);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !arrivalDate || !originId || !destinationId) {
      toast({ title: "بيانات ناقصة", description: "يرجى تعبئة جميع الحقول", variant: "destructive" });
      return;
    }

    const depDateTime = new Date(departureDate);
    const [depH, depM] = departureTime.split(':');
    depDateTime.setHours(parseInt(depH), parseInt(depM));

    const arrDateTime = new Date(arrivalDate);
    const [arrH, arrM] = arrivalTime.split(':');
    arrDateTime.setHours(parseInt(arrH), parseInt(arrM));

    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";
    const selectedBus = buses?.find(b => b.id === busId);
    const busLabel = selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "";

    addDocumentNonBlocking(tripsRef, {
      busId,
      busLabel,
      originId,
      originName,
      destinationId,
      destinationName,
      status,
      pricePerSeat: Number(pricePerSeat),
      availableSeats: Number(availableSeats),
      totalSeats: Number(availableSeats),
      departureTime: depDateTime.toISOString(),
      arrivalTime: arrDateTime.toISOString(),
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة", description: "تمت إضافة الرحلة بنجاح" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد؟")) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", id));
      toast({ title: "تم الحذف" });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg">
          <CardHeader><CardTitle className="text-lg">رحلة جديدة</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddTrip} className="space-y-6 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من</Label>
                  <Select onValueChange={setOriginId}><SelectTrigger><SelectValue placeholder="مدينة الانطلاق" /></SelectTrigger><SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label>إلى</Label>
                  <Select onValueChange={setDestinationId}><SelectTrigger><SelectValue placeholder="الوجهة" /></SelectTrigger><SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>الحافلة</Label>
                <Select onValueChange={setBusId}><SelectTrigger><SelectValue placeholder="اختر حافلة" /></SelectTrigger><SelectContent>{buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>تاريخ الانطلاق</Label>
                  <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full text-right">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخاً"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent></Popover>
                  <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="mt-2" />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الوصول</Label>
                  <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full text-right">{arrivalDate ? format(arrivalDate, "PPP", { locale: ar }) : "اختر تاريخاً"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} locale={ar} /></PopoverContent></Popover>
                  <Input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} className="mt-2" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12">حفظ ونشر الرحلة</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-5 w-5 text-primary" /></div>
                <div className="text-right">
                  <p className="font-bold text-sm">{trip.originName} ⮕ {trip.destinationName}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(trip.departureTime).toLocaleString('ar-EG')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog onOpenChange={(open) => { if (open) setViewingManifestId(trip.id); else setViewingManifestId(null); }}>
                  <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs"><Users className="h-4 w-4" /> الركاب</Button></DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>قائمة الركاب</DialogTitle></DialogHeader>
                    {isManifestLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : (
                      <div className="rounded-xl border overflow-hidden mt-4">
                        <Table>
                          <TableHeader><TableRow><TableHead className="text-right">المقاعد</TableHead><TableHead className="text-right">حالة الدفع</TableHead><TableHead className="text-right">المجموع</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {manifestBookings?.map(b => (
                              <TableRow key={b.id}>
                                <TableCell className="font-bold">{b.seatNumbers?.join(", ")}</TableCell>
                                <TableCell><Badge variant={b.paymentStatus === 'Completed' ? 'default' : 'outline'}>{b.paymentStatus}</Badge></TableCell>
                                <TableCell>{b.totalAmount} ريال</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(trip.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
