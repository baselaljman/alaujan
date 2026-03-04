
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

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !viewingManifestId) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", viewingManifestId));
  }, [firestore, viewingManifestId]);

  const { data: manifestBookings, isLoading: isManifestLoading } = useCollection(bookingsQuery);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال جميع الحقول المطلوبة" });
      return;
    }

    // منطق إنشاء المعرف التسلسلي aw001, aw002...
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
    
    // إذا لم يتم تحديد وقت وصول، نعتبره بعد 12 ساعة افتراضياً
    const finalArrDate = arrivalDate 
      ? setMinutes(setHours(arrivalDate, Number(arrTime.split(":")[0])), Number(arrTime.split(":")[1]))
      : new Date(finalDepDate.getTime() + (12 * 60 * 60 * 1000));

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
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepDate.toISOString(),
      arrivalTime: finalArrDate.toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "تمت إضافة الرحلة", description: `تم إصدار كود الرحلة الجديد: ${nextId}` });
    setIsAdding(false);
    
    // إعادة تعيين النموذج
    setBusId("");
    setOriginId("");
    setDestinationId("");
    setPricePerSeat(350);
  };

  const copyTripId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "تم نسخ كود التتبع", description: id });
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

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ابحث بالوجهة أو الحافلة أو الكود..." 
          className="rounded-xl pr-10 h-12" 
          value={mainSearchQuery} 
          onChange={(e) => setMainSearchQuery(e.target.value)} 
        />
      </div>

      {isAdding && (
        <Card className="p-6 border-primary/20 shadow-lg animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddTrip} className="space-y-4">
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
                <Label>مدينة الوصول</Label>
                <Select onValueChange={setDestinationId}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                  <SelectContent>
                    {locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 text-right">
              <Label>الحافلة المخصصة</Label>
              <Select onValueChange={setBusId}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر حافلة من الأسطول" /></SelectTrigger>
                <SelectContent>
                  {buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}
                </SelectContent>
              </Select>
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

            <div className="space-y-2 text-right">
              <Label>سعر التذكرة (ريال)</Label>
              <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(Number(e.target.value))} className="h-11 rounded-xl" />
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold mt-4 shadow-xl">
              تأكيد وحفظ الرحلة بنمط تسلسلي
            </Button>
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
                      <p className="font-bold text-base">{trip.originName} ⮕ {trip.destinationName}</p>
                      <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary">
                        {trip.id}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{trip.busLabel} | متاح: {trip.availableSeats} من {trip.totalSeats}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => copyTripId(trip.id)} className="flex items-center gap-1 text-[9px] text-primary font-bold hover:underline">
                        <Copy className="h-2.5 w-2.5" /> نسخ كود التتبع
                      </button>
                      <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" /> {new Date(trip.departureTime).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                   <Dialog onOpenChange={(open) => { if (open) { setViewingManifestId(trip.id); } else { setViewingManifestId(null); } }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl text-xs h-9 px-4 gap-2">
                          <Users className="h-3.5 w-3.5" /> الركاب
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-0 border-none shadow-2xl">
                         <div className="bg-primary p-6 text-white text-right">
                            <DialogTitle className="text-xl font-bold">بيان الركاب (المانيفست) - رحلة {trip.id}</DialogTitle>
                            <p className="text-xs opacity-70 mt-1">{trip.originName} ⬅ {trip.destinationName} | {new Date(trip.departureTime).toLocaleDateString('ar-EG')}</p>
                         </div>
                         <div className="p-6">
                           {isManifestLoading ? (
                             <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                           ) : manifestBookings?.length === 0 ? (
                             <div className="text-center py-12 text-muted-foreground">لا يوجد ركاب مسجلون في هذه الرحلة بعد</div>
                           ) : (
                             <div className="overflow-x-auto">
                               <Table dir="rtl">
                                 <TableHeader>
                                   <TableRow className="bg-muted/50 hover:bg-muted/50">
                                     <TableHead className="text-right font-bold">الاسم الكامل</TableHead>
                                     <TableHead className="text-right font-bold">رقم الجواز</TableHead>
                                     <TableHead className="text-right font-bold">المقعد</TableHead>
                                     <TableHead className="text-center font-bold">إجراءات</TableHead>
                                   </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                   {manifestBookings?.map(b => b.passengers?.map((p: any, i: number) => (
                                     <TableRow key={`${b.id}-${i}`} className={cn(p.status === 'Cancelled' && "opacity-50 grayscale bg-red-50/10")}>
                                       <TableCell className="font-bold text-xs">{p.fullName}</TableCell>
                                       <TableCell className="text-xs font-mono">{p.passportNumber}</TableCell>
                                       <TableCell><Badge variant="outline" className="font-bold">{p.seatNumber}</Badge></TableCell>
                                       <TableCell className="text-center">
                                         <div className="flex justify-center gap-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 text-primary hover:bg-primary/10" 
                                              title="طباعة تذكرة"
                                            >
                                              <Ticket className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className={cn("h-8 w-8", p.status === 'Cancelled' ? "text-emerald-500" : "text-red-500")}
                                              onClick={() => {
                                                const updated = [...b.passengers];
                                                const isCancelling = p.status !== 'Cancelled';
                                                updated[i].status = isCancelling ? 'Cancelled' : 'Confirmed';
                                                updateDocumentNonBlocking(doc(firestore, "bookings", b.id), { passengers: updated });
                                                updateDocumentNonBlocking(doc(firestore, "busTrips", trip.id), { availableSeats: increment(isCancelling ? 1 : -1) });
                                                toast({ title: isCancelling ? "تم الإلغاء" : "تم التنشيط", description: `تم تحديث حالة الراكب ${p.fullName}` });
                                              }}
                                            >
                                              {p.status === 'Cancelled' ? <RotateCcw className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            </Button>
                                         </div>
                                       </TableCell>
                                     </TableRow>
                                   )))}
                                 </TableBody>
                               </Table>
                             </div>
                           )}
                         </div>
                      </DialogContent>
                   </Dialog>
                   <Button variant="ghost" size="icon" onClick={() => handleDeleteTrip(trip.id)} className="text-red-500 hover:bg-red-50 rounded-xl h-9 w-9">
                      <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
