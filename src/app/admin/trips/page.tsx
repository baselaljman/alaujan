
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
} from "@/components/ui/dialog";
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase, 
  setDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase";
import { collection, doc, query, where, collectionGroup } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  ArrowLeft,
  CalendarIcon,
  Clock,
  MapPin,
  Banknote,
  Navigation,
  CheckCircle2,
  X,
  Users,
  Printer,
  FileText,
  Search,
  UserCheck,
  Smartphone
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

/**
 * @fileOverview نظام إدارة الرحلات الدولية المتطور مع كشف ركاب ذكي.
 */

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTripForManifest, setSelectedTripForManifest] = useState<any>(null);
  
  // حالات النموذج (Form State)
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  
  // جلب البيانات الأساسية
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading: isLocsLoading } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses, isLoading: isBusesLoading } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  // استعلام كشف الركاب (Manifest Query)
  const manifestQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTripForManifest) return null;
    return query(collectionGroup(firestore, "bookings"), where("busTripId", "==", selectedTripForManifest.id));
  }, [firestore, selectedTripForManifest]);

  const { data: bookings, isLoading: isManifestLoading } = useCollection(manifestQuery);

  // معالجة بيانات الركاب من الحجوزات
  const passengersList = useMemo(() => {
    if (!bookings) return [];
    return bookings.flatMap((booking: any) => 
      (booking.passengers || []).map((p: any) => ({
        ...p,
        phone: booking.userPhone,
        email: booking.userEmail,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethodLabel,
        trackingNumber: booking.trackingNumber
      }))
    ).sort((a: any, b: any) => a.seatNumber - b.seatNumber);
  }, [bookings]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى تعبئة كافة الحقول." });
      return;
    }

    setIsSubmitting(true);
    try {
      const randomSuffix = Math.floor(100 + Math.random() * 899);
      const nextId = `AWJ-${randomSuffix}`;
      const [hours, minutes] = depTime.split(":").map(Number);
      const finalDepartureTime = setMinutes(setHours(startOfDay(departureDate), hours), minutes);
      
      const originName = locations?.find(l => l.id === originId)?.name || "غير محدد";
      const destinationName = locations?.find(l => l.id === destinationId)?.name || "غير محدد";
      const selectedBus = buses?.find(b => b.id === busId);
      
      const tripData = {
        id: nextId,
        busId,
        busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "حافلة غير محددة",
        originId,
        originName,
        destinationId,
        destinationName,
        status: "Scheduled",
        pricePerSeat: Number(pricePerSeat),
        availableSeats: selectedBus?.capacity || 40,
        totalSeats: selectedBus?.capacity || 40,
        departureTime: finalDepartureTime.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setDocumentNonBlocking(doc(firestore, "busTrips", nextId), tripData, { merge: true });
      toast({ title: "تم الحفظ", description: `الرحلة ${nextId} أصبحت نشطة.` });
      setIsAdding(false);
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ فني" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 text-right animate-in fade-in duration-500">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2rem] shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary leading-none">غرفة عمليات الرحلات</h1>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">Global Fleet Management</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className={cn("rounded-xl h-12 px-6 gap-2 font-bold", isAdding && "bg-red-50 text-red-600 hover:bg-red-100 border-none")}
        >
          {isAdding ? <><X className="h-4 w-4" /> إلغاء</> : <><Plus className="h-4 w-4" /> رحلة جديدة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] bg-white/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <form onSubmit={handleAddTrip} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="text-[10px] font-black opacity-60 mr-1">نقطة الانطلاق</Label>
                  <Select onValueChange={setOriginId} value={originId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/5 font-bold"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-[10px] font-black opacity-60 mr-1">وجهة الوصول</Label>
                  <Select onValueChange={setDestinationId} value={destinationId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/5 font-bold"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="text-[10px] font-black opacity-60 mr-1">تاريخ السفر</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-14 rounded-2xl bg-white border-primary/5 justify-between px-4 font-bold">
                        {departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                        <CalendarIcon className="h-5 w-5 text-primary opacity-30" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-[2.5rem] border-none shadow-2xl">
                      <Calendar selected={departureDate} onSelect={setDepartureDate} locale={ar} disabled={(date) => date < startOfDay(new Date())} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-[10px] font-black opacity-60 mr-1">وقت التحرك</Label>
                  <Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="h-14 rounded-2xl bg-white border-primary/5 font-black text-right" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 text-right">
                  <Label className="text-[10px] font-black opacity-60 mr-1">الحافلة المخصصة</Label>
                  <Select onValueChange={setBusId} value={busId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white border-primary/5 font-bold"><SelectValue placeholder="اختر حافلة" /></SelectTrigger>
                    <SelectContent>
                      {buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate} ({b.model})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label className="text-[10px] font-black opacity-60 mr-1">سعر التذكرة</Label>
                  <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(e.target.value)} className="h-14 rounded-2xl bg-white border-primary/5 font-black text-right" />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.75rem] font-black text-lg bg-primary shadow-xl">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "نشر الرحلة الدولية"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isTripsLoading ? (
          <div className="flex justify-center p-20 opacity-20"><Loader2 className="animate-spin h-12 w-12" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-primary/5 rounded-[2rem] bg-white overflow-hidden">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/5 shadow-inner">
                  <Bus className="h-8 w-8 text-primary" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-lg">{trip.originName} ⬅ {trip.destinationName}</p>
                    <Badge variant="outline" className="text-[9px] font-mono h-5 px-1.5 border-primary/10 text-primary">#{trip.id}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-bold">
                    <span className="flex items-center gap-1.5"><CalendarIcon className="h-3 w-3" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {format(new Date(trip.departureTime), "p", { locale: ar })}</span>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none h-5">{trip.pricePerSeat} ر.س</Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTripForManifest(trip)}
                      className="rounded-xl h-12 gap-2 border-primary/10 hover:bg-primary/5 font-bold"
                    >
                      <Users className="h-4 w-4" /> كشف الركاب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
                    <div className="p-8 space-y-8 text-right">
                      <DialogHeader className="flex flex-row items-center justify-between border-b pb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                            <FileText className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <DialogTitle className="text-2xl font-black text-primary">بيان الركاب الرسمي</DialogTitle>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Passenger Flight Manifest - {trip.id}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="rounded-xl gap-2 font-bold" onClick={() => window.print()}>
                            <Printer className="h-4 w-4" /> طباعة الكشف
                          </Button>
                        </div>
                      </DialogHeader>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-1">
                          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">إجمالي الركاب</p>
                          <p className="text-2xl font-black text-primary">{passengersList.length}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">المقاعد المتبقية</p>
                          <p className="text-2xl font-black text-emerald-700">{trip.availableSeats}</p>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-1">
                          <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">المحصل المالي</p>
                          <p className="text-2xl font-black text-amber-700">{passengersList.length * trip.pricePerSeat} ر.س</p>
                        </div>
                      </div>

                      {isManifestLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-20">
                          <Loader2 className="h-12 w-12 animate-spin text-primary" />
                          <p className="text-xs font-bold uppercase tracking-widest">Syncing Passenger Data...</p>
                        </div>
                      ) : passengersList.length === 0 ? (
                        <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                          <p className="text-muted-foreground font-bold">لا توجد حجوزات مؤكدة لهذه الرحلة حتى الآن</p>
                        </div>
                      ) : (
                        <div className="rounded-[2rem] border border-primary/5 overflow-hidden shadow-sm">
                          <table className="w-full text-right text-sm">
                            <thead className="bg-primary/5 border-b font-black text-primary">
                              <tr>
                                <th className="px-6 py-4">مقعد</th>
                                <th className="px-6 py-4">اسم المسافر</th>
                                <th className="px-6 py-4">رقم الجواز</th>
                                <th className="px-6 py-4">رقم الهاتف</th>
                                <th className="px-6 py-4">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-primary/5">
                              {passengersList.map((passenger: any, idx: number) => (
                                <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                  <td className="px-6 py-4"><Badge className="bg-primary text-white font-mono">{passenger.seatNumber}</Badge></td>
                                  <td className="px-6 py-4 font-black">{passenger.fullName}</td>
                                  <td className="px-6 py-4 font-mono text-xs opacity-60">{passenger.passportNumber}</td>
                                  <td className="px-6 py-4 font-bold text-xs"><Smartphone className="h-3 w-3 inline ml-1 opacity-20" /> {passenger.phone}</td>
                                  <td className="px-6 py-4">
                                    <Badge className={cn(
                                      "text-[9px] font-black px-3 py-1 border-none",
                                      passenger.paymentStatus === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                      {passenger.paymentStatus === "Completed" ? "مدفوع" : "دفع عند السفر"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => { if(confirm("حذف الرحلة؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} 
                  className="text-red-500 rounded-full hover:bg-red-50 h-12 w-12"
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
