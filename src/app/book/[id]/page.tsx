
"use client"

import { useState, use, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Package, Plus, Minus, Info, CheckCircle2, Phone, Mail, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collectionGroup, query, where } from "firebase/firestore";

export default function BookTrip({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const firestore = useFirestore();

  // جلب بيانات الرحلة
  const tripRef = useMemoFirebase(() => doc(firestore, "busTrips", tripId), [firestore, tripId]);
  const { data: trip, isLoading: isTripLoading } = useDoc(tripRef);

  // جلب جميع الحجوزات لهذه الرحلة لتحديد المقاعد المحجوزة
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return query(collectionGroup(firestore, "bookings"), where("busTripId", "==", tripId));
  }, [firestore, tripId]);
  
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  // حساب المقاعد المحجوزة فعلياً
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
  const [extraBags, setExtraBags] = useState(0);
  
  // Contact info states
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const TICKET_PRICE = trip?.pricePerSeat || 350;
  const EXTRA_BAG_PRICE = 100;

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
      if (selectedSeats.length >= 5) {
        toast({
          title: "حد الحجز",
          description: "يمكنك اختيار 5 مقاعد كحد أقصى في الحجز الواحد.",
          variant: "destructive"
        });
        return;
      }
      setSelectedSeats([...selectedSeats, seatId].sort((a, b) => a - b));
    }
  };

  const handleNextStep = () => {
    if (step === 1 && selectedSeats.length === 0) {
      toast({
        title: "لم يتم اختيار مقاعد",
        description: "يرجى اختيار مقعد واحد على الأقل للمتابعة.",
        variant: "destructive"
      });
      return;
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const sendOtp = () => {
    if (!phone || phone.length < 8) {
      toast({ title: "خطأ", description: "يرجى إدخال رقم هاتف صحيح.", variant: "destructive" });
      return;
    }
    setIsOtpVerifying(true);
    setTimeout(() => {
      setIsOtpSent(true);
      setIsOtpVerifying(false);
      toast({ title: "تم إرسال الرمز", description: "تم إرسال رمز التحقق إلى هاتفك." });
    }, 1500);
  };

  const verifyOtp = () => {
    if (otp === "1234" || otp === "0000") {
      setIsOtpVerifying(true);
      setTimeout(() => {
        setIsOtpVerified(true);
        setIsOtpVerifying(false);
        toast({ title: "نجاح", description: "تم التحقق من رقم الهاتف بنجاح." });
      }, 1000);
    } else {
      toast({ title: "خطأ", description: "رمز التحقق غير صحيح. جرب 1234", variant: "destructive" });
    }
  };

  const totalTicketPrice = selectedSeats.length * TICKET_PRICE;
  const totalExtraBagsPrice = extraBags * EXTRA_BAG_PRICE;
  const finalTotal = totalTicketPrice + totalExtraBagsPrice + 10;

  const handlePayment = () => {
    if (!isOtpVerified) {
      toast({ title: "تنبيه", description: "يرجى التحقق من رقم الهاتف أولاً.", variant: "destructive" });
      return;
    }
    
    // تمرير البيانات لصفحة الدفع
    const queryParams = new URLSearchParams({
      tripId,
      seats: selectedSeats.join(","),
      total: finalTotal.toString(),
      bags: extraBags.toString(),
      phone,
      email
    });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (isTripLoading || isBookingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">جاري استدعاء بيانات الرحلة والمقاعد...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 md:pb-10">
      <header className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => step === 1 ? router.back() : handlePrevStep()} 
          className="rounded-full"
        >
          <ArrowRight className="h-6 w-6" />
        </Button>
        <div className="text-right">
          <h1 className="text-xl font-bold">
            {step === 1 && "اختيار المقاعد"}
            {step === 2 && "بيانات المسافرين"}
            {step === 3 && "إضافة الأمتعة"}
            {step === 4 && "معلومات الاتصال"}
          </h1>
          <p className="text-[10px] text-muted-foreground">{trip?.originName} إلى {trip?.destinationName}</p>
        </div>
      </header>

      {/* Step 1: Seat Selection */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span>مختار</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm bg-muted border" />
              <span>محجوز</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm border-primary/30 border" />
              <span>متاح</span>
            </div>
          </div>

          <Card className="max-w-[320px] mx-auto border-2 border-primary/5 bg-muted/20 shadow-inner overflow-hidden">
            <CardHeader className="py-4 text-center border-b bg-white flex flex-row items-center justify-between px-6">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                 <div className="h-5 w-5 rounded-full border-2 border-primary/40 border-t-primary animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">مقدمة الحافلة</p>
            </CardHeader>
            <CardContent className="pt-8 pb-10 px-4">
              <div className="grid grid-cols-5 gap-y-4 gap-x-2">
                {Array.from({ length: Math.ceil(seats.length / 4) }).map((_, rowIndex) => (
                  <div key={rowIndex} className="contents">
                    {rowIndex * 4 < seats.length && <SeatButton seat={seats[rowIndex * 4]} isSelected={selectedSeats.includes(seats[rowIndex * 4].id)} onClick={() => toggleSeat(seats[rowIndex * 4].id)} />}
                    {rowIndex * 4 + 1 < seats.length && <SeatButton seat={seats[rowIndex * 4 + 1]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 1].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 1].id)} />}
                    <div className="flex items-center justify-center text-[8px] text-primary/20 font-bold rotate-90 pointer-events-none">
                      الممر
                    </div>
                    {rowIndex * 4 + 2 < seats.length && <SeatButton seat={seats[rowIndex * 4 + 2]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 2].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 2].id)} />}
                    {rowIndex * 4 + 3 < seats.length && <SeatButton seat={seats[rowIndex * 4 + 3]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 3].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 3].id)} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-20 left-4 right-4 md:static">
            <Button onClick={handleNextStep} className="w-full h-16 text-lg font-bold shadow-2xl rounded-2xl bg-primary hover:bg-primary/95 transition-all">
              تأكيد {selectedSeats.length} مقاعد والمتابعة
            </Button>
          </div>
        </div>
      )}

      {/* Steps 2, 3, 4 simplified for brevity as they primarily manage UI state */}
      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <Card className="border-primary/10 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                  {selectedSeats.length}
                </div>
                المقاعد المختارة: {selectedSeats.join(", ")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {selectedSeats.map((seat) => (
                  <div key={seat} className="p-6 space-y-4 bg-white text-right">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <User className="h-4 w-4" />
                      <span>بيانات المسافر (مقعد {seat})</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">الاسم الثلاثي</Label>
                        <Input placeholder="أدخل الاسم الثلاثي كاملاً" className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">رقم الهوية</Label>
                        <Input placeholder="مثلاً: 123456789" className="h-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleNextStep} className="w-full h-16 text-xl font-bold shadow-xl rounded-2xl bg-primary hover:bg-primary/95 transition-all">
            متابعة لإضافة الأمتعة
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <Card className="border-primary/20 shadow-md bg-white text-right">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  سياسة الأمتعة
                </CardTitle>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50/50 border border-green-100 mb-6">
                <Info className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-green-800">يسمح لكل راكب بحقيبتين مجاناً</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">حقائب إضافية</h3>
                  <p className="text-xs font-bold text-accent mt-1">100 ريال لكل حقيبة إضافية</p>
                </div>
                <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border">
                  <Button variant="outline" size="icon" onClick={() => setExtraBags(Math.max(0, extraBags - 1))}><Minus className="h-4 w-4" /></Button>
                  <span className="text-xl font-black">{extraBags}</span>
                  <Button variant="outline" size="icon" onClick={() => setExtraBags(extraBags + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleNextStep} className="w-full h-16 text-xl font-black shadow-xl rounded-2xl bg-primary transition-all">
            متابعة لبيانات الاتصال
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <Card className="border-primary/10 shadow-lg text-right">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                معلومات الاتصال والتحقق
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف الجوال</Label>
                  <Input placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>
              {!isOtpVerified && (
                <div className="pt-4 space-y-4 border-t border-dashed">
                  {!isOtpSent ? (
                    <Button onClick={sendOtp} className="w-full h-12 rounded-xl" variant="outline" disabled={isOtpVerifying || !phone}>
                      {isOtpVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال رمز التحقق"}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <Input className="text-center text-2xl font-black h-14" placeholder="----" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} />
                      <Button onClick={verifyOtp} className="w-full h-12 bg-accent" disabled={isOtpVerifying || otp.length < 4}>تحقق من الرمز</Button>
                    </div>
                  )}
                </div>
              )}
              {isOtpVerified && <div className="p-4 bg-green-50 border border-green-200 text-center font-bold text-green-800 rounded-xl">تم التحقق بنجاح</div>}
            </CardContent>
          </Card>
          <Button onClick={handlePayment} disabled={!isOtpVerified || !email} className="w-full h-16 text-xl font-black rounded-2xl bg-primary">الانتقال للدفع وتلقي التذاكر</Button>
        </div>
      )}
    </div>
  );
}

function SeatButton({ seat, isSelected, onClick }: { seat: any, isSelected: boolean, onClick: () => void }) {
  return (
    <button
      disabled={!seat.isAvailable}
      onClick={onClick}
      className={cn(
        "h-12 w-12 rounded-xl text-xs font-bold transition-all flex items-center justify-center border-2 relative group",
        !seat.isAvailable 
          ? "bg-muted text-muted-foreground/40 border-muted-foreground/10 cursor-not-allowed" 
          : isSelected 
            ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] z-10 scale-105" 
            : "bg-white border-primary/10 hover:border-primary/40 text-primary/60"
      )}
    >
      {seat.id}
      {isSelected && (
        <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full border-2 border-white animate-in zoom-in" />
      )}
    </button>
  );
}
