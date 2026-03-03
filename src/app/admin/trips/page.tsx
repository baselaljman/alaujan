
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { Plus, Trash2, Bus, Loader2, Users, FileText, AlertCircle, Clock, Phone, Mail, CreditCard, Package, Edit, Save, Printer } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format, setHours, setMinutes } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [viewingManifestId, setViewingManifestId] = useState<string | null>(null);
  const [tripToDelete, setTripToDelete] = useState<string | null>(null);
  const [printDate, setPrintDate] = useState<string>("");
  
  // State for editing a passenger
  const [editingPassenger, setEditingPassenger] = useState<{
    bookingId: string;
    passengerIndex: number;
    fullName: string;
    passportNumber: string;
  } | null>(null);

  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [pricePerSeat, setPricePerSeat] = useState(350);
  const [departureDate, setDepartureDate] = useState<Date>();
  const [arrivalDate, setArrivalDate] = useState<Date>();
  const [depTime, setDepTime] = useState("08:00");
  const [arrTime, setArrTime] = useState("20:00");

  useEffect(() => {
    // تحديد تاريخ الطباعة فقط عند التحميل في المتصفح لتجنب تعارض الـ Hydration
    setPrintDate(format(new Date(), "PPPP p", { locale: ar }));
  }, []);

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  const busesRef = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses } = useCollection(busesRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  const currentTrip = trips?.find(t => t.id === viewingManifestId);

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

    const [dHours, dMinutes] = depTime.split(":").map(Number);
    const finalDepDate = setMinutes(setHours(departureDate, dHours), dMinutes);

    const [aHours, aMinutes] = arrTime.split(":").map(Number);
    const finalArrDate = setMinutes(setHours(arrivalDate, aHours), aMinutes);

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
      departureTime: finalDepDate.toISOString(),
      arrivalTime: finalArrDate.toISOString(),
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة", description: "تمت إضافة الرحلة للجدول بنجاح" });
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (tripToDelete) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", tripToDelete));
      toast({ title: "تم الحذف", description: "تمت إزالة الرحلة من النظام بنجاح" });
      setTripToDelete(null);
    }
  };

  const handleUpdatePassenger = () => {
    if (!editingPassenger || !manifestBookings) return;

    const booking = manifestBookings.find(b => b.id === editingPassenger.bookingId);
    if (!booking) return;

    const updatedPassengers = [...booking.passengers];
    updatedPassengers[editingPassenger.passengerIndex] = {
      ...updatedPassengers[editingPassenger.passengerIndex],
      fullName: editingPassenger.fullName,
      passportNumber: editingPassenger.passportNumber
    };

    updateDocumentNonBlocking(doc(firestore, "bookings", editingPassenger.bookingId), {
      passengers: updatedPassengers
    });

    toast({ title: "تم التحديث", description: "تم تعديل بيانات المسافر بنجاح" });
    setEditingPassenger(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 print:bg-white print:p-0">
      {/* Print Header - Only visible during print */}
      <div className="hidden print:block text-right space-y-4 mb-8">
        <div className="flex justify-between items-center border-b-2 border-primary pb-4">
          <div className="text-left">
            <h1 className="text-2xl font-bold text-primary">العوجان للسياحة والسفر</h1>
            <p className="text-sm">بيان الركاب الرسمي (Official Manifest)</p>
          </div>
          <Bus className="h-12 w-12 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
          <div><span className="font-bold">المسار:</span> {currentTrip?.originName} ⮕ {currentTrip?.destinationName}</div>
          <div><span className="font-bold">الحافلة:</span> {currentTrip?.busLabel}</div>
          <div><span className="font-bold">تاريخ الانطلاق:</span> {currentTrip && format(new Date(currentTrip.departureTime), "PPPP p", { locale: ar })}</div>
          <div><span className="font-bold">تاريخ الطباعة:</span> {printDate}</div>
        </div>
      </div>

      <header className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold font-headline text-primary">إدارة الرحلات</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="rounded-xl gap-2">
          {isAdding ? "إلغاء" : <><Plus className="h-4 w-4" /> إضافة رحلة</>}
        </Button>
      </header>

      {/* Edit Passenger Dialog */}
      <Dialog open={!!editingPassenger} onOpenChange={(open) => !open && setEditingPassenger(null)}>
        <DialogContent className="text-right print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 justify-end">
              <span>تعديل بيانات المسافر</span>
              <Edit className="h-5 w-5 text-primary" />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input 
                value={editingPassenger?.fullName || ""} 
                onChange={(e) => setEditingPassenger(prev => prev ? {...prev, fullName: e.target.value} : null)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>رقم جواز السفر</Label>
              <Input 
                value={editingPassenger?.passportNumber || ""} 
                onChange={(e) => setEditingPassenger(prev => prev ? {...prev, passportNumber: e.target.value} : null)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex-row-reverse gap-2">
            <Button onClick={handleUpdatePassenger} className="rounded-xl gap-2">
              <Save className="h-4 w-4" /> حفظ التعديلات
            </Button>
            <Button variant="outline" onClick={() => setEditingPassenger(null)} className="rounded-xl">إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
        <AlertDialogContent className="text-right print:hidden">
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
        <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top duration-300 print:hidden">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 border p-4 rounded-xl bg-muted/5">
                  <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> تفاصيل الانطلاق
                  </h3>
                  <div className="space-y-2">
                    <Label>تاريخ الانطلاق</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full text-right justify-start font-normal">
                          {departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخاً"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} locale={ar} /></PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الانطلاق</Label>
                    <Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-4 border p-4 rounded-xl bg-muted/5">
                  <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> تفاصيل الوصول
                  </h3>
                  <div className="space-y-2">
                    <Label>تاريخ الوصول المتوقع</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full text-right justify-start font-normal">
                          {arrivalDate ? format(arrivalDate, "PPP", { locale: ar }) : "اختر تاريخاً"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={arrivalDate} onSelect={setArrivalDate} locale={ar} /></PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>وقت الوصول المتوقع</Label>
                    <Input type="time" value={arrTime} onChange={e => setArrTime(e.target.value)} className="rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>سعر التذكرة (ريال)</Label>
                <Input type="number" value={pricePerSeat} onChange={e => setPricePerSeat(Number(e.target.value))} className="rounded-xl" />
              </div>

              <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg">حفظ ونشر الرحلة الدولية</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3 print:hidden">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center"><Bus className="h-5 w-5 text-primary" /></div>
                <div className="text-right">
                  <p className="font-bold text-sm">{trip.originName} ⮕ {trip.destinationName}</p>
                  <p className="text-[10px] text-muted-foreground">الانطلاق: {new Date(trip.departureTime).toLocaleString('ar-EG')}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog onOpenChange={(open) => { if (open) setViewingManifestId(trip.id); else setViewingManifestId(null); }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs">
                      <Users className="h-4 w-4" /> بيان الركاب
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:border-none">
                    <DialogHeader className="print:hidden">
                      <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          بيان الركاب المسجلين وتفاصيل التواصل والدفع
                        </DialogTitle>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl gap-2">
                          <Printer className="h-4 w-4" /> طباعة البيان (A4)
                        </Button>
                      </div>
                    </DialogHeader>
                    {isManifestLoading ? <Loader2 className="animate-spin h-6 w-6 mx-auto my-8 print:hidden" /> : (
                      <div className="rounded-xl border overflow-x-auto mt-4 print:border-black print:rounded-none">
                        <Table dir="rtl" className="min-w-[1000px] print:min-w-full">
                          <TableHeader>
                            <TableRow className="bg-muted/50 print:bg-gray-100">
                              <TableHead className="text-right font-bold print:text-black print:border-b">اسم المسافر</TableHead>
                              <TableHead className="text-right font-bold print:text-black print:border-b">الجواز</TableHead>
                              <TableHead className="text-right font-bold print:text-black print:border-b">المقعد</TableHead>
                              <TableHead className="text-right font-bold print:text-black print:border-b">بيانات التواصل</TableHead>
                              <TableHead className="text-right font-bold print:text-black print:border-b">الأمتعة</TableHead>
                              <TableHead className="text-right font-bold print:text-black print:border-b">الدفع</TableHead>
                              <TableHead className="text-center font-bold print:hidden">إجراءات</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {manifestBookings?.length === 0 ? (
                              <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">لا توجد حجوزات مسجلة لهذه الرحلة</TableCell></TableRow>
                            ) : manifestBookings?.map(booking => (
                              booking.passengers?.map((p: any, idx: number) => (
                                <TableRow key={`${booking.id}-${idx}`} className={idx === 0 ? "border-t-2 print:border-t" : ""}>
                                  <TableCell className="font-bold print:text-sm">{p.fullName}</TableCell>
                                  <TableCell className="font-mono text-xs print:text-xs">{p.passportNumber}</TableCell>
                                  <TableCell><Badge variant="outline" className="bg-primary/5 print:text-black print:bg-white">{p.seatNumber}</Badge></TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1 text-[10px] print:text-[8px]">
                                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {booking.userEmail}</span>
                                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {booking.userPhone}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {idx === 0 ? (
                                      <div className="flex items-center gap-1 text-xs print:text-[8px]">
                                        <Package className="h-3 w-3" />
                                        {booking.extraBags > 0 ? <Badge variant="destructive" className="h-5 text-[10px] print:text-[8px]">{booking.extraBags} إضافية</Badge> : "عادية"}
                                      </div>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1 print:text-[8px]">
                                      <div className="flex items-center gap-1 text-[10px] print:text-[8px]">
                                        <CreditCard className="h-3 w-3" />
                                        {booking.paymentMethodLabel || booking.paymentMethod}
                                      </div>
                                      <Badge variant={booking.paymentStatus === 'Completed' ? 'default' : 'outline'} className="w-fit text-[10px] h-5 print:text-[8px] print:bg-white print:text-black">
                                        {booking.paymentStatus === 'Completed' ? 'تم الدفع' : 'معلق'}
                                      </Badge>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center print:hidden">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-primary hover:bg-primary/10"
                                      onClick={() => setEditingPassenger({
                                        bookingId: booking.id,
                                        passengerIndex: idx,
                                        fullName: p.fullName,
                                        passportNumber: p.passportNumber
                                      })}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
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

      {/* Print Footer - Only visible during print */}
      <div className="hidden print:flex justify-between items-center mt-12 border-t-2 pt-4">
        <div className="text-sm font-bold">توقيع المسؤول: .............................</div>
        <div className="text-xs text-muted-foreground">صادر عن نظام العوجان الرقمي</div>
      </div>
    </div>
  );
}
