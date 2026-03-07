"use client"

import { useState, useMemo, Suspense, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Package, Plus, Minus, Loader2, CreditCard, ShieldCheck, Send, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useCollection, useMemoFirebase, useAuth, setupRecaptcha, sendOtpToPhone } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
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
  const firestore = useFirestore();
  const auth = useAuth();
  
  const tripRef = useMemoFirebase(() => (tripId ? doc(firestore, "busTrips", tripId) : null), [firestore, tripId]);
  const { data: trip, isLoading: isTripLoading } = useDoc(tripRef);

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
  const [countryCode, setCountryCode] = useState("+966");
  const [email, setEmail] = useState("");
  
  // OTP States
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

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
    
    // تنظيف الرقم من أي شيء غير الأرقام
    let digitsOnly = phone.replace(/\D/g, '');
    
    // إزالة كود الدولة المختار يدوياً إذا كتبه المستخدم في الحقل لمنع التكرار
    const currentCodeDigits = countryCode.replace(/\D/g, '');
    if (digitsOnly.startsWith(currentCodeDigits)) {
      digitsOnly = digitsOnly.substring(currentCodeDigits.length);
    }
    
    // إزالة كافة الأصفار في البداية
    digitsOnly = digitsOnly.replace(/^0+/, '');
    
    if (digitsOnly.length < 7) {
      toast({ variant: "destructive", title: "رقم ناقص", description: "يرجى إدخال رقم هاتف صحيح." });
      return;
    }

    const fullPhoneNumber = `${countryCode}${digitsOnly}`;
    
    setIsSendingCode(true);
    try {
      // تهيئة المحرك في كل محاولة لضمان النظافة ومنع الخطأ -39
      const verifier = setupRecaptcha(auth, 'recaptcha-container');
      const result = await sendOtpToPhone(auth, fullPhoneNumber, verifier);
      setConfirmationResult(result);
    } catch (error) {
      // الأخطاء يتم التعامل معها في sendOtpToPhone
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
      toast({ title: "تم التحقق بنجاح", description: "يمكنك الآن إكمال عملية الدفع" });
    } catch (error) {
      toast({ variant: "destructive", title: "رمز خاطئ", description: "يرجى التأكد من الرمز وإعادة المحاولة" });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handlePayment = () => {
    if (!isOtpVerified || !email || !isPassengerInfoComplete) return;
    const finalTotal = (selectedSeats.length * TICKET_PRICE) + (extraBags * BAG_PRICE);
    
    const digitsOnly = phone.replace(/\D/g, '').replace(/^0+/, '');
    const fullPhoneNumber = `${countryCode}${digitsOnly}`;
    
    const queryParams = new URLSearchParams({ 
      tripId, 
      seats: selectedSeats.join(","), 
      total: finalTotal.toString(), 
      email,
      phone: fullPhoneNumber,
      extraBags: extraBags.toString(),
      passengers: JSON.stringify(passengers)
    });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (!tripId) return <div className="text-center p-20">لم يتم تحديد رحلة</div>;
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

      {/* حاوية الـ Recaptcha - يجب أن تكون مرئية لـ Firebase ولكن مخفية عن المستخدم */}
      <div id="recaptcha-container" className="fixed bottom-0 left-0 z-0 opacity-0 pointer-events-none"></div>

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
          <p className="text-sm text-muted-foreground text-center">يرجى إدخل بيانات المسافرين كما تظهر في جواز السفر للرحلات الدولية</p>
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
                  <p className="text-[10px] text-muted-foreground">يسمح بحقيبتين مجاناً لكل راكب</p>
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
                <CreditCard className="h-4 w-4 text-primary" /> بيانات التواصل والتحقق
              </h3>
              <div className="space-y-2">
                <Label>البريد الإلكتروني (لتلقي التذاكر)</Label>
                <Input placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-12" />
              </div>
              
              <div className="space-y-3">
                <Label>رقم الهاتف</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode} disabled={isOtpVerified}>
                      <SelectTrigger className="w-[110px] h-12 rounded-xl bg-muted/30">
                        <SelectValue placeholder="كود" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+966">🇸🇦 +966</SelectItem>
                        <SelectItem value="+963">🇸🇾 +963</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="5XXXXXXXX" 
                      type="tel"
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      className="rounded-xl h-12 flex-1" 
                      disabled={isOtpVerified}
                    />
                  </div>
                  
                  {!isOtpVerified && (
                    <Button 
                      onClick={handleSendOtp} 
                      disabled={isSendingCode || !phone} 
                      className="w-full h-12 rounded-xl gap-2 font-bold shadow-md"
                      variant="outline"
                    >
                      {isSendingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>تحقق من الرقم</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {confirmationResult && !isOtpVerified && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-2xl animate-in slide-in-from-top-2 border border-primary/5">
                  <Label className="text-xs font-bold">أدخل الرمز المرسل لجوالك</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="000000" 
                      value={otpCode} 
                      onChange={e => setOtpCode(e.target.value)} 
                      className="rounded-xl h-12 flex-1 text-center font-bold tracking-widest" 
                    />
                    <Button 
                      onClick={handleVerifyOtp} 
                      disabled={isVerifyingCode || otpCode.length < 6} 
                      className="rounded-xl h-12 px-6"
                    >
                      {isVerifyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق"}
                    </Button>
                  </div>
                </div>
              )}

              {isOtpVerified && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">تم التحقق من الهاتف</p>
                    <p className="text-[10px] text-emerald-600">رقمك موثق الآن في النظام</p>
                  </div>
                </div>
              )}
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

          <Button 
            onClick={handlePayment} 
            disabled={!isOtpVerified || !email} 
            className="w-full h-16 text-xl font-bold rounded-2xl bg-primary shadow-xl"
          >
            الانتقال للدفع وتأكيد الحجز
          </Button>
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
