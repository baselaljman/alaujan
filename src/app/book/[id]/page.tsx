
"use client"

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, Package, Plus, Minus, Loader2, User, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";

interface PassengerDetail {
  seatNumber: number;
  fullName: string;
  passportNumber: string;
}

export default function BookTrip({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const firestore = useFirestore();

  // جلب بيانات الرحلة
  const tripRef = useMemoFirebase(() => doc(firestore, "busTrips", tripId), [firestore, tripId]);
  const { data: trip, isLoading: isTripLoading } = useDoc(tripRef);

  // جلب جميع الحجوزات لهذه الرحلة من المجموعة الرئيسية 'bookings'
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return query(collection(firestore, "bookings"), where("busTripId", "==", tripId));
  }, [firestore, tripId]);
  
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const occupiedSeats = useMemo(() => {
    if (!allBookings) return new Set<number>();
    const taken = new Set<number>();
    allBookings.forEach(booking => {
      booking.seatNumbers?.forEach((s: string) => taken.add(parseInt(s)));
    });
    return taken;
  }, [allBookings]);

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [extraBags, setExtraBags] = useState(0);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const TICKET_PRICE = trip?.pricePerSeat || 350;
  const BAG_PRICE = 100;

  const seats = useMemo(() => {
    const total = trip?.totalSeats || 40;
    return Array.from({ length: total }, (_, i) => ({
      id: i + 1,
      isAvailable: !occupiedSeats.has(i + 1),
    }));
  }, [trip, occupiedSeats]);

  const toggleSeat = (seatId: number) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= 5) return;
      setSelectedSeats([...selectedSeats, seatId].sort((a, b) => a - b));
    }
  };

  const handleNextStepSelection = () => {
    if (selectedSeats.length === 0) return;
    // تهيئة مصفوفة المسافرين بناءً على المقاعد المختارة
    const initialPassengers = selectedSeats.map(seatNum => ({
      seatNumber: seatNum,
      fullName: "",
      passportNumber: ""
    }));
    setPassengers(initialPassengers);
    setStep(2);
  };

  const updatePassenger = (index: number, field: keyof PassengerDetail, value: string) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);
  };

  const isPassengerInfoComplete = useMemo(() => {
    return passengers.every(p => p.fullName.trim() !== "" && p.passportNumber.trim() !== "");
  }, [passengers]);

  const handlePayment = () => {
    if (!isOtpVerified || !email || !isPassengerInfoComplete) return;
    const finalTotal = (selectedSeats.length * TICKET_PRICE) + (extraBags * BAG_PRICE);
    const queryParams = new URLSearchParams({ 
      tripId, 
      seats: selectedSeats.join(","), 
      total: finalTotal.toString(), 
      email,
      extraBags: extraBags.toString(),
      passengers: JSON.stringify(passengers)
    });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (isTripLoading || isBookingsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-6 pb-32">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? router.back() : setStep(step - 1)}><ArrowRight className="h-6 w-6" /></Button>
        <h1 className="text-xl font-bold">
          {step === 1 && "اختيار المقاعد"}
          {step === 2 && "بيانات المسافرين"}
          {step === 3 && "الإضافات والتواصل"}
        </h1>
      </header>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in">
          <Card className="max-w-[320px] mx-auto p-8 bg-muted/20 rounded-3xl border-primary/5">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  disabled={!seat.isAvailable}
                  onClick={() => toggleSeat(seat.id)}
                  className={cn(
                    "h-12 w-12 rounded-xl text-xs font-bold border-2 transition-all",
                    !seat.isAvailable ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed" :
                    selectedSeats.includes(seat.id) ? "bg-primary text-white border-primary shadow-lg scale-105" : "bg-white border-primary/10 hover:border-primary/30"
                  )}
                >{seat.id}</button>
              ))}
            </div>
          </Card>
          <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-white border border-primary/10" /> متاح</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-primary" /> محدد</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-muted" /> محجوز</div>
          </div>
          <Button onClick={handleNextStepSelection} disabled={selectedSeats.length === 0} className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl">
            تأكيد {selectedSeats.length} مقاعد والانتقال للبيانات
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-left">
          <p className="text-sm text-muted-foreground text-center">يرجى إدخال بيانات المسافرين كما تظهر في جواز السفر للرحلات الدولية</p>
          {passengers.map((p, idx) => (
            <Card key={idx} className="border-primary/10 shadow-md">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                    {p.seatNumber}
                  </div>
                  <span>بيانات المسافر (مقعد {p.seatNumber})</span>
                </div>
                <div className="space-y-2">
                  <Label>الاسم الكامل (كما في الجواز)</Label>
                  <Input 
                    placeholder="الاسم الثلاثي باللغة العربية" 
                    value={p.fullName} 
                    onChange={e => updatePassenger(idx, "fullName", e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>رقم جواز السفر</Label>
                  <Input 
                    placeholder="أرقام وحروف الجواز" 
                    value={p.passportNumber} 
                    onChange={e => updatePassenger(idx, "passportNumber", e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button 
            onClick={() => setStep(3)} 
            disabled={!isPassengerInfoComplete} 
            className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl"
          >
            تأكيد بيانات المسافرين
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-left">
          <Card className="p-6 space-y-6 border-primary/10">
            <div className="space-y-4">
              <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> الأمتعة الإضافية
              </h3>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="text-right">
                  <p className="font-bold text-sm">حقائب إضافية (100 ريال/حقيبة)</p>
                  <p className="text-[10px] text-muted-foreground">يسمح بحقيبة واحدة مجانية لكل راكب</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => setExtraBags(Math.max(0, extraBags - 1))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="font-black text-lg w-4 text-center">{extraBags}</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => setExtraBags(extraBags + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> بيانات التواصل
              </h3>
              <div className="space-y-2">
                <Label>البريد الإلكتروني (لتلقي التذاكر)</Label>
                <Input placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label>رقم الهاتف</Label>
                <Input placeholder="05XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-12" />
              </div>
              <Button onClick={() => setIsOtpVerified(true)} className="w-full rounded-xl h-12 gap-2" variant={isOtpVerified ? "secondary" : "outline"}>
                {isOtpVerified ? <><ShieldCheck className="h-4 w-4" /> تم التحقق بنجاح</> : "تحقق من رقم الهاتف عبر الرسالة"}
              </Button>
            </div>
          </Card>

          <div className="p-6 bg-white border rounded-2xl space-y-3 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">عدد المقاعد ({selectedSeats.length}):</span>
              <span className="font-bold">{selectedSeats.length * TICKET_PRICE} ريال</span>
            </div>
            {extraBags > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">حقائب إضافية ({extraBags}):</span>
                <span className="font-bold">{extraBags * BAG_PRICE} ريال</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black text-primary border-t pt-3 mt-2">
              <span>الإجمالي النهائي:</span>
              <span>{(selectedSeats.length * TICKET_PRICE) + (extraBags * BAG_PRICE)} ريال</span>
            </div>
          </div>

          <Button onClick={handlePayment} disabled={!isOtpVerified || !email} className="w-full h-16 text-xl font-bold rounded-2xl bg-primary shadow-xl">الانتقال للدفع وتأكيد الحجز</Button>
        </div>
      )}
    </div>
  );
}
