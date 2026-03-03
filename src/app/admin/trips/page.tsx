
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
  CheckCircle
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
  
  const [printingTicket, setPrintingTicket] = useState<{
    passenger: any;
    trip: any;
    booking: any;
  } | null>(null);

  const [editingPassenger, setEditingPassenger] = useState<{
    bookingId: string;
    passengerIndex: number;
    fullName: string;
    passportNumber: string;
  } | null>(null);

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
        const matches = 
          p.fullName.toLowerCase().includes(search) || 
          p.passportNumber.toLowerCase().includes(search) ||
          booking.id.toLowerCase().includes(search) ||
          booking.userEmail?.toLowerCase().includes(search) ||
          booking.userPhone?.toLowerCase().includes(search) ||
          p.seatNumber?.toString().includes(search);
          
        if (matches) {
          allItems.push({ booking, passenger: p, index: idx });
        }
      });
    });
    return allItems;
  }, [manifestBookings, manifestSearchQuery]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !arrivalDate || !originId || !destinationId) {
      toast({ title: "بيانات ناقصة", description: "يرجى تعبئة جميع الحقول", variant: "destructive" });
      return;
    }

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

    toast({ title: "تمت الإضافة", description: "تمت إضافة الرحلة للجدول بنجاح" });
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", tripToDelete));
      toast({ title: "تم الحذف", description: "تمت إزالة الرحلة من النظام بنجاح" });
      setTripToDelete(null);
    }
  };

  const handleUpdatePassenger = () => {
    if (!editingPassenger || !manifestBookings) return;

    const booking = manifestBookings.find(b => b.id === editingPassenger.bookingId);
    if (!booking) return;

    const updatedPassengers = [...booking.passengers];
    updatedPassengers[editingPassenger.passengerIndex] = {
      ...updatedPassengers[editingPassenger.passengerIndex],
      fullName: editingPassenger.fullName,
      passportNumber: editingPassenger.passportNumber
    };

    updateDocumentNonBlocking(doc(firestore, "bookings", editingPassenger.bookingId), {
      passengers: updatedPassengers
    });

    toast({ title: "تم التحديث", description: "تم تعديل بيانات المسافر بنجاح" });
    setEditingPassenger(null);
  };

  const handleConfirmPayment = (bookingId: string) => {
    updateDocumentNonBlocking(doc(firestore, "bookings", bookingId), {
      paymentStatus: "Completed"
    });
    toast({ 
      title: "تم تأكيد الدفع", 
      description: "تم تحديث حالة الدفع إلى 'تم الدفع بنجاح' (كاش)." 
    });
  };

  const togglePassengerStatus = (bookingId: string, passengerIndex: number) => {
    if (!manifestBookings) return;
    const booking = manifestBookings.find(b => b.id === bookingId);
    if (!booking || !booking.passengers) return;

    const updatedPassengers = [...booking.passengers];
    const currentStatus = updatedPassengers[passengerIndex].status || 'Confirmed';
    const newStatus = currentStatus === 'Cancelled' ? 'Confirmed' : 'Cancelled';

    updatedPassengers[passengerIndex] = {
      ...updatedPassengers[passengerIndex],
      status: newStatus
    };

    updateDocumentNonBlocking(doc(firestore, "bookings", bookingId), {
      passengers: updatedPassengers
    });

    if (viewingManifestId) {
      const tripRef = doc(firestore, "busTrips", viewingManifestId);
      updateDocumentNonBlocking(tripRef, {
        availableSeats: increment(newStatus === 'Cancelled' ? 1 : -1)
      });
    }

    toast({ 
      title: newStatus === 'Cancelled' ? "تم الإلغاء" : "تم التفعيل", 
      description: newStatus === 'Cancelled' ? "تم إلغاء المسافر وإخلاء المقعد بنجاح" : "تمت إعادة تفعيل المسافر وحجز المقعد بنجاح" 
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20">
      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          html, body { height: auto !important; overflow: visible !important; background: white !important; }
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; z-index: 99999 !important; }
          .manifest-print { width: 210mm; min-height: 297mm; padding: 15mm; box-sizing: border-box; }
          .ticket-print-wrapper { width: 100%; height: 100vh; display: flex; justify-content: center; align-items: center; background: white; }
          .ticket-print-container { width: 900px !important; height: 350px !important; border: 2px solid black !important; }
        }
      `}</style>

      <div id="print-root" className="hidden print:block">
        {viewingManifestId && !printingTicket && (
          <div className="manifest-print text-right space-y-4 bg-white">
            <div className="flex justify-between items-center border-b-4 border-primary pb-6 mb-8">
              <div className="text-left">
                <h1 className="text-3xl font-black text-primary mb-1">العوجان للسياحة والسفر</h1>
                <p className="text-sm font-bold opacity-60 tracking-widest uppercase">Al-Awajan Travel - Official Manifest</p>
              </div>
              <Bus className="h-16 w-16 text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm bg-muted/20 p-6 rounded-2xl border mb-8">
              <div className="space-y-1">
                <p><span className="font-bold">المسار:</span> {currentTrip?.originName} ⮕ {currentTrip?.destinationName}</p>
                <p><span className="font-bold">الحافلة:</span> {currentTrip?.busLabel}</p>
              </div>
              <div className="space-y-1">
                <p><span className="font-bold">تاريخ الانطلاق:</span> {currentTrip && format(new Date(currentTrip.departureTime), "PPPP p", { locale: ar })}</p>
                <p><span className="font-bold">تاريخ الطباعة:</span> {printDate}</p>
              </div>
            </div>

            <div className="rounded-2xl border-2 overflow-hidden">
              <Table dir="rtl">
                <TableHeader>
                  <TableRow className="bg-primary/5 border-b-2">
                    <TableHead className="text-right font-black text-primary py-4">الاسم الكامل</TableHead>
                    <TableHead className="text-right font-black text-primary">الجواز</TableHead>
                    <TableHead className="text-right font-black text-primary">المقعد</TableHead>
                    <TableHead className="text-right font-black text-primary">بيانات التواصل</TableHead>
                    <TableHead className="text-right font-black text-primary">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manifestBookings?.map(booking => (
                    booking.passengers?.map((p: any, idx: number) => (
                      <TableRow key={`${booking.id}-${idx}`} className={cn("border-b", p.status === 'Cancelled' && "opacity-50 grayscale")}>
                        <TableCell className={cn("font-bold py-4", p.status === 'Cancelled' && "line-through")}>{p.fullName}</TableCell>
                        <TableCell className={cn("font-mono text-xs", p.status === 'Cancelled' && "line-through")}>{p.passportNumber}</TableCell>
                        <TableCell className="font-black text-lg">{p.seatNumber}</TableCell>
                        <TableCell className="text-[10px] leading-tight">
                          <p>{booking.userEmail}</p>
                          <p className="font-bold">{booking.userPhone}</p>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold">
                          {p.status === 'Cancelled' ? 'ملغي' : 'مؤكد'}
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {printingTicket && (
          <div className="ticket-print-wrapper">
            <div className="ticket-print-container flex divide-x divide-black divide-dashed bg-white overflow-hidden rounded-[30px]">
              <div className="flex-1 p-8 text-right space-y-4">
                <div className="flex justify-between items-start border-b-2 border-black pb-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-primary uppercase leading-none">Al-Awajan Travel</h2>
                    <p className="text-[10px] font-bold opacity-70">BOARDING PASS - بطاقة صعود دولية</p>
                  </div>
                  <Bus className="h-10 w-10 text-primary" />
                </div>
                <div className="grid grid-cols-2 gap-8 pt-2">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Passenger Name</p>
                    <p className="text-lg font-black">{printingTicket.passenger.fullName}</p>
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground">Passport No</p>
                    <p className="text-lg font-black font-mono">{printingTicket.passenger.passportNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 py-4 bg-muted/20 rounded-2xl px-8 border border-black/10">
                  <div className="flex-1 text-center"><p className="text-[9px] font-bold text-muted-foreground">From</p><p className="text-lg font-black">{printingTicket.trip.originName}</p></div>
                  <PlaneTakeoff className="h-5 w-5 text-primary rotate-180 shrink-0" />
                  <div className="flex-1 text-center"><p className="text-[9px] font-bold text-muted-foreground">To</p><p className="text-lg font-black">{printingTicket.trip.destinationName}</p></div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border border-black p-2 rounded-xl"><p className="text-[7px] font-bold uppercase">Date</p><p className="text-xs font-black">{format(new Date(printingTicket.trip.departureTime), "yyyy/MM/dd")}</p></div>
                  <div className="border border-black p-2 rounded-xl bg-primary text-white"><p className="text-[7px] font-bold uppercase opacity-80">Seat</p><p className="text-xl font-black">{printingTicket.passenger.seatNumber}</p></div>
                  <div className="border border-black p-2 rounded-xl"><p className="text-[7px] font-bold uppercase">Time</p><p className="text-xs font-black">{format(new Date(printingTicket.trip.departureTime), "HH:mm")}</p></div>
                  <div className="border border-black p-2 rounded-xl"><p className="text-[7px] font-bold uppercase">Booking</p><p className="text-[8px] font-black truncate">{printingTicket.booking.id.substring(0, 8)}</p></div>
                </div>
                <div className="flex justify-between items-end pt-4"><div className="h-8 w-48 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_4px)]" /><p className="text-[9px] font-bold">BUS: {printingTicket.trip.busLabel}</p></div>
              </div>
              <div className="w-[240px] p-8 bg-muted/5 space-y-4 text-right">
                <div className="text-center pb-4 border-b border-black/20"><Bus className="h-6 w-6 text-primary mx-auto mb-1" /><p className="text-[7px] font-black uppercase tracking-tighter">STUB</p></div>
                <div className="space-y-2">
                  <div><p className="text-[7px] font-bold text-muted-foreground">Passenger</p><p className="text-[10px] font-black truncate">{printingTicket.passenger.fullName}</p></div>
                  <div className="flex justify-between"><div><p className="text-[7px] font-bold text-muted-foreground">Seat</p><p className="text-lg font-black">{printingTicket.passenger.seatNumber}</p></div><div><p className="text-[7px] font-bold text-muted-foreground">Date</p><p className="text-[10px] font-black">{format(new Date(printingTicket.trip.departureTime), "MM/dd")}</p></div></div>
                </div>
                <div className="pt-4 flex justify-center"><QrCode className="h-16 w-16" /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="print:hidden space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات</h1>
          <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">{isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة</>}</Button>
        </header>

        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="البحث عن رحلة (الوجهة، الحافلة، أو الكود)..." className="rounded-xl pr-10 h-12" value={mainSearchQuery} onChange={(e) => setMainSearchQuery(e.target.value)} />
        </div>

        <Dialog open={!!editingPassenger} onOpenChange={(open) => !open && setEditingPassenger(null)}>
          <DialogContent className="text-right">
            <DialogHeader><DialogTitle className="flex items-center gap-2 justify-end"><span>تعديل بيانات المسافر</span><Edit className="h-5 w-5 text-primary" /></DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={editingPassenger?.fullName || ""} onChange={(e) => setEditingPassenger(prev => prev ? {...prev, fullName: e.target.value} : null)} className="rounded-xl" /></div>
              <div className="space-y-2"><Label>رقم جواز السفر</Label><Input value={editingPassenger?.passportNumber || ""} onChange={(e) => setEditingPassenger(prev => prev ? {...prev, passportNumber: e.target.value} : null)} className="rounded-xl" /></div>
            </div>
            <DialogFooter className="flex-row-reverse gap-2"><Button onClick={handleUpdatePassenger} className="rounded-xl gap-2"><Save className="h-4 w-4" /> حفظ التعديلات</Button><Button variant="outline" onClick={() => setEditingPassenger(null)} className="rounded-xl">إلغاء</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!printingTicket} onOpenChange={(open) => !open && setPrintingTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto text-right">
            <DialogHeader><DialogTitle className="flex items-center gap-2 justify-end"><span>معاينة تذكرة المسافر</span><Ticket className="h-5 w-5 text-primary" /></DialogTitle></DialogHeader>
            {printingTicket && (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-primary/20 rounded-3xl p-6 bg-muted/10">
                  <div className="flex justify-between items-center mb-6 border-b pb-4"><div className="text-left"><h3 className="text-lg font-black text-primary">AL-AWAJAN TRAVEL</h3><p className="text-[10px] font-bold opacity-60">BOARDING PASS</p></div><Badge className="bg-primary">مقعد {printingTicket.passenger.seatNumber}</Badge></div>
                  <div className="grid grid-cols-2 gap-4 text-right mb-6"><div><p className="text-[10px] text-muted-foreground">اسم الراكب</p><p className="font-bold">{printingTicket.passenger.fullName}</p></div><div><p className="text-[10px] text-muted-foreground">رقم الجواز</p><p className="font-mono font-bold">{printingTicket.passenger.passportNumber}</p></div></div>
                  <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-primary/10"><div className="flex-1 text-center"><p className="text-[10px] text-muted-foreground">من</p><p className="font-black text-lg">{printingTicket.trip.originName}</p></div><PlaneTakeoff className="h-5 w-5 text-primary opacity-40 rotate-180" /><div className="flex-1 text-center"><p className="text-[10px] text-muted-foreground">إلى</p><p className="font-black text-lg">{printingTicket.trip.destinationName}</p></div></div>
                </div>
              </div>
            )}
            <DialogFooter className="flex-row-reverse gap-2"><Button onClick={handlePrint} className="rounded-xl gap-2"><Printer className="h-4 w-4" /> طباعة التذكرة الآن</Button><Button variant="outline" onClick={() => setPrintingTicket(null)} className="rounded-xl">إغلاق</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
          <AlertDialogContent className="text-right">
            <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2 justify-end"><span>تأكيد حذف الرحلة</span><AlertCircle className="h-5 w-5 text-red-500" /></AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة بها من النظام.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse gap-2"><AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">تأكيد الحذف</AlertDialogAction><AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isAdding && (
          <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top duration-300">
            <CardContent className="pt-6">
              <form onSubmit={handleAddTrip} className="space-y-6 text-right">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-right"><Label>مدينة الانطلاق</Label><Select onValueChange={setOriginId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger><SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2 text-right"><Label>الوجهة</Label><Select onValueChange={setDestinationId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger><SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2 text-right"><Label>الحافلة المخصصة</Label><Select onValueChange={setBusId}><SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر حافلة من الأسطول" /></SelectTrigger><SelectContent>{buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 border p-4 rounded-xl bg-muted/5">
                    <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> تفاصيل الانطلاق</h3>
                    <div className="space-y-2"><Label>تاريخ الانطلاق</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full text-right justify-start font-normal">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخاً"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent></Popover></div>
                    <div className="space-y-2"><Label>وقت الانطلاق</Label><Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="rounded-xl" /></div>
                  </div>
                  <div className="space-y-4 border p-4 rounded-xl bg-muted/5">
                    <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> تفاصيل الوصول</h3>
                    <div className="space-y-2"><Label>تاريخ الوصول المتوقع</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full text-right justify-start font-normal">{arrivalDate ? format(arrivalDate, "PPP", { locale: ar }) : "اختر تاريخاً"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} locale={ar} /></PopoverContent></Popover></div>
                    <div className="space-y-2"><Label>وقت الوصول المتوقع</Label><Input type="time" value={arrTime} onChange={e => setArrTime(e.target.value)} className="rounded-xl" /></div>
                  </div>
                </div>
                <div className="space-y-2"><Label>سعر التذكرة (ريال)</Label><Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(Number(e.target.value))} className="rounded-xl" /></div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg">حفظ ونشر الرحلة الدولية</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">لا توجد رحلات تطابق بحثك</div>
          ) : filteredTrips.map(trip => (
            <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-5 w-5 text-primary" /></div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{trip.originName} ⮕ {trip.destinationName}</p>
                    <p className="text-[10px] text-muted-foreground">الانطلاق: {new Date(trip.departureTime).toLocaleString('ar-EG')} | متاح: {trip.availableSeats}/{trip.totalSeats}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog onOpenChange={(open) => { 
                    if (open) { setViewingManifestId(trip.id); setManifestSearchQuery(""); } 
                    else { setViewingManifestId(null); }
                  }}>
                    <DialogTrigger asChild><Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs"><Users className="h-4 w-4" /> بيان الركاب</Button></DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader><div className="flex items-center justify-between"><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> بيان الركاب المسجلين</DialogTitle><Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl gap-2"><Printer className="h-4 w-4" /> طباعة البيان (A4)</Button></div></DialogHeader>
                      <div className="mt-4 space-y-4">
                        <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="البحث بالاسم، الجواز، أو رقم الحجز..." className="rounded-xl pr-10" value={manifestSearchQuery} onChange={(e) => setManifestSearchQuery(e.target.value)} /></div>
                        {isManifestLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto my-8" /> : (
                          <div className="rounded-xl border overflow-x-auto">
                            <Table dir="rtl" className="min-w-[1000px]">
                              <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-right font-bold">اسم المسافر</TableHead><TableHead className="text-right font-bold">الجواز</TableHead><TableHead className="text-right font-bold">المقعد</TableHead><TableHead className="text-right font-bold">بيانات التواصل</TableHead><TableHead className="text-right font-bold">الأمتعة</TableHead><TableHead className="text-right font-bold">الدفع/الحالة</TableHead><TableHead className="text-center font-bold">إجراءات</TableHead></TableRow></TableHeader>
                              <TableBody>
                                {filteredManifestItems.length === 0 ? (<TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد نتائج مطابقة لبحثك</TableCell></TableRow>) : filteredManifestItems.map(({ booking, passenger, index }) => {
                                  const isCancelled = passenger.status === 'Cancelled';
                                  const isPendingPayment = booking.paymentStatus === 'Pending';
                                  
                                  return (
                                    <TableRow key={`${booking.id}-${index}`} className={cn(isCancelled && "bg-red-50/30 opacity-70")}>
                                      <TableCell className={cn("font-bold", isCancelled && "line-through text-muted-foreground")}>{passenger.fullName}</TableCell>
                                      <TableCell className={cn("font-mono text-xs", isCancelled && "line-through")}>{passenger.passportNumber}</TableCell>
                                      <TableCell><Badge variant="outline" className="bg-primary/5">{passenger.seatNumber}</Badge></TableCell>
                                      <TableCell><div className="flex flex-col gap-1 text-[10px]"><span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {booking.userEmail}</span><span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {booking.userPhone}</span></div></TableCell>
                                      <TableCell>{index === 0 ? (<div className="flex items-center gap-1 text-xs"><Package className="h-3 w-3" />{booking.extraBags > 0 ? <Badge variant="destructive" className="h-5 text-[10px]">{booking.extraBags} إضافية</Badge> : "عادية"}</div>) : "-"}</TableCell>
                                      <TableCell><div className="flex flex-col gap-1"><div className="flex items-center gap-1 text-[10px]"><CreditCard className="h-3 w-3" />{booking.paymentMethodLabel}</div><div className="flex gap-1 items-center"><Badge variant={booking.paymentStatus === 'Completed' ? 'default' : 'outline'} className="w-fit text-[10px] h-5">{booking.paymentStatus === 'Completed' ? 'تم الدفع' : 'معلق'}</Badge>{isCancelled && <Badge variant="destructive" className="text-[10px] h-5 font-black uppercase">ملغي</Badge>}</div></div></TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1">
                                          {isPendingPayment && !isCancelled && (
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" 
                                              onClick={() => handleConfirmPayment(booking.id)}
                                              title="تأكيد استلام الكاش"
                                            >
                                              <Banknote className="h-4 w-4" />
                                            </Button>
                                          )}
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setPrintingTicket({ passenger, trip, booking })} disabled={isCancelled} title="طباعة تذكرة صعود"><Ticket className="h-4 w-4" /></Button>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setEditingPassenger({ bookingId: booking.id, passengerIndex: index, fullName: passenger.fullName, passportNumber: passenger.passportNumber })} disabled={isCancelled} title="تعديل بيانات المسافر"><Edit className="h-4 w-4" /></Button>
                                          {isCancelled ? (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => togglePassengerStatus(booking.id, index)} title="إعادة تفعيل المقعد"><RotateCcw className="h-4 w-4" /></Button>
                                          ) : (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => togglePassengerStatus(booking.id, index)} title="إلغاء المسافر وإخلاء المقعد"><XCircle className="h-4 w-4" /></Button>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => setTripToDelete(trip.id)} className="text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
