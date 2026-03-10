
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
  Clock, 
  Printer, 
  Ticket, 
  Search,
  XCircle,
  RotateCcw,
  Copy,
  FileText,
  ArrowLeft,
  Banknote,
  MapPin,
  X
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
  const [mainSearchQuery, setMainSearchQuery] = useState("");
  
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState<string>("350");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  const [intermediateStopIds, setIntermediateStopIds] = useState<string[]>([]);

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

  const viewingTrip = useMemo(() => {
    return trips?.find(t => t.id === viewingManifestId);
  }, [trips, viewingManifestId]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !viewingManifestId) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", viewingManifestId));
  }, [firestore, viewingManifestId]);

  const { data: manifestBookings, isLoading: isManifestLoading } = useCollection(bookingsQuery);

  const handleAddStop = (stopId: string) => {
    if (stopId && !intermediateStopIds.includes(stopId)) {
      setIntermediateStopIds([...intermediateStopIds, stopId]);
    }
  };

  const removeStop = (stopId: string) => {
    setIntermediateStopIds(intermediateStopIds.filter(id => id !== stopId));
  };

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !originId || !destinationId || !pricePerSeat) {
      toast({ variant: "destructive", title: "بيانات ناقصة", description: "يرجى إكمال جميع الحقول المطلوبة" });
      return;
    }

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
    const finalArrDate = new Date(finalDepDate.getTime() + (12 * 60 * 60 * 1000));

    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";
    const selectedBus = buses?.find(b => b.id === busId);
    
    // تحويل معرفات المدن إلى أسماء لسهولة العرض والبحث
    const intermediateStops = intermediateStopIds.map(id => {
      const loc = locations?.find(l => l.id === id);
      return { id: loc?.id, name: loc?.name };
    });

    const tripDocRef = doc(firestore, "busTrips", nextId);

    setDocumentNonBlocking(tripDocRef, {
      id: nextId,
      busId,
      busLabel: selectedBus ? `${selectedBus.licensePlate} (${selectedBus.model})` : "",
      originId,
      originName,
      destinationId,
      destinationName,
      intermediateStops, // تخزين مصفوفة المحطات
      status: "Scheduled",
      pricePerSeat: Number(pricePerSeat),
      availableSeats: selectedBus?.capacity || 40,
      totalSeats: selectedBus?.capacity || 40,
      departureTime: finalDepDate.toISOString(),
      arrivalTime: finalArrDate.toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "تمت إضافة الرحلة", description: `كود الرحلة: ${nextId}` });
    setIsAdding(false);
    setIntermediateStopIds([]);
  };

  const handlePrintManifest = () => {
    if (!viewingTrip || !manifestBookings || manifestBookings.length === 0) {
      toast({ variant: "destructive", title: "لا توجد بيانات", description: "لا يوجد ركاب لطباعة بيانهم." });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى السماح بفتح النوافذ المنبثقة." });
      return;
    }

    const passengers = manifestBookings.flatMap(b => b.passengers || []);

    const content = `
      <html dir="rtl">
        <head>
          <title>بيان ركاب رحلة ${viewingTrip.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            body { font-family: 'Noto Sans Arabic', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 3px solid #003d2d; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #003d2d; margin: 0; font-size: 28px; }
            .trip-info { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .trip-info div { background: #f8f9fa; padding: 15px; border-radius: 12px; border-right: 5px solid #b08d40; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #dee2e6; padding: 12px; text-align: right; }
            th { background-color: #003d2d; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>العوجان للسياحة والسفر</h1>
            <p>كشف ركاب رسمي - رحلة دولية</p>
          </div>
          <div class="trip-info">
            <div>
              <strong>رقم الرحلة:</strong> ${viewingTrip.id}<br>
              <strong>الحافلة:</strong> ${viewingTrip.busLabel}
            </div>
            <div>
              <strong>المسار:</strong> ${viewingTrip.originName} ⬅ ${viewingTrip.destinationName}<br>
              <strong>التاريخ:</strong> ${new Date(viewingTrip.departureTime).toLocaleDateString('ar-EG')}
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم المسافر الكامل</th>
                <th>رقم الجواز / الهوية</th>
                <th>رقم المقعد</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${passengers.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.fullName}</td>
                  <td>${p.passportNumber}</td>
                  <td>${p.seatNumber}</td>
                  <td>${p.status === 'Cancelled' ? 'ملغي' : 'مؤكد'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handlePrintTicket = (passenger: any, trip: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html dir="rtl">
        <head>
          <title>تذكرة سفر - ${passenger.fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            body { font-family: 'Noto Sans Arabic', sans-serif; display: flex; justify-content: center; padding: 40px; }
            .ticket { width: 500px; border: 3px solid #003d2d; border-radius: 25px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
            .ticket-header { background: #003d2d; color: white; padding: 25px; text-align: center; }
            .ticket-body { padding: 30px; position: relative; background: #fff; }
            .row { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .label { color: #888; font-size: 11px; margin-bottom: 5px; font-weight: bold; }
            .value { font-weight: bold; font-size: 17px; color: #003d2d; }
            .seat-badge { background: #b08d40; color: white; padding: 12px 25px; border-radius: 12px; font-size: 26px; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="ticket-header">
              <h2 style="margin:0">العوجان للسياحة والسفر</h2>
            </div>
            <div class="ticket-body">
              <div class="row">
                <div>
                  <div class="label">اسم المسافر</div>
                  <div class="value">${passenger.fullName}</div>
                </div>
                <div class="seat-badge">${passenger.seatNumber}</div>
              </div>
              <div class="row">
                <div>
                  <div class="label">من</div>
                  <div class="value">${trip.originName}</div>
                </div>
                <div>
                  <div class="label">إلى</div>
                  <div class="value">${trip.destinationName}</div>
                </div>
              </div>
              <div class="row">
                <div>
                  <div class="label">رقم الجواز</div>
                  <div class="value">${passenger.passportNumber}</div>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  const copyTripId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "تم نسخ الكود", description: id });
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
          <form onSubmit={handleAddTrip} className="space-y-6">
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

            <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-dashed">
              <Label className="font-bold flex items-center gap-2 justify-end">
                <span>نقاط التوقف (المدن التي يمر بها الباص)</span>
                <MapPin className="h-4 w-4 text-primary" />
              </Label>
              <div className="flex gap-2">
                <Select onValueChange={handleAddStop}>
                  <SelectTrigger className="rounded-xl h-10 bg-white"><SelectValue placeholder="اختر مدينة توقف" /></SelectTrigger>
                  <SelectContent>
                    {locations?.filter(l => l.id !== originId && l.id !== destinationId).map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {intermediateStopIds.map(id => {
                  const name = locations?.find(l => l.id === id)?.name;
                  return (
                    <Badge key={id} className="bg-primary/10 text-primary border-none py-1.5 px-3 rounded-full flex items-center gap-2">
                      {name}
                      <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeStop(id)} />
                    </Badge>
                  );
                })}
                {intermediateStopIds.length === 0 && <p className="text-[10px] text-muted-foreground w-full">لا توجد محطات توقف مضافة</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>الحافلة المخصصة</Label>
                <Select onValueChange={setBusId}>
                  <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر حافلة" /></SelectTrigger>
                  <SelectContent>
                    {buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 text-right">
                <Label className="flex items-center gap-1 justify-end">
                  سعر التذكرة (ريال) <Banknote className="h-3 w-3 text-primary" />
                </Label>
                <Input 
                  type="number" 
                  value={pricePerSeat} 
                  onChange={e => setPricePerSeat(e.target.value)} 
                  className="h-11 rounded-xl"
                  placeholder="350"
                />
              </div>
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

            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold mt-4 shadow-xl">تأكيد وحفظ الرحلة</Button>
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
                      <p className="font-bold text-base">{trip.originName} <ArrowLeft className="inline h-3 w-3 mx-1 opacity-50" /> {trip.destinationName}</p>
                      <Badge variant="outline" className="text-[10px] font-black border-primary/20 text-primary">{trip.id}</Badge>
                    </div>
                    {trip.intermediateStops && trip.intermediateStops.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">يمر بـ: {trip.intermediateStops.map((s: any) => s.name).join('، ')}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">{trip.busLabel} | متاح: {trip.availableSeats} | السعر: {trip.pricePerSeat} ريال</p>
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
                         <div className="bg-primary p-6 text-white text-right flex justify-between items-center">
                            <div>
                               <DialogTitle className="text-xl font-bold">بيان الركاب (المانيفست) - {trip.id}</DialogTitle>
                               <p className="text-xs opacity-70 mt-1">{trip.originName} ⬅ {trip.destinationName}</p>
                            </div>
                            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary gap-2" onClick={handlePrintManifest}>
                               <Printer className="h-4 w-4" /> طباعة البيان
                            </Button>
                         </div>
                         <div className="p-6">
                           {isManifestLoading ? (
                             <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                           ) : manifestBookings?.length === 0 ? (
                             <div className="text-center py-12 text-muted-foreground">لا يوجد ركاب مسجلون بعد</div>
                           ) : (
                             <div className="overflow-x-auto">
                               <Table dir="rtl">
                                 <TableHeader>
                                   <TableRow className="bg-muted/50">
                                     <TableHead className="text-right font-bold">المسافر</TableHead>
                                     <TableHead className="text-right font-bold">الجواز</TableHead>
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handlePrintTicket(p, trip)}>
                                              <Ticket className="h-4 w-4" />
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

