
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Plus, Trash2, Calendar as CalendarIcon, Clock, DollarSign, Bus, Loader2, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function AdminTrips() {
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  
  // States for the new trip form
  const [busId, setBusId] = useState("");
  const [originId, setOriginId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [status, setStatus] = useState("Scheduled");
  const [pricePerSeat, setPricePerSeat] = useState(350);
  const [availableSeats, setAvailableSeats] = useState(40);
  
  const [departureDate, setDepartureDate] = useState<Date>();
  const [departureTime, setDepartureTime] = useState("08:00");
  
  const [arrivalDate, setArrivalDate] = useState<Date>();
  const [arrivalTime, setArrivalTime] = useState("20:00");

  // Fetch Locations for the selects
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations } = useCollection(locationsRef);

  // Fetch Trips
  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading } = useCollection(tripsRef);

  const handleAddTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busId || !departureDate || !arrivalDate || !originId || !destinationId) {
      toast({ 
        title: "بيانات ناقصة", 
        description: "يرجى اختيار المدن والتاريخ ورقم الحافلة",
        variant: "destructive"
      });
      return;
    }

    if (originId === destinationId) {
      toast({ 
        title: "خطأ في المسار", 
        description: "لا يمكن أن تكون مدينة الانطلاق هي نفسها مدينة الوصول",
        variant: "destructive"
      });
      return;
    }

    // Find location names for denormalization (easier to display later)
    const originName = locations?.find(l => l.id === originId)?.name || "";
    const destinationName = locations?.find(l => l.id === destinationId)?.name || "";

    // Construct ISO strings
    const depDateTime = new Date(departureDate);
    const [depH, depM] = departureTime.split(':');
    depDateTime.setHours(parseInt(depH), parseInt(depM));

    const arrDateTime = new Date(arrivalDate);
    const [arrH, arrM] = arrivalTime.split(':');
    arrDateTime.setHours(parseInt(arrH), parseInt(arrM));

    addDocumentNonBlocking(tripsRef, {
      busId,
      originId,
      originName,
      destinationId,
      destinationName,
      status,
      pricePerSeat: Number(pricePerSeat),
      availableSeats: Number(availableSeats),
      totalSeats: Number(availableSeats),
      departureTime: depDateTime.toISOString(),
      arrivalTime: arrDateTime.toISOString(),
      createdAt: new Date().toISOString()
    });

    toast({ title: "تمت الإضافة", description: "تمت إضافة الرحلة الجديدة بنجاح" });
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setBusId("");
    setOriginId("");
    setDestinationId("");
    setDepartureDate(undefined);
    setArrivalDate(undefined);
    setPricePerSeat(350);
    setAvailableSeats(40);
  };

  const handleDelete = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
      deleteDocumentNonBlocking(doc(firestore, "busTrips", id));
      toast({ title: "تم الحذف", description: "تم حذف الرحلة من النظام" });
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

      {isAdding && (
        <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-lg">تفاصيل الرحلة الجديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTrip} className="space-y-6 text-right">
              {/* Route Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من (مدينة الانطلاق)</Label>
                  <Select onValueChange={setOriginId} value={originId}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="اختر مدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name} - {loc.country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>إلى (الوجهة)</Label>
                  <Select onValueChange={setDestinationId} value={destinationId}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="اختر وجهة" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(loc => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name} - {loc.country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الحافلة</Label>
                  <Input 
                    placeholder="مثلاً: AWJ-700" 
                    value={busId}
                    onChange={e => setBusId(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحالة</Label>
                  <Select onValueChange={setStatus} defaultValue="Scheduled">
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scheduled">مجدولة</SelectItem>
                      <SelectItem value="Departed">انطلقت</SelectItem>
                      <SelectItem value="Delayed">متأخرة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Departure Date & Time */}
              <div className="space-y-3">
                <Label className="font-bold text-primary">موعد الانطلاق</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right h-12 rounded-xl border-primary/10",
                          !departureDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        {departureDate ? format(departureDate, "PPP", { locale: ar }) : "اختر تاريخ الانطلاق"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={departureDate}
                        onSelect={setDepartureDate}
                        locale={ar}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="time" 
                      value={departureTime}
                      onChange={e => setDepartureTime(e.target.value)}
                      className="pr-10 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Arrival Date & Time */}
              <div className="space-y-3">
                <Label className="font-bold text-primary">موعد الوصول المتوقع</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-right h-12 rounded-xl border-primary/10",
                          !arrivalDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        {arrivalDate ? format(arrivalDate, "PPP", { locale: ar }) : "اختر تاريخ الوصول"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={arrivalDate}
                        onSelect={setArrivalDate}
                        locale={ar}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="relative">
                    <Clock className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="time" 
                      value={arrivalTime}
                      onChange={e => setArrivalTime(e.target.value)}
                      className="pr-10 h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>سعر المقعد (بالريال)</Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      value={pricePerSeat}
                      onChange={e => setPricePerSeat(Number(e.target.value))}
                      className="pr-10 h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>عدد المقاعد الكلي</Label>
                  <Input 
                    type="number" 
                    value={availableSeats}
                    onChange={e => setAvailableSeats(Number(e.target.value))}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-14 text-lg font-bold rounded-2xl bg-primary shadow-xl">حفظ ونشر الرحلة</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : trips?.map(trip => (
          <Card key={trip.id} className="border-none shadow-sm ring-1 ring-border hover:ring-primary/20 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                  <Bus className="h-5 w-5 text-primary" />
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 font-bold text-sm text-primary mb-1">
                    <span>{trip.originName || "غير محدد"}</span>
                    <ArrowLeft className="h-3 w-3" />
                    <span>{trip.destinationName || "غير محدد"}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {new Date(trip.departureTime).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">حافلة: {trip.busId}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left">
                  <p className="font-bold text-sm text-primary">{trip.pricePerSeat} ريال</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{trip.status === "Scheduled" ? "مجدولة" : trip.status === "Departed" ? "في الطريق" : "متأخرة"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(trip.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {trips?.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            <Bus className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>لا توجد رحلات مسجلة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
