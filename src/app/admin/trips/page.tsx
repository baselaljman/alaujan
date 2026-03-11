
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
  X,
  ArrowLeft
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

  // استعلام كشف الركاب الحديث - يستهدف المجموعة الرئيسية الموحدة لتجنب أخطاء التراخيص
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
        trackingNumber: booking.trackingNumber
      }))
    ).sort((a: any, b: any) => a.seatNumber - b.seatNumber);
  }, [bookings]);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ variant: "destructive", title: "بيانات ناقصة" });
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
    toast({ title: "تم الحفظ", description: `الرحلة ${nextId} أصبحت نشطة.` });
    setIsAdding(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 pb-32 text-right">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2rem] shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <Navigation className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary">غرفة عمليات الرحلات</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Global Fleet Management</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} className={cn("rounded-xl h-12", isAdding && "bg-red-50 text-red-600")}>
          {isAdding ? "إلغاء" : "رحلة جديدة"}
        </Button>
      </header>

      {isAdding && (
        <Card className="rounded-[2.5rem] shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleAddTrip} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>من</Label>
                  <Select onValueChange={setOriginId} value={originId}>
                    <SelectTrigger className="h-14 rounded-2xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>إلى</Label>
                  <Select onValueChange={setDestinationId} value={destinationId}>
                    <SelectTrigger className="h-14 rounded-2xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.75rem] font-black text-lg shadow-xl">
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
          <Card key={trip.id} className="rounded-[2rem] border-none shadow-sm ring-1 ring-primary/5">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/5 shadow-inner">
                  <Bus className="h-8 w-8 text-primary" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-lg">{trip.originName} ⬅ {trip.destinationName}</p>
                    <Badge variant="outline" className="text-[9px] border-primary/10 text-primary">#{trip.id}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-3">
                    <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {format(new Date(trip.departureTime), "PPP", { locale: ar })}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(new Date(trip.departureTime), "p", { locale: ar })}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setSelectedTripForManifest(trip)} className="rounded-xl h-12 gap-2 font-bold">
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
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Passenger Manifest - {trip.id}</p>
                          </div>
                        </div>
                        <Button variant="outline" className="rounded-xl gap-2 font-bold" onClick={() => window.print()}>
                          <Printer className="h-4 w-4" /> طباعة
                        </Button>
                      </DialogHeader>

                      {isManifestLoading ? (
                        <div className="flex justify-center p-20"><Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" /></div>
                      ) : passengersList.length === 0 ? (
                        <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                          <Users className="h-16 w-16 mx-auto mb-4 opacity-10" />
                          <p className="text-muted-foreground font-bold">لا توجد حجوزات مؤكدة لهذه الرحلة حالياً</p>
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
                              {passengersList.map((p: any, idx: number) => (
                                <tr key={idx} className="hover:bg-primary/5 transition-colors">
                                  <td className="px-6 py-4"><Badge className="bg-primary">{p.seatNumber}</Badge></td>
                                  <td className="px-6 py-4 font-black">{p.fullName}</td>
                                  <td className="px-6 py-4 font-mono text-xs opacity-60">{p.passportNumber}</td>
                                  <td className="px-6 py-4 font-bold text-xs"><Smartphone className="h-3 w-3 inline ml-1 opacity-20" /> {p.phone}</td>
                                  <td className="px-6 py-4">
                                    <Badge className={cn(
                                      "text-[9px] font-black border-none",
                                      p.paymentStatus === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    )}>
                                      {p.paymentStatus === "Completed" ? "مدفوع" : "دفع عند السفر"}
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

                <Button variant="ghost" size="icon" onClick={() => { if(confirm("حذف الرحلة؟")) deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id)) }} className="text-red-500 rounded-full hover:bg-red-50 h-12 w-12">
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
