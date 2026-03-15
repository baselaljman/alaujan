
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
  Phone
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
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى اختيار المدن والحافلة والتاريخ." });
      return;
    }

    setIsSubmitting(true);
    
    // حساب رقم التتبع الموحد بالتسلسل aw001, aw002...
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
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "حافلة غير محددة",
      originId,
      originName: locations?.find(l => l.id === originId)?.name || "",
      destinationId,
      destinationName: locations?.find(l => l.id === destinationId)?.name || "",
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepartureTime.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(firestore, "busTrips", tripCode), tripData, { merge: true });
    
    setTimeout(() => {
      toast({ title: "تم الحفظ", description: `تمت برمجة الرحلة الدولية برقم: ${tripCode}` });
      setIsAdding(false);
      setIsSubmitting(false);
      setBusId("");
      setOriginId("");
      setDestinationId("");
      setDepartureDate(undefined);
    }, 500);
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
      const bookingDoc = await getDoc(doc(firestore, "bookings", editingPassengerData.bookingId));
      if (bookingDoc.exists()) {
        const passengers = [...bookingDoc.data().passengers];
        passengers[editingPassengerData.index] = {
          ...passengers[editingPassengerData.index],
          fullName: editingPassengerData.fullName,
          passportNumber: editingPassengerData.passportNumber,
          status: editingPassengerData.status
        };

        updateDocumentNonBlocking(doc(firestore, "bookings", editingPassengerData.bookingId), {
          passengers: passengers,
          userPhone: editingPassengerData.phone,
          userEmail: editingPassengerData.email
        });
        
        toast({ title: "تم التحديث", description: "تم تحديث بيانات المسافر بنجاح" });
        setIsEditingPassenger(false);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحديث البيانات" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleToggleStatus = async (p: any) => {
    const newStatus = p.status === 'Cancelled' ? 'Confirmed' : 'Cancelled';
    const bookingDoc = await getDoc(doc(firestore, "bookings", p.bookingId));
    if (bookingDoc.exists()) {
      const passengers = [...bookingDoc.data().passengers];
      passengers[p.passengerIndex].status = newStatus;
      
      updateDocumentNonBlocking(doc(firestore, "bookings", p.bookingId), {
        passengers: passengers
      });
      
      toast({ title: "تم تغيير الحالة", description: `حالة المقعد الآن: ${newStatus === 'Cancelled' ? 'ملغى' : 'مؤكد'}` });
    }
  };

  const handlePrintIndividual = (p: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedDate = p.departureTime ? format(new Date(p.departureTime), "EEEE, d MMMM yyyy", { locale: ar }) : "قيد التحديث";
    const formattedTime = p.departureTime ? format(new Date(p.departureTime), "HH:mm", { locale: ar }) : "00:00";

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>تذكرة العوجان - ${p.fullName}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; text-align: right; background: #fff; }
            .ticket { border: 3px solid #003d2d; border-radius: 30px; padding: 40px; max-width: 650px; margin: auto; position: relative; overflow: hidden; }
            .header { border-bottom: 2px solid #003d2d; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand h1 { color: #003d2d; margin: 0; font-size: 28px; font-weight: 900; }
            .trip-ref { text-align: left; }
            .trip-ref .label { font-size: 10px; color: #999; }
            .trip-ref .value { font-family: monospace; font-weight: 900; font-size: 32px; color: #003d2d; line-height: 1; }
            .info-item { margin-bottom: 15px; }
            .label { font-size: 11px; color: #888; margin-bottom: 4px; font-weight: bold; }
            .value { font-weight: 900; font-size: 18px; color: #333; }
            .route-box { background: #f9f9f9; padding: 20px; border-radius: 20px; margin: 20px 0; display: flex; justify-content: space-between; align-items: center; }
            .footer { margin-top: 40px; border-top: 1px dashed #ddd; pt: 20px; font-size: 10px; color: #aaa; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="ticket">
            <div class="header">
              <div class="brand">
                <h1>شركة العوجان للسفر</h1>
                <p>تذكرة سفر إلكترونية معتمدة</p>
              </div>
              <div class="trip-ref">
                <div class="label">رقم تتبع الرحلة (REF)</div>
                <div class="value">${p.tripId}</div>
              </div>
            </div>
            <div style="display: flex; gap: 40px;">
              <div style="flex: 1;">
                <div class="info-item">
                  <div class="label">اسم المسافر</div>
                  <div class="value">${p.fullName}</div>
                </div>
                <div class="info-item">
                  <div class="label">رقم الجواز / الهوية</div>
                  <div class="value">${p.passportNumber}</div>
                </div>
              </div>
              <div style="text-align: left;">
                <div class="info-item">
                  <div class="label">رقم المقعد</div>
                  <div style="font-size: 48px; font-weight: 900; color: #003d2d; line-height: 1;">#${p.seatNumber}</div>
                </div>
              </div>
            </div>
            <div class="route-box">
              <div style="flex: 1;">
                <div class="label">من</div>
                <div class="value">${p.boardingPoint}</div>
              </div>
              <div style="padding: 0 20px; font-size: 24px; color: #003d2d;">←</div>
              <div style="flex: 1; text-align: left;">
                <div class="label">إلى</div>
                <div class="value">${p.droppingPoint}</div>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px;">
              <div class="info-item">
                <div class="label">تاريخ السفر</div>
                <div class="value" style="color: #003d2d;">${formattedDate}</div>
              </div>
              <div class="info-item" style="text-align: left;">
                <div class="label">وقت الانطلاق</div>
                <div class="value" style="font-size: 24px;">${formattedTime}</div>
              </div>
            </div>
            <div class="footer">
              * يرجى الحضور قبل موعد الرحلة بساعة.<br>
              * التتبع متاح عبر الرمز (${p.tripId}) على alaujantravel.com
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-32 text-right">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2rem] shadow-sm border border-primary/5 no-print">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary">إدارة الرحلات الدولية</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Unified Tracking System</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className={cn("rounded-xl h-12 font-bold px-6", isAdding ? "bg-red-50 text-red-600 hover:bg-red-100" : "shadow-lg")}
        >
          {isAdding ? "إلغاء العملية" : <><Plus className="h-4 w-4 ml-2" /> إضافة رحلة awXXX</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 border-primary/10 no-print">
          <CardHeader className="bg-primary/5 border-b py-6 text-right">
            <CardTitle className="text-lg font-black text-primary flex items-center gap-2 justify-end">
              <span>تخطيط مسار دولي جديد</span>
              <Bus className="h-5 w-5" />
            </CardTitle>
            <CardDescription>سيتم تعيين رقم تتبع تلقائي بالتسلسل aw001, aw002...</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAddTrip} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">مدينة الانطلاق <MapPin className="h-3 w-3 text-primary" /></Label>
                  <Select onValueChange={setOriginId} value={originId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-right"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.country})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">مدينة الوصول <Navigation className="h-3 w-3 text-primary" /></Label>
                  <Select onValueChange={setDestinationId} value={destinationId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-right"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.country})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">تاريخ السفر <CalendarIcon className="h-3 w-3 text-primary" /></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("h-14 w-full rounded-2xl justify-end text-right bg-slate-50 border-none shadow-inner", !departureDate && "text-muted-foreground")}>
                        {departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl" align="center">
                      <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">وقت التحرك <Clock className="h-3 w-3 text-primary" /></Label>
                  <Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner" />
                </div>
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">السعر (ريال) <Banknote className="h-3 w-3 text-primary" /></Label>
                  <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-black" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold flex items-center gap-2 justify-end">الحافلة <Bus className="h-3 w-3 text-primary" /></Label>
                <Select onValueChange={setBusId} value={busId}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner text-right"><SelectValue placeholder="اختر حافلة" /></SelectTrigger>
                  <SelectContent>
                    {buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate} - {b.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.75rem] font-black text-lg shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "نشر وبرمجة الرحلة"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 no-print">
        <h3 className="font-black text-lg text-primary px-1 flex items-center gap-2 justify-end">جدول الرحلات</h3>
        {isTripsLoading ? (
          <div className="flex justify-center p-20 opacity-20"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="rounded-[2rem] border-none shadow-sm ring-1 ring-primary/5 hover:ring-primary/20 transition-all bg-white group no-print">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1 w-full text-right">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/5 shadow-inner">
                  <Bus className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <p className="font-black text-lg">{trip.originName} ⬅ {trip.destinationName}</p>
                    <Badge variant="outline" className="text-[12px] font-black border-primary/10 text-primary uppercase">{trip.id}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-4 justify-end">
                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(trip.departureTime), "p", { locale: ar })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Dialog onOpenChange={(open) => { if (open) setSelectedTripForManifest(trip); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl h-12 gap-2 font-bold flex-1 md:flex-none">
                      <Users className="h-4 w-4" /> كشف الركاب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl manifest-dialog">
                    <div className="p-8 space-y-8 text-right print-area">
                      <DialogHeader className="flex flex-row items-center justify-between border-b pb-6 no-print">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                            <FileText className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-right">
                            <DialogTitle className="text-2xl font-black text-primary">بيان الركاب الرسمي</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground font-bold tracking-widest mt-1">Passenger Manifest - {trip.id}</DialogDescription>
                          </div>
                        </div>
                        <Button variant="outline" className="rounded-xl gap-2 font-bold h-12 px-6" onClick={handlePrint}>
                          <Printer className="h-4 w-4" /> طباعة الكشف
                        </Button>
                      </DialogHeader>

                      <div className="manifest-content">
                        <div className="flex justify-between items-center border-b-2 border-primary pb-6 mb-8">
                          <div className="text-right">
                            <h2 className="text-3xl font-black text-primary mb-1">شركة العوجان للسياحة والسفر</h2>
                            <p className="font-bold text-slate-700">كشف ركاب الرحلة: <span className="text-primary font-mono font-black">{trip.id}</span></p>
                          </div>
                          <div className="text-left text-xs bg-slate-50 p-4 rounded-2xl border">
                            <p className="mb-1">تاريخ الرحلة: <span className="font-black">{format(new Date(trip.departureTime), "PPP", { locale: ar })}</span></p>
                            <p>الحافلة: <span className="font-black">{trip.busLabel}</span></p>
                          </div>
                        </div>

                        {isManifestLoading ? (
                          <div className="flex justify-center p-20"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>
                        ) : passengersList.length === 0 ? (
                          <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                            <p className="text-muted-foreground font-bold">لا توجد حجوزات مؤكدة لهذه الرحلة</p>
                          </div>
                        ) : (
                          <div className="rounded-[2rem] border border-primary/10 overflow-hidden shadow-sm overflow-x-auto">
                            <table className="w-full text-right text-sm border-collapse">
                              <thead className="bg-primary/5 border-b-2 border-primary/10 font-black text-primary">
                                <tr>
                                  <th className="px-6 py-5 text-center border-l">مقعد</th>
                                  <th className="px-6 py-5">المسافر</th>
                                  <th className="px-6 py-5">الجواز / الهاتف</th>
                                  <th className="px-6 py-5 no-print">إجراءات</th>
                                  <th className="px-6 py-5">الحالة</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {passengersList.map((p: any, idx: number) => (
                                  <tr key={idx} className={cn("hover:bg-primary/5 transition-colors", p.status === 'Cancelled' && "bg-red-50/50 opacity-60")}>
                                    <td className="px-6 py-4 text-center border-l bg-primary/5">
                                      <span className="font-black text-primary text-lg">{p.seatNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-900">
                                      <div className="flex flex-col">
                                        <span className={cn(p.status === 'Cancelled' && "line-through")}>{p.fullName}</span>
                                        <span className="text-[9px] text-muted-foreground flex items-center gap-1">{p.email}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                      <div className="flex flex-col">
                                        <span>جواز: {p.passportNumber}</span>
                                        <span className="text-primary font-bold">هاتف: {p.phone}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 no-print">
                                      <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEditPassenger(p)}>
                                          <Edit className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleToggleStatus(p)}>
                                          {p.status === 'Cancelled' ? <UserCheck className="h-4 w-4 text-emerald-600" /> : <UserX className="h-4 w-4 text-red-600" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handlePrintIndividual(p)}>
                                          <Printer className="h-4 w-4 text-slate-400" />
                                        </Button>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <Badge className={cn(
                                        "text-[9px] font-bold px-3 py-0.5 rounded-full",
                                        p.status === 'Cancelled' ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                                      )}>
                                        {p.status === 'Cancelled' ? 'ملغاة' : 'مؤكدة'}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="icon" onClick={() => { if(confirm("حذف الرحلة؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} className="text-red-500 rounded-full h-12 w-12 no-print">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditingPassenger} onOpenChange={setIsEditingPassenger}>
        <DialogContent className="rounded-[2rem] text-right">
          <DialogHeader className="text-right">
            <DialogTitle>تعديل بيانات الراكب</DialogTitle>
            <DialogDescription>تحديث بيانات المسافر في الرحلة {selectedTripForManifest?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={editingPassengerData?.fullName || ""} onChange={e => setEditingPassengerData({...editingPassengerData, fullName: e.target.value})} className="rounded-xl h-12" />
            </div>
            <div className="space-y-2">
              <Label>رقم الجواز</Label>
              <Input value={editingPassengerData?.passportNumber || ""} onChange={e => setEditingPassengerData({...editingPassengerData, passportNumber: e.target.value})} className="rounded-xl h-12" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input value={editingPassengerData?.phone || ""} onChange={e => setEditingPassengerData({...editingPassengerData, phone: e.target.value})} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input value={editingPassengerData?.email || ""} onChange={e => setEditingPassengerData({...editingPassengerData, email: e.target.value})} className="rounded-xl h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>حالة المقعد</Label>
              <Select value={editingPassengerData?.status || "Confirmed"} onValueChange={val => setEditingPassengerData({...editingPassengerData, status: val})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Confirmed">مؤكد</SelectItem><SelectItem value="Cancelled">ملغى</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditingPassenger(false)} className="flex-1 rounded-xl">إلغاء</Button>
            <Button onClick={handleSavePassenger} disabled={isSavingEdit} className="flex-1 rounded-xl gap-2">
              {isSavingEdit ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save className="h-4 w-4" /> حفظ البيانات</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
