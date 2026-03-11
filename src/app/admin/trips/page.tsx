
"use client"

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where, collectionGroup } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Bus, 
  Loader2, 
  Users, 
  Clock, 
  ArrowLeft,
  Banknote,
  MapPin,
  X,
  FileText,
  Printer,
  ChevronLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const ADMIN_EMAILS = ["atlob.co@gmail.com", "alaujantravel@gmail.com"];

export default function AdminTrips() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  
  const [intermediateStops, setIntermediateStops] = useState<any[]>([]);

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const email = user.email.toLowerCase();
    return ADMIN_EMAILS.includes(email) || email.endsWith("@alawajan.com");
  }, [user]);

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  // استعلام كشف الركاب للرحلة المحددة - مشروط بكون المستخدم مديراً
  const manifestQuery = useMemoFirebase(() => {
    if (!firestore || !selectedTripId || !isAdmin) return null;
    return query(collectionGroup(firestore, "bookings"), where("busTripId", "==", selectedTripId));
  }, [firestore, selectedTripId, isAdmin]);
  
  const { data: manifest, isLoading: isManifestLoading } = useCollection(manifestQuery);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إكمال البيانات" });
      return;
    }

    const nextId = `aw${Math.floor(100 + Math.random() * 899)}`;
    const [dHours, dMinutes] = depTime.split(":").map(Number);
    const finalDepDate = setMinutes(setHours(departureDate, dHours), dMinutes);
    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";
    const selectedBus = buses?.find(b => b.id === busId);
    
    setDocumentNonBlocking(doc(firestore, "busTrips", nextId), {
      id: nextId,
      busId,
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "",
      originId,
      originName,
      destinationId,
      destinationName,
      intermediateStops,
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepDate.toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "تم الحفظ", description: "تمت إضافة الرحلة للجدول" });
    setIsAdding(false);
    setIntermediateStops([]);
  };

  return (
    <div className="space-y-6 pb-20 text-right">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary font-headline">الرحلات الدولية</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl h-12">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4 ml-2" /> إضافة رحلة</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="p-6 border-primary/20 shadow-lg animate-in slide-in-from-top-4">
          <form onSubmit={handleAddTrip} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>من مدينة</Label>
                <Select onValueChange={setOriginId}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>إلى مدينة</Label>
                <Select onValueChange={setDestinationId}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger><SelectContent>{locations?.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ الانطلاق</Label>
                <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full h-11 rounded-xl">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخ"}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent></Popover>
              </div>
              <div className="space-y-2">
                <Label>الحافلة</Label>
                <Select onValueChange={setBusId}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="اختر حافلة" /></SelectTrigger><SelectContent>{buses?.map(b => <SelectItem key={b.id} value={b.id}>{b.licensePlate}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl font-bold">حفظ الرحلة</Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isLoading ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div> : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-6 w-6 text-primary" /></div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{trip.originName} <ArrowLeft className="h-3 w-3 inline mx-1 opacity-30" /> {trip.destinationName}</p>
                    <Badge variant="outline" className="text-[10px] font-black">{trip.id}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(trip.departureTime), "PPP p", { locale: ar })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2" onClick={() => {
                  if (!isAdmin) {
                    toast({ variant: "destructive", title: "دخول محظور", description: "يجب تسجيل الدخول كمدير لعرض الكشف" });
                    return;
                  }
                  setSelectedTripId(trip.id);
                }}>
                  <Users className="h-4 w-4" /> كشف الركاب
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(firestore, "busTrips", trip.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedTripId} onOpenChange={() => setSelectedTripId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2rem] p-6">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <FileText className="h-6 w-6 text-primary" />
              كشف الركاب - الرحلة {selectedTripId}
            </DialogTitle>
          </DialogHeader>

          {isManifestLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
          ) : manifest?.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">لا يوجد حجوزات مؤكدة لهذه الرحلة بعد</div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-bold">إجمالي الركاب</p>
                  <p className="text-2xl font-black text-primary">{manifest?.reduce((acc, b) => acc + (b.numberOfSeats || 0), 0)}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" /> طباعة الكشف
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 font-bold">المقعد</th>
                      <th className="p-3 font-bold">اسم المسافر</th>
                      <th className="p-3 font-bold">رقم الجواز</th>
                      <th className="p-3 font-bold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {manifest?.flatMap(booking => 
                      (booking.passengers || []).map((p: any, idx: number) => (
                        <tr key={`${booking.id}-${idx}`} className="hover:bg-muted/30">
                          <td className="p-3 font-mono font-bold text-primary">{p.seatNumber}</td>
                          <td className="p-3 font-bold">{p.fullName}</td>
                          <td className="p-3 font-mono text-xs">{p.passportNumber}</td>
                          <td className="p-3">
                            <Badge className={booking.paymentStatus === "Completed" ? "bg-emerald-600" : "bg-amber-500"}>
                              {booking.paymentStatus === "Completed" ? "مدفوع" : "عند السفر"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
