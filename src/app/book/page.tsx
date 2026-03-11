
"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Package, Plus, Minus, Loader2, CreditCard, ShieldCheck, Send, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useCollection, useMemoFirebase, useAuth, setupRecaptcha, sendOtpToPhone } from "@/firebase";
import { doc, collection, query, where, limit } from "firebase/firestore";
import { ConfirmationResult } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

interface PassengerDetail {
  seatNumber: number;
  fullName: string;
  passportNumber: string;
}

function BookTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tripId = searchParams.get("id") || "";
  const customPrice = searchParams.get("price");
  const boardingPoint = searchParams.get("boarding") || searchParams.get("from") || "";
  const droppingPoint = searchParams.get("dropping") || searchParams.get("to") || "";
  
  const firestore = useFirestore();
  const auth = useAuth();
  
  const tripRef = useMemoFirebase(() => (tripId ? doc(firestore, "busTrips", tripId) : null), [firestore, tripId]);
  const { data: trip, isLoading: isTripLoading } = useDoc(tripRef);

  // استعلام المقاعد المحجوزة - أضفنا حداً أقصى للتوافق مع قواعد الحماية وضمان الأداء
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !tripId) return null;
    return query(
      collection(firestore, "bookings"), 
      where("busTripId", "==", tripId),
      limit(100)
    );
  }, [firestore, tripId]);
  
  const { data: allBookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const occupiedSeats = useMemo(() => {
    if (!allBookings) return new Set<number>();
    const taken = new Set<number>();
    allBookings.forEach(booking => {
      // نتحقق فقط من الحجوزات غير الملغاة
      if (booking.status !== 'Cancelled') {
        booking.seatNumbers?.forEach((s: string) => taken.add(parseInt(s)));
      }
    });
    return taken;
  }, [allBookings]);

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [step, setStep] = useState(1);
  const [passengers, setPassengers] = useState<PassengerDetail[]>([]);
  const [extraBags, setExtraBags] = useState(0);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+966");
  const [email, setEmail] = useState("");
  
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const TICKET_PRICE = customPrice ? Number(customPrice) : (trip?.pricePerSeat || 350);
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
      if (selectedSeats.length >= 5) {
        toast({ variant: "destructive", title: "تنبيه", description: "الحد الأقصى هو 5 مقاعد للحجز الواحد" });
        return;
      }
      setSelectedSeats([...selectedSeats, seatId].sort((a, b) => a - b));
    }
  };

  const handleNextStepSelection = () => {
    if (selectedSeats.length === 0) return;
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

  const handleSendOtp = async () => {
    if (!phone || isSendingCode) return;
    setIsSendingCode(true);
    try {
      const verifier = setupRecaptcha(auth, 'recaptcha-container');
      const result = await sendOtpToPhone(auth, `${countryCode}${phone}`, verifier);
      setConfirmationResult(result);
    } catch (error) {
      // toast in helper
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !confirmationResult || isVerifyingCode) return;
    setIsVerifyingCode(true);
    try {
      await confirmationResult.confirm(otpCode);
      setIsOtpVerified(true);
      toast({ title: "تم التحقق", description: "يمكنك المتابعة" });
    } catch (error) {
      toast({ variant: "destructive", title: "خطأ", description: "الرمز غير صحيح" });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handlePayment = () => {
    if (!isOtpVerified || !email || !isPassengerInfoComplete) return;
    const finalTotal = (selectedSeats.length * TICKET_PRICE) + (extraBags * BAG_PRICE);
    const queryParams = new URLSearchParams({ 
      tripId, 
      seats: selectedSeats.join(","), 
      total: finalTotal.toString(), 
      email,
      phone: `${countryCode}${phone}`,
      extraBags: extraBags.toString(),
      boardingPoint,
      droppingPoint,
      passengers: JSON.stringify(passengers)
    });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (isTripLoading || isBookingsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-6 pb-32">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? router.back() : setStep(step - 1)}><ArrowRight className="h-6 w-6" /></Button>
        <div className="text-right flex-1">
          <h1 className="text-xl font-bold">
            {step === 1 && "اختيار المقاعد"}
            {step === 2 && "بيانات المسافرين"}
            {step === 3 && "الإضافات والتواصل"}
          </h1>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
            <MapPin className="h-2 w-2" /> {boardingPoint} ⬅ {droppingPoint}
          </p>
        </div>
      </header>

      <div id="recaptcha-container"></div>

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
            تأكيد {selectedSeats.length} مقاعد (بـ {TICKET_PRICE} ر.س للمقعد)
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-left">
          {passengers.map((p, idx) => (
            <Card key={idx} className="border-primary/10 shadow-md">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">{p.seatNumber}</div>
                  <span>بيانات المسافر (مقعد {p.seatNumber})</span>
                </div>
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input placeholder="الاسم كما في الجواز" value={p.fullName} onChange={e => updatePassenger(idx, "fullName", e.target.value)} className="rounded-xl h-12" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الجواز</Label>
                  <Input placeholder="رقم جواز السفر" value={p.passportNumber} onChange={e => updatePassenger(idx, "passportNumber", e.target.value)} className="rounded-xl h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button onClick={() => setStep(3)} disabled={!isPassengerInfoComplete} className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl">تأكيد البيانات</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-left">
          <Card className="p-6 space-y-6 border-primary/10">
            <div className="space-y-4">
              <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> الأمتعة الإضافية</h3>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="text-right">
                  <p className="font-bold text-sm">حقائب إضافية (100 ريال)</p>
                  <p className="text-[10px] text-muted-foreground">يسمح بحقيبتين مجاناً</p>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setExtraBags(Math.max(0, extraBags - 1))}><Minus className="h-3 w-3" /></Button>
                  <span className="font-black text-lg w-4 text-center">{extraBags}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => setExtraBags(extraBags + 1)}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm border-b pb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> التحقق والتواصل</h3>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-12" />
              </div>
              
              <div className="space-y-3">
                <Label>رقم الهاتف</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode} disabled={isOtpVerified}>
                    <SelectTrigger className="w-[110px] h-12 rounded-xl"><SelectValue placeholder="كود" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+966">🇸🇦 +966</SelectItem>
                      <SelectItem value="+963">🇸🇾 +963</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="5XXXXXXXX" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="rounded-xl h-12 flex-1" disabled={isOtpVerified} />
                </div>
                
                {!isOtpVerified && (
                  <Button onClick={handleSendOtp} disabled={isSendingCode || !phone} className="w-full h-12 rounded-xl font-bold" variant="outline">
                    {isSendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق من الرقم"}
                  </Button>
                )}
              </div>

              {confirmationResult && !isOtpVerified && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-2xl animate-in slide-in-from-top-2">
                  <Label className="text-xs font-bold">أدخل الرمز المرسل</Label>
                  <div className="flex gap-2">
                    <Input placeholder="000000" value={otpCode} onChange={e => setOtpCode(e.target.value)} className="rounded-xl h-12 flex-1 text-center font-bold" />
                    <Button onClick={handleVerifyOtp} disabled={isVerifyingCode || otpCode.length < 6} className="rounded-xl h-12 px-6">تحقق</Button>
                  </div>
                </div>
              )}

              {isOtpVerified && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-800">تم التحقق بنجاح</p>
                </div>
              )}
            </div>
          </Card>

          <Button onClick={handlePayment} disabled={!isOtpVerified || !email} className="w-full h-16 text-xl font-bold rounded-2xl bg-primary shadow-xl">تأكيد الحجز والدفع</Button>
        </div>
      )}
    </div>
  );
}

export default function BookTripPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <BookTripContent />
    </Suspense>
  );
}
