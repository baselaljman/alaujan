"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { Plus, Trash2, Bus, Loader2, Users, FileText, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [viewingManifestId, setViewingManifestId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  
  // States for new trip
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState(350);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [arrivalDate, setArrivalDate] = useState<Date>();

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  // استعلام لجلب الحجوزات المرتبطة برحلة محددة
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !viewingManifestId) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", viewingManifestId));
  }, [firestore, viewingManifestId]);

  const { data: manifestBookings, isLoading: isManifestLoading } = useCollection(bookingsQuery);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !arrivalDate || !originId || !destinationId) {
      toast({ title: "بيانات ناقصة", description: "يرجى تعبئة جميع الحقول", variant: "destructive" });
      return;
    }

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
      departureTime: departureDate.toISOString(),
      arrivalTime: arrivalDate.toISOString(),
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة", description: "تمت إضافة الرحلة للجدول" });
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", tripToDelete));
      toast({ title: "تم الحذف", description: "تمت إزالة الرحلة من النظام بنجاح" });
      setTripToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة</>}
        </Button>
      </header>

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
        <AlertDialogContent className="text-right">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 justify-end">
              <span>تأكيد حذف الرحلة</span>
              <AlertCircle className="h-5 w-5 text-red-500" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذه الرحلة؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة بها من النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 rounded-xl">تأكيد الحذف</AlertDialogAction>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isAdding && (
        <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top duration-300">
          <CardContent className="pt-6">
            <form onSubmit={handleAddTrip} className="space-y-6 text-right">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label>مدينة الانطلاق</Label>
                  <Select onValueChange={setOriginId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-right">
                  <Label>الوجهة</Label>
                  <Select onValueChange={setDestinationId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر مدينة" /></SelectTrigger>
                    <SelectContent>{locations?.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label>الحافلة المخصصة</Label>
                <Select onValueChange={setBusId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر حافلة من الأسطول" /></SelectTrigger>
                  <SelectContent>{buses?.map(bus => <SelectItem key={bus.id} value={bus.id}>{bus.licensePlate} - {bus.model}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>موعد الانطلاق</Label>
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className="w-full text-right">{departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخاً"}</Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>سعر التذكرة (ريال)</Label>
                  <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(Number(e.target.value))} className="rounded-xl" />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl">حفظ ونشر الرحلة</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-5 w-5 text-primary" /></div>
                <div className="text-right">
                  <p className="font-bold text-sm">{trip.originName} ⮕ {trip.destinationName}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(trip.departureTime).toLocaleString('ar-EG')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog onOpenChange={(open) => { if (open) setViewingManifestId(trip.id); else setViewingManifestId(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs">
                      <Users className="h-4 w-4" /> بيان الركاب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        بيان الركاب المسجلين (المانيفست الدولي)
                      </DialogTitle>
                    </DialogHeader>
                    {isManifestLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto my-8" /> : (
                      <div className="rounded-xl border overflow-hidden mt-4">
                        <Table dir="rtl">
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="text-right font-bold">الاسم الكامل</TableHead>
                              <TableHead className="text-right font-bold">رقم الجواز</TableHead>
                              <TableHead className="text-right font-bold">المقعد</TableHead>
                              <TableHead className="text-right font-bold">الحقائب</TableHead>
                              <TableHead className="text-right font-bold">حالة الدفع</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {manifestBookings?.length === 0 ? (
                              <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">لا توجد حجوزات مسجلة لهذه الرحلة</TableCell></TableRow>
                            ) : manifestBookings?.map(booking => (
                              booking.passengers?.map((p: any, idx: number) => (
                                <TableRow key={`${booking.id}-${idx}`}>
                                  <TableCell className="font-bold">{p.fullName}</TableCell>
                                  <TableCell className="font-mono text-xs">{p.passportNumber}</TableCell>
                                  <TableCell><Badge variant="outline" className="bg-primary/5">{p.seatNumber}</Badge></TableCell>
                                  <TableCell className="text-xs">{idx === 0 ? (booking.extraBags > 0 ? `${booking.extraBags} إضافية` : "عادية") : "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant={booking.paymentStatus === 'Completed' ? 'default' : 'outline'}>
                                      {booking.paymentStatus === 'Completed' ? 'تم الدفع' : 'معلق'}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setTripToDelete(trip.id)} 
                  className="text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}