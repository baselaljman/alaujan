
"use client"

import { useState, useMemo, useRef } from "react";
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
} from "@/components/ui/dialog";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
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
  QrCode,
  Ticket as TicketIcon
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
  const [selectedPassengerForTicket, setSelectedPassengerForTicket] = useState<any>(null);
  
  // State for Trip Form
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

  // استعلام الحجوزات من المجموعة الموحدة العلوية
  const manifestQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTripForManifest) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", selectedTripForManifest.id));
  }, [firestore, selectedTripForManifest]);

  const { data: bookings, isLoading: isManifestLoading } = useCollection(manifestQuery);

  const passengersList = useMemo(() => {
    if (!bookings) return [];
    return bookings.flatMap((booking: any) => 
      (booking.passengers || []).map((p: any) => ({
        ...p,
        phone: booking.userPhone,
        paymentStatus: booking.paymentStatus,
        trackingNumber: booking.trackingNumber,
        bookingId: booking.id,
        boardingPoint: booking.boardingPoint,
        droppingPoint: booking.droppingPoint,
        tripId: booking.busTripId
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
    const randomSuffix = Math.floor(100 + Math.random() * 899);
    const nextId = `AWJ-${randomSuffix}`;
    const [hours, minutes] = depTime.split(":").map(Number);
    const finalDepartureTime = setMinutes(setHours(startOfDay(departureDate), hours), minutes);
    
    const selectedBus = buses?.find(b => b.id === busId);
    
    const tripData = {
      id: nextId,
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

    setDocumentNonBlocking(doc(firestore, "busTrips", nextId), tripData, { merge: true });
    
    setTimeout(() => {
      toast({ title: "تم الحفظ", description: `الرحلة الدولية ${nextId} أصبحت نشطة في النظام.` });
      setIsAdding(false);
      setIsSubmitting(false);
      setBusId("");
      setOriginId("");
      setDestinationId("");
      setDepartureDate(undefined);
    }, 500);
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
            <h1 className="text-xl font-black text-primary">غرفة عمليات الرحلات</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">International Fleet Control</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className={cn("rounded-xl h-12 font-bold px-6", isAdding ? "bg-red-50 text-red-600 hover:bg-red-100" : "shadow-lg")}
        >
          {isAdding ? "إلغاء العملية" : <><Plus className="h-4 w-4 ml-2" /> إضافة رحلة دولية</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="rounded-[2.5rem] shadow-2xl animate-in slide-in-from-top-4 duration-500 border-primary/10 no-print">
          <CardHeader className="bg-primary/5 border-b py-6">
            <CardTitle className="text-lg font-black text-primary flex items-center gap-2 justify-end">
              <span>تخطيط رحلة دولية جديدة</span>
              <Bus className="h-5 w-5" />
            </CardTitle>
            <CardDescription>أدخل تفاصيل المسار والحافلة لنشر الرحلة للعملاء</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAddTrip} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">مدينة الانطلاق <MapPin className="h-3 w-3 text-primary" /></Label>
                  <Select onValueChange={setOriginId} value={originId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name} ({l.country})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-bold flex items-center gap-2 justify-end">مدينة الوصول <Navigation className="h-3 w-3 text-primary" /></Label>
                  <Select onValueChange={setDestinationId} value={destinationId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
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
                  <Label className="font-bold flex items-center gap-2 justify-end">سعر التذكرة (ريال) <Banknote className="h-3 w-3 text-primary" /></Label>
                  <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-black text-primary" />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-bold flex items-center gap-2 justify-end">الحافلة المخصصة <Bus className="h-3 w-3 text-primary" /></Label>
                <Select onValueChange={setBusId} value={busId}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none shadow-inner"><SelectValue placeholder="اختر حافلة من الأسطول" /></SelectTrigger>
                  <SelectContent>
                    {buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate} - {b.model} ({b.capacity} مقعد)</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.75rem] font-black text-lg shadow-xl hover:scale-[1.01] transition-all">
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "نشر وبرمجة الرحلة الدولية"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 no-print">
        <h3 className="font-black text-lg text-primary px-1 flex items-center gap-2 justify-end">
          <span>جدول الرحلات النشطة</span>
          <ChevronLeft className="h-5 w-5 text-primary" />
        </h3>
        
        {isTripsLoading ? (
          <div className="flex justify-center p-20 opacity-20"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>
        ) : trips?.length === 0 ? (
          <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
            <Bus className="h-16 w-16 mx-auto mb-4 opacity-10" />
            <p className="text-muted-foreground font-bold">لا توجد رحلات مجدولة حالياً</p>
          </div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="rounded-[2rem] border-none shadow-sm ring-1 ring-primary/5 hover:ring-primary/20 transition-all bg-white group no-print">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1 w-full">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/5 shadow-inner group-hover:bg-primary/10 transition-colors">
                  <Bus className="h-8 w-8 text-primary" />
                </div>
                <div className="text-right flex-1">
                  <div className="flex items-center gap-2 mb-1 justify-end">
                    <p className="font-black text-lg">{trip.originName} <ArrowLeft className="h-3 w-3 text-primary opacity-30" /> {trip.destinationName}</p>
                    <Badge variant="outline" className="text-[9px] font-mono h-5 px-1.5 border-primary/10 text-primary">#{trip.id}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-bold flex items-center gap-4 justify-end">
                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(trip.departureTime), "p", { locale: ar })}</span>
                    <span className="flex items-center gap-1 text-primary"><Users className="h-3 w-3" /> {trip.availableSeats}/{trip.totalSeats} مقعد</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Dialog onOpenChange={(open) => { if (open) setSelectedTripForManifest(trip); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="rounded-xl h-12 gap-2 font-bold flex-1 md:flex-none border-primary/10 hover:bg-primary/5">
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
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Passenger Manifest - {trip.id}</p>
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
                            <p className="font-bold text-slate-700">كشف ركاب الرحلة الدولية رقم: <span className="text-primary font-mono">{trip.id}</span></p>
                            <div className="flex items-center gap-3 mt-2 text-sm">
                              <span className="font-bold">{trip.originName}</span>
                              <ArrowLeft className="h-3 w-3 text-muted-foreground" />
                              <span className="font-bold">{trip.destinationName}</span>
                            </div>
                          </div>
                          <div className="text-left text-xs bg-slate-50 p-4 rounded-2xl border">
                            <p className="mb-1">تاريخ الرحلة: <span className="font-black">{format(new Date(trip.departureTime), "PPP", { locale: ar })}</span></p>
                            <p className="mb-1">وقت التجمع: <span className="font-black">{format(new Date(trip.departureTime), "p", { locale: ar })}</span></p>
                            <p>الحافلة: <span className="font-black">{trip.busLabel}</span></p>
                          </div>
                        </div>

                        {isManifestLoading ? (
                          <div className="flex justify-center p-20"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>
                        ) : passengersList.length === 0 ? (
                          <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                            <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                            <p className="text-muted-foreground font-bold">لا توجد حجوزات مؤكدة لهذه الرحلة حالياً</p>
                          </div>
                        ) : (
                          <div className="rounded-[2rem] border border-primary/10 overflow-hidden shadow-sm">
                            <table className="w-full text-right text-sm border-collapse">
                              <thead className="bg-primary/5 border-b-2 border-primary/10 font-black text-primary">
                                <tr>
                                  <th className="px-6 py-5 text-center border-l">مقعد</th>
                                  <th className="px-6 py-5">اسم المسافر الثلاثي</th>
                                  <th className="px-6 py-5">رقم الجواز / الهوية</th>
                                  <th className="px-6 py-5">رقم الجوال</th>
                                  <th className="px-6 py-5 text-center no-print">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {passengersList.map((p: any, idx: number) => (
                                  <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4 text-center border-l bg-primary/5">
                                      <span className="font-black text-primary text-lg">{p.seatNumber}</span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-900">{p.fullName}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.passportNumber}</td>
                                    <td className="px-6 py-4 font-bold text-xs">
                                      <Smartphone className="h-3 w-3 inline ml-1 opacity-20" /> {p.phone}
                                    </td>
                                    <td className="px-6 py-4 text-center no-print">
                                      <Dialog onOpenChange={(open) => { if (open) setSelectedPassengerForTicket({ ...p, trip }); }}>
                                        <DialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:bg-primary/10">
                                            <Printer className="h-3 w-3" /> تذكرة
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md rounded-[3rem] p-0 border-none shadow-2xl overflow-hidden print-area">
                                          <div className="p-8 space-y-6 text-right">
                                            <div className="flex justify-between items-center border-b pb-6">
                                              <div>
                                                <h3 className="font-black text-primary text-xl">تذكرة سفر إلكترونية</h3>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">E-Ticket Passenger Copy</p>
                                              </div>
                                              <Bus className="h-10 w-10 text-primary opacity-20" />
                                            </div>

                                            <div className="space-y-4 pt-4">
                                              <div className="flex justify-between items-center text-center">
                                                <div className="flex-1">
                                                  <p className="text-[10px] font-bold text-muted-foreground">من</p>
                                                  <p className="font-black text-lg">{p.boardingPoint}</p>
                                                </div>
                                                <ArrowLeft className="h-4 w-4 text-primary opacity-30" />
                                                <div className="flex-1">
                                                  <p className="text-[10px] font-bold text-muted-foreground">إلى</p>
                                                  <p className="font-black text-lg">{p.droppingPoint}</p>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-3xl border border-dashed">
                                                <div>
                                                  <p className="text-[9px] font-bold text-muted-foreground">اسم المسافر</p>
                                                  <p className="font-bold text-sm">{p.fullName}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-muted-foreground">رقم المقعد</p>
                                                  <p className="font-black text-primary text-lg">{p.seatNumber}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-muted-foreground">رقم الرحلة</p>
                                                  <p className="font-mono font-bold text-xs">{p.tripId}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[9px] font-bold text-muted-foreground">تاريخ الانطلاق</p>
                                                  <p className="font-bold text-xs">{format(new Date(trip.departureTime), "PPP", { locale: ar })}</p>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex justify-between items-end pt-6 border-t border-dashed">
                                              <div className="space-y-1">
                                                <p className="text-[10px] font-bold opacity-30">© شركة العوجان للسفر</p>
                                                <p className="text-[9px] font-mono text-muted-foreground">REF: {p.trackingNumber}</p>
                                              </div>
                                              <QrCode className="h-16 w-16 text-slate-800" />
                                            </div>
                                            
                                            <Button className="w-full h-12 rounded-xl gap-2 font-bold no-print" onClick={handlePrint}>
                                              <Printer className="h-4 w-4" /> طباعة هذه التذكرة
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200 grid grid-cols-2 gap-8">
                          <div className="text-right space-y-2">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">مصادقة مدير الرحلة</p>
                            <div className="h-20 w-48 border rounded-2xl bg-slate-50/50 flex items-center justify-center italic text-slate-300">الختم والتوقيع</div>
                          </div>
                          <div className="text-left flex flex-col justify-end gap-1 opacity-30 text-[10px] font-bold">
                            <p>© {new Date().getFullYear()} العوجان للسياحة والسفر</p>
                            <p>تاريخ الاستخراج: {new Date().toLocaleString('ar-EG')}</p>
                            <div className="flex justify-end mt-2"><QrCode className="h-8 w-8" /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { if(confirm("هل أنت متأكد من حذف هذه الرحلة؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} 
                  className="text-red-500 rounded-full hover:bg-red-50 h-12 w-12 shrink-0 transition-colors no-print"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
