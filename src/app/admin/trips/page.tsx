"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking
} from "@/firebase";
import { collection, doc, query, where, getDoc } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  CalendarIcon,
  Clock,
  Navigation,
  Users,
  Printer,
  FileText,
  Smartphone,
  ArrowLeft,
  Banknote,
  MapPin,
  ChevronLeft,
  Edit,
  UserX,
  UserCheck,
  Save,
  Mail,
  Phone,
  CreditCard
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTripForManifest, setSelectedTripForManifest] = useState<any>(null);
  
  const [isEditingPassenger, setIsEditingPassenger] = useState(false);
  const [editingPassengerData, setEditingPassengerData] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  const manifestQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTripForManifest) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", selectedTripForManifest.id));
  }, [firestore, selectedTripForManifest]);

  const { data: bookings, isLoading: isManifestLoading } = useCollection(manifestQuery);

  const passengersList = useMemo(() => {
    if (!bookings) return [];
    return bookings.flatMap((booking: any) => 
      (booking.passengers || []).map((p: any, index: number) => ({
        ...p,
        passengerIndex: index,
        phone: booking.userPhone,
        email: booking.userEmail,
        paymentStatus: booking.paymentStatus,
        paymentMethodLabel: booking.paymentMethodLabel || "غير محدد",
        trackingNumber: booking.trackingNumber,
        bookingId: booking.id,
        boardingPoint: booking.boardingPoint,
        droppingPoint: booking.droppingPoint,
        tripId: booking.busTripId,
        departureTime: booking.departureTime
      }))
    ).sort((a: any, b: any) => a.seatNumber - b.seatNumber);
  }, [bookings]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال الحقول." });
      return;
    }

    setIsSubmitting(true);
    
    // منطق التسلسل الرقمي الموحد aw001, aw002...
    const tripNumbers = trips?.map(t => {
      const numPart = t.id.replace('aw', '');
      return isNaN(parseInt(numPart)) ? 0 : parseInt(numPart);
    }) || [];
    const maxNum = tripNumbers.length > 0 ? Math.max(...tripNumbers) : 0;
    const nextNum = maxNum + 1;
    const tripCode = `aw${nextNum.toString().padStart(3, '0')}`;
    
    const [hours, minutes] = depTime.split(":").map(Number);
    const finalDepartureTime = setMinutes(setHours(startOfDay(departureDate), hours), minutes);
    const selectedBus = buses?.find(b => b.id === busId);
    
    const tripData = {
      id: tripCode,
      busId,
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "حافلة",
      originId,
      originName: locations?.find(l => l.id === originId)?.name || "",
      destinationId,
      destinationName: locations?.find(l => l.id === destinationId)?.name || "",
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepartureTime.toISOString(),
      createdAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(firestore, "busTrips", tripCode), tripData, { merge: true });
    
    setTimeout(() => {
      toast({ title: "تم الحفظ", description: `رقم الرحلة: ${tripCode}` });
      setIsAdding(false);
      setIsSubmitting(false);
    }, 500);
  };

  const handleUpdatePaymentStatus = (bookingId: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(firestore, "bookings", bookingId), { paymentStatus: newStatus });
    toast({ title: "تم التحديث", description: "تم تعديل حالة الدفع" });
  };

  const handleEditPassenger = (p: any) => {
    setEditingPassengerData({
      bookingId: p.bookingId,
      index: p.passengerIndex,
      fullName: p.fullName,
      passportNumber: p.passportNumber,
      phone: p.phone,
      email: p.email,
      status: p.status || 'Confirmed'
    });
    setIsEditingPassenger(true);
  };

  const handleSavePassenger = async () => {
    if (!editingPassengerData) return;
    setIsSavingEdit(true);
    try {
      const docRef = doc(firestore, "bookings", editingPassengerData.bookingId);
      const bookingDoc = await getDoc(docRef);
      if (bookingDoc.exists()) {
        const passengers = [...bookingDoc.data().passengers];
        passengers[editingPassengerData.index] = {
          ...passengers[editingPassengerData.index],
          fullName: editingPassengerData.fullName,
          passportNumber: editingPassengerData.passportNumber,
          status: editingPassengerData.status
        };
        updateDocumentNonBlocking(docRef, {
          passengers,
          userPhone: editingPassengerData.phone,
          userEmail: editingPassengerData.email
        });
        toast({ title: "تم التحديث", description: "تم حفظ بيانات المسافر" });
        setIsEditingPassenger(false);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleStatus = async (p: any) => {
    const newStatus = p.status === 'Cancelled' ? 'Confirmed' : 'Cancelled';
    const docRef = doc(firestore, "bookings", p.bookingId);
    const bookingDoc = await getDoc(docRef);
    if (bookingDoc.exists()) {
      const passengers = [...bookingDoc.data().passengers];
      passengers[p.passengerIndex].status = newStatus;
      updateDocumentNonBlocking(docRef, { passengers });
      toast({ title: "تم التغيير", description: `الحالة: ${newStatus}` });
    }
  };

  const handlePrintIndividual = (p: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const date = p.departureTime ? format(new Date(p.departureTime), "EEEE, d MMMM yyyy", { locale: ar }) : "";
    const time = p.departureTime ? format(new Date(p.departureTime), "HH:mm", { locale: ar }) : "";

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تذكرة - ${p.fullName}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; text-align: right; }
            .ticket { border: 2px solid #003d2d; border-radius: 20px; padding: 30px; max-width: 600px; margin: auto; }
            .header { border-bottom: 2px solid #003d2d; margin-bottom: 20px; padding-bottom: 10px; display: flex; justify-content: space-between; }
            .info { margin-bottom: 15px; }
            .label { font-size: 12px; color: #666; }
            .value { font-weight: bold; font-size: 18px; }
            .trip-ref { font-size: 24px; color: #003d2d; font-weight: 900; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="ticket">
            <div class="header">
              <div><h1>العوجان للسفر</h1></div>
              <div style="text-align: left;"><p class="label">رقم التتبع</p><p class="trip-ref">${p.tripId}</p></div>
            </div>
            <div class="info"><p class="label">المسافر</p><p class="value">${p.fullName}</p></div>
            <div class="info"><p class="label">المقعد</p><p class="value">#${p.seatNumber}</p></div>
            <div class="info"><p class="label">من</p><p class="value">${p.boardingPoint}</p></div>
            <div class="info"><p class="label">إلى</p><p class="value">${p.droppingPoint}</p></div>
            <div class="info"><p class="label">تاريخ الانطلاق</p><p class="value">${date}</p></div>
            <div class="info"><p class="label">وقت الانطلاق</p><p class="value">${time}</p></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 pb-32 text-right">
      <header className="flex items-center justify-between bg-white p-5 rounded-3xl shadow-sm border border-primary/5 no-print">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center"><Navigation className="h-6 w-6 text-white" /></div>
          <div><h1 className="text-xl font-black text-primary">إدارة الرحلات</h1></div>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl h-12 font-bold px-6">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4 ml-2" /> إضافة رحلة awXXX</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="rounded-3xl shadow-xl border-primary/10 no-print">
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><Label>من</Label>
                <Select onValueChange={setOriginId} value={originId}>
                  <SelectTrigger className="h-12 rounded-xl text-right"><SelectValue placeholder="مدينة الانطلاق" /></SelectTrigger>
                  <SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>إلى</Label>
                <Select onValueChange={setDestinationId} value={destinationId}>
                  <SelectTrigger className="h-12 rounded-xl text-right"><SelectValue placeholder="مدينة الوصول" /></SelectTrigger>
                  <SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2"><Label>تاريخ السفر</Label>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="h-12 w-full rounded-xl justify-end">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر التاريخ"}</Button></PopoverTrigger>
                  <PopoverContent className="p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2"><Label>وقت التحرك</Label><Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="h-12 rounded-xl" /></div>
              <div className="space-y-2"><Label>السعر</Label><Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(e.target.value)} className="h-12 rounded-xl font-bold" /></div>
            </div>
            <div className="space-y-2"><Label>الحافلة</Label>
              <Select onValueChange={setBusId} value={busId}>
                <SelectTrigger className="h-12 rounded-xl text-right"><SelectValue placeholder="اختر حافلة" /></SelectTrigger>
                <SelectContent>{buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate} - {b.model}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddTrip} disabled={isSubmitting} className="w-full h-14 rounded-2xl font-black">نشر الرحلة</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 no-print">
        {isTripsLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div> : trips?.map(trip => (
          <Card key={trip.id} className="rounded-3xl border-none shadow-sm ring-1 ring-primary/5 hover:ring-primary/20 transition-all no-print">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1 w-full text-right">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center"><Bus className="h-7 w-7 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <p className="font-black text-lg">{trip.originName} ⬅ {trip.destinationName}</p>
                    <Badge variant="outline" className="font-black text-primary">{trip.id}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold flex gap-4 justify-end">
                    <span>{format(new Date(trip.departureTime), "PPP", { locale: ar })}</span>
                    <span>{format(new Date(trip.departureTime), "p", { locale: ar })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog onOpenChange={(open) => { if (open) setSelectedTripForManifest(trip); }}>
                  <DialogTrigger asChild><Button variant="outline" className="rounded-xl h-12 gap-2 font-bold"><Users className="h-4 w-4" /> كشف الركاب</Button></DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl p-8 text-right">
                    <DialogHeader className="flex flex-row items-center justify-between border-b pb-6 no-print">
                      <div className="text-right"><DialogTitle className="text-2xl font-black">بيان الركاب: {trip.id}</DialogTitle></div>
                      <Button variant="outline" className="rounded-xl h-12" onClick={() => window.print()}><Printer className="h-4 w-4 ml-2" /> طباعة</Button>
                    </DialogHeader>
                    <div className="mt-8 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-primary/5 font-black text-primary border-b">
                          <tr><th className="p-4 border-l">مقعد</th><th className="p-4">المسافر</th><th className="p-4">الجواز/الهاتف</th><th className="p-4">الدفع</th><th className="p-4 no-print">إجراء</th><th className="p-4">الحالة</th></tr>
                        </thead>
                        <tbody className="divide-y">
                          {isManifestLoading ? <tr><td colSpan={6} className="text-center p-10"><Loader2 className="animate-spin mx-auto" /></td></tr> : passengersList.map((p: any, idx) => (
                            <tr key={idx} className={cn(p.status === 'Cancelled' && "bg-red-50 opacity-60")}>
                              <td className="p-4 text-center border-l font-black text-lg">{p.seatNumber}</td>
                              <td className="p-4 font-black">{p.fullName}</td>
                              <td className="p-4 text-xs">جواز: {p.passportNumber}<br/>هاتف: {p.phone}</td>
                              <td className="p-4">
                                <Select defaultValue={p.paymentStatus} onValueChange={(val) => handleUpdatePaymentStatus(p.bookingId, val)}>
                                  <SelectTrigger className="h-8 text-[10px] w-24 no-print"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="Pending">معلق</SelectItem><SelectItem value="Completed">مدفوع</SelectItem></SelectContent>
                                </Select>
                              </td>
                              <td className="p-4 no-print">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditPassenger(p)}><Edit className="h-4 w-4 text-primary" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(p)}>
                                    {p.status === 'Cancelled' ? <UserCheck className="h-4 w-4 text-emerald-600" /> : <UserX className="h-4 w-4 text-red-600" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handlePrintIndividual(p)}><Printer className="h-4 w-4 text-slate-400" /></Button>
                                </div>
                              </td>
                              <td className="p-4"><Badge className={cn("text-[9px]", p.status === 'Cancelled' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>{p.status === 'Cancelled' ? 'ملغى' : 'مؤكد'}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => { if(confirm("حذف؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} className="text-red-500 rounded-full h-12 w-12"><Trash2 className="h-5 w-5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditingPassenger} onOpenChange={setIsEditingPassenger}>
        <DialogContent className="rounded-3xl text-right">
          <DialogHeader><DialogTitle>تعديل بيانات الراكب</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>الاسم</Label><Input value={editingPassengerData?.fullName || ""} onChange={e => setEditingPassengerData({...editingPassengerData, fullName: e.target.value})} className="h-12 rounded-xl" /></div>
            <div className="space-y-2"><Label>الجواز</Label><Input value={editingPassengerData?.passportNumber || ""} onChange={e => setEditingPassengerData({...editingPassengerData, passportNumber: e.target.value})} className="h-12 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>الهاتف</Label><Input value={editingPassengerData?.phone || ""} onChange={e => setEditingPassengerData({...editingPassengerData, phone: e.target.value})} className="h-12 rounded-xl" /></div>
              <div className="space-y-2"><Label>البريد</Label><Input value={editingPassengerData?.email || ""} onChange={e => setEditingPassengerData({...editingPassengerData, email: e.target.value})} className="h-12 rounded-xl" /></div>
            </div>
            <div className="space-y-2"><Label>الحالة</Label>
              <Select value={editingPassengerData?.status || "Confirmed"} onValueChange={val => setEditingPassengerData({...editingPassengerData, status: val})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Confirmed">مؤكد</SelectItem><SelectItem value="Cancelled">ملغى</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button onClick={handleSavePassenger} disabled={isSavingEdit} className="flex-1 h-12 rounded-xl">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}