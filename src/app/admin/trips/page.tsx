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
  
  // حالات تعديل الراكب
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

  // استعلام كشف الركاب
  const manifestQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTripForManifest) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", selectedTripForManifest.id));
  }, [firestore, selectedTripForManifest]);

  const { data: bookings, isLoading: isManifestLoading } = useCollection(manifestQuery);

  // تحويل الحجوزات إلى قائمة ركاب مسطحة
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
      toast({ title: "تم الحفظ", description: `رقم الرحلة الجديد: ${tripCode}` });
      setIsAdding(false);
      setIsSubmitting(false);
    }, 500);
  };

  const handleUpdatePaymentStatus = (bookingId: string, newStatus: string) => {
    updateDocumentNonBlocking(doc(firestore, "bookings", bookingId), { paymentStatus: newStatus });
    toast({ title: "تم التحديث", description: "تم تعديل حالة الدفع للمسافر" });
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
        toast({ title: "تم التحديث", description: "تم حفظ بيانات المسافر الجديدة" });
        setIsEditingPassenger(false);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ في التحديث" });
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
      toast({ title: "تم التغيير", description: `حالة الراكب أصبحت: ${newStatus}` });
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
            body { font-family: 'Arial', sans-serif; padding: 40px; text-align: right; color: #1a1a1a; }
            .ticket { border: 2px solid #003d2d; border-radius: 25px; padding: 40px; max-width: 650px; margin: auto; position: relative; }
            .header { border-bottom: 3px solid #003d2d; margin-bottom: 30px; padding-bottom: 15px; display: flex; justify-content: space-between; align-items: center; }
            .info { margin-bottom: 20px; }
            .label { font-size: 13px; color: #777; font-weight: bold; margin-bottom: 5px; }
            .value { font-weight: 900; font-size: 20px; color: #003d2d; }
            .trip-ref { font-size: 32px; color: #003d2d; font-weight: 900; letter-spacing: 2px; }
            .footer { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px; font-size: 11px; color: #999; text-align: center; }
            h1 { margin: 0; color: #003d2d; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="ticket">
            <div class="header">
              <div><h1>العوجان للسفر</h1><p>Al-Awajan Travel Official</p></div>
              <div style="text-align: left;"><p class="label">رمز التتبع (REF)</p><p class="trip-ref">${p.tripId}</p></div>
            </div>
            <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 20px;">
              <div class="info"><p class="label">المسافر</p><p class="value">${p.fullName}</p></div>
              <div class="info" style="text-align: left;"><p class="label">رقم المقعد</p><p class="value">#${p.seatNumber}</p></div>
              <div class="info"><p class="label">محطة الانطلاق</p><p class="value">${p.boardingPoint}</p></div>
              <div class="info" style="text-align: left;"><p class="label">محطة الوصول</p><p class="value">${p.droppingPoint}</p></div>
              <div class="info"><p class="label">تاريخ السفر</p><p class="value">${date}</p></div>
              <div class="info" style="text-align: left;"><p class="label">وقت التحرك</p><p class="value">${time}</p></div>
            </div>
            <div class="footer">تذكرة إلكترونية رسمية صالحة للسفر - شكراً لثقتكم بالعوجان</div>
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
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg"><Navigation className="h-6 w-6 text-white" /></div>
          <div><h1 className="text-xl font-black text-primary leading-none">إدارة الرحلات</h1><p className="text-[10px] text-muted-foreground mt-1">إضافة الرحلات وإدارة كشوف الركاب</p></div>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl h-12 font-bold px-6 shadow-md">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4 ml-2" /> إضافة رحلة awXXX</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="rounded-[2.5rem] shadow-2xl border-primary/10 animate-in slide-in-from-top-4 duration-500 no-print">
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><Label className="font-bold">من مدينة الانطلاق</Label>
                <Select onValueChange={setOriginId} value={originId}>
                  <SelectTrigger className="h-14 rounded-2xl text-right bg-muted/20 border-primary/5"><SelectValue placeholder="اختر مدينة الانطلاق" /></SelectTrigger>
                  <SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="font-bold">إلى مدينة الوصول</Label>
                <Select onValueChange={setDestinationId} value={destinationId}>
                  <SelectTrigger className="h-14 rounded-2xl text-right bg-muted/20 border-primary/5"><SelectValue placeholder="اختر مدينة الوصول" /></SelectTrigger>
                  <SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2"><Label className="font-bold">تاريخ السفر</Label>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="h-14 w-full rounded-2xl justify-end bg-muted/20 border-primary/5">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر التاريخ"}<CalendarIcon className="mr-3 h-4 w-4 opacity-50" /></Button></PopoverTrigger>
                  <PopoverContent className="p-0 rounded-3xl"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2"><Label className="font-bold">وقت التحرك</Label><Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-primary/5 font-bold" /></div>
              <div className="space-y-2"><Label className="font-bold">سعر التذكرة</Label><Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-primary/5 font-black text-primary" /></div>
            </div>
            <div className="space-y-2"><Label className="font-bold">الحافلة المخصصة</Label>
              <Select onValueChange={setBusId} value={busId}>
                <SelectTrigger className="h-14 rounded-2xl text-right bg-muted/20 border-primary/5"><SelectValue placeholder="اختر الحافلة من الأسطول" /></SelectTrigger>
                <SelectContent>{buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate} - {b.model} ({b.capacity} مقعد)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddTrip} disabled={isSubmitting} className="w-full h-16 rounded-2xl font-black text-lg bg-primary shadow-xl">نشر الرحلة وتفعيل الحجز</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 no-print">
        {isTripsLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div> : trips?.sort((a,b) => b.createdAt?.localeCompare(a.createdAt)).map(trip => (
          <Card key={trip.id} className="rounded-3xl border-none shadow-sm ring-1 ring-primary/5 hover:ring-primary/20 transition-all group no-print">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1 w-full text-right">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary transition-colors"><Bus className="h-7 w-7 text-primary group-hover:text-white transition-colors" /></div>
                <div>
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <p className="font-black text-lg text-slate-900">{trip.originName} ⬅ {trip.destinationName}</p>
                    <Badge variant="outline" className="font-black text-primary border-primary/20 px-3">{trip.id}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold flex gap-4 justify-end items-center">
                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(trip.departureTime), "p", { locale: ar })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog onOpenChange={(open) => { if (open) setSelectedTripForManifest(trip); }}>
                  <DialogTrigger asChild><Button variant="outline" className="rounded-xl h-12 gap-2 font-bold px-6 border-primary/10 hover:bg-primary/5"><Users className="h-4 w-4" /> كشف الركاب</Button></DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 text-right bg-white shadow-2xl">
                    <DialogHeader className="flex flex-row items-center justify-between border-b pb-6 no-print">
                      <div className="text-right">
                        <DialogTitle className="text-2xl font-black text-primary">بيان ركاب الرحلة: {trip.id}</DialogTitle>
                        <DialogDescription className="font-bold">{trip.originName} ⬅ {trip.destinationName} | {format(new Date(trip.departureTime), "PPP", { locale: ar })}</DialogDescription>
                      </div>
                      <Button variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => window.print()}><Printer className="h-4 w-4 ml-2" /> طباعة الكشف الكامل</Button>
                    </DialogHeader>
                    <div className="mt-8 overflow-x-auto print-area">
                      <table className="w-full text-sm">
                        <thead className="bg-primary/5 font-black text-primary border-b">
                          <tr>
                            <th className="p-4 border-l">مقعد</th>
                            <th className="p-4">المسافر</th>
                            <th className="p-4">الجواز / الهاتف</th>
                            <th className="p-4">طريقة الدفع</th>
                            <th className="p-4">حالة الدفع</th>
                            <th className="p-4 no-print">إجراءات الإدارة</th>
                            <th className="p-4">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {isManifestLoading ? <tr><td colSpan={7} className="text-center p-12"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary opacity-20" /></td></tr> : passengersList.map((p: any, idx) => (
                            <tr key={idx} className={cn("hover:bg-primary/5 transition-colors", p.status === 'Cancelled' && "bg-red-50/50 opacity-60")}>
                              <td className="p-4 text-center border-l font-black text-lg text-primary">{p.seatNumber}</td>
                              <td className="p-4">
                                <p className="font-black text-slate-900">{p.fullName}</p>
                                <p className="text-[10px] text-muted-foreground">{p.email}</p>
                              </td>
                              <td className="p-4 text-xs font-bold space-y-1">
                                <div className="flex items-center gap-1 opacity-70"><FileText className="h-3 w-3" /> {p.passportNumber}</div>
                                <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</div>
                              </td>
                              <td className="p-4"><Badge variant="outline" className="text-[10px] font-bold border-primary/5">{p.paymentMethodLabel}</Badge></td>
                              <td className="p-4">
                                <Select defaultValue={p.paymentStatus} onValueChange={(val) => handleUpdatePaymentStatus(p.bookingId, val)}>
                                  <SelectTrigger className="h-8 text-[10px] w-28 no-print rounded-lg font-bold"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Pending">معلق (لم يدفع)</SelectItem>
                                    <SelectItem value="Completed">مكتمل (تم الدفع)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="p-4 no-print">
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditPassenger(p)} title="تعديل بيانات الراكب"><Edit className="h-4 w-4 text-primary" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(p)} title={p.status === 'Cancelled' ? "إعادة تفعيل" : "إلغاء الحجز"}>
                                    {p.status === 'Cancelled' ? <UserCheck className="h-4 w-4 text-emerald-600" /> : <UserX className="h-4 w-4 text-red-600" />}
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handlePrintIndividual(p)} title="طباعة تذكرة فردية"><Printer className="h-4 w-4 text-slate-400" /></Button>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge className={cn("text-[9px] font-black rounded-lg px-3", p.status === 'Cancelled' ? "bg-red-100 text-red-700 hover:bg-red-100" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100")}>
                                  {p.status === 'Cancelled' ? 'حجز ملغى' : 'حجز مؤكد'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {!isManifestLoading && passengersList.length === 0 && (
                            <tr><td colSpan={7} className="text-center p-20 text-muted-foreground font-bold">لا يوجد ركاب مسجلون في هذه الرحلة بعد</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={() => { if(confirm("هل أنت متأكد من حذف هذه الرحلة نهائياً؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} className="text-red-500 hover:bg-red-50 rounded-full h-12 w-12 transition-colors"><Trash2 className="h-5 w-5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* مودال تعديل بيانات الراكب */}
      <Dialog open={isEditingPassenger} onOpenChange={setIsEditingPassenger}>
        <DialogContent className="rounded-3xl p-8 text-right bg-white shadow-2xl border-primary/5">
          <DialogHeader className="border-b pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-primary">تعديل بيانات الراكب</DialogTitle>
            <DialogDescription>تحديث المعلومات الشخصية للمسافر في قاعدة البيانات</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="font-bold">اسم المسافر بالكامل</Label>
              <Input value={editingPassengerData?.fullName || ""} onChange={e => setEditingPassengerData({...editingPassengerData, fullName: e.target.value})} className="h-12 rounded-xl bg-muted/20" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">رقم جواز السفر / الهوية</Label>
              <Input value={editingPassengerData?.passportNumber || ""} onChange={e => setEditingPassengerData({...editingPassengerData, passportNumber: e.target.value})} className="h-12 rounded-xl bg-muted/20 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">رقم هاتف التواصل</Label>
                <Input value={editingPassengerData?.phone || ""} onChange={e => setEditingPassengerData({...editingPassengerData, phone: e.target.value})} className="h-12 rounded-xl bg-muted/20 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">البريد الإلكتروني</Label>
                <Input value={editingPassengerData?.email || ""} onChange={e => setEditingPassengerData({...editingPassengerData, email: e.target.value})} className="h-12 rounded-xl bg-muted/20" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">حالة الحجز</Label>
              <Select value={editingPassengerData?.status || "Confirmed"} onValueChange={val => setEditingPassengerData({...editingPassengerData, status: val})}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Confirmed">مؤكد (Confirmed)</SelectItem>
                  <SelectItem value="Cancelled">ملغى (Cancelled)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsEditingPassenger(false)} className="h-12 rounded-xl font-bold flex-1">إلغاء</Button>
            <Button onClick={handleSavePassenger} disabled={isSavingEdit} className="flex-1 h-12 rounded-xl bg-primary font-black shadow-lg">
              {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 ml-2" /> حفظ التعديلات</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}