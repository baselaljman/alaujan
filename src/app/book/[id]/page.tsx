
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

export default function BookTrip({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
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

  const TICKET_PRICE = 350;
  const EXTRA_BAG_PRICE = 100;

  const seats = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      isAvailable: !([3, 7, 12, 18, 25, 30].includes(i + 1)),
    }));
  }, []);

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
    if (otp === "1234" || otp === "0000") { // Simulated logic
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

  const handlePayment = () => {
    if (!isOtpVerified) {
      toast({ title: "تنبيه", description: "يرجى التحقق من رقم الهاتف أولاً.", variant: "destructive" });
      return;
    }
    router.push("/checkout");
  };

  const totalTicketPrice = selectedSeats.length * TICKET_PRICE;
  const totalExtraBagsPrice = extraBags * EXTRA_BAG_PRICE;
  const finalTotal = totalTicketPrice + totalExtraBagsPrice + 10;

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
        <h1 className="text-xl font-bold">
          {step === 1 && "اختيار المقاعد"}
          {step === 2 && "بيانات المسافرين"}
          {step === 3 && "إضافة الأمتعة"}
          {step === 4 && "معلومات الاتصال"}
        </h1>
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
                {Array.from({ length: 10 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="contents">
                    <SeatButton seat={seats[rowIndex * 4]} isSelected={selectedSeats.includes(seats[rowIndex * 4].id)} onClick={() => toggleSeat(seats[rowIndex * 4].id)} />
                    <SeatButton seat={seats[rowIndex * 4 + 1]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 1].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 1].id)} />
                    <div className="flex items-center justify-center text-[8px] text-primary/20 font-bold rotate-90 pointer-events-none">
                      الممر
                    </div>
                    <SeatButton seat={seats[rowIndex * 4 + 2]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 2].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 2].id)} />
                    <SeatButton seat={seats[rowIndex * 4 + 3]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 3].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 3].id)} />
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

      {/* Step 2: Passenger Data */}
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
                        <Label className="text-xs font-semibold">الاسم الثلاثي (كما في الهوية)</Label>
                        <input className="w-full h-12 px-4 bg-muted/30 border-transparent border focus:border-primary/30 focus:bg-white rounded-xl transition-all outline-none" placeholder="أدخل الاسم الثلاثي كاملاً" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold">رقم الهوية أو جواز السفر</Label>
                        <input className="w-full h-12 px-4 bg-muted/30 border-transparent border focus:border-primary/30 focus:bg-white rounded-xl transition-all outline-none" placeholder="مثلاً: 123456789" />
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

      {/* Step 3: Luggage */}
      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <Card className="border-primary/20 shadow-md bg-white">
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  سياسة الأمتعة المجانية
                </CardTitle>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="p-6 text-right">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-green-50/50 border border-green-100">
                <Info className="h-5 w-5 text-green-600 mt-1 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold text-green-800">يسمح لكل راكب بحقيبتين مجاناً</p>
                  <p className="text-sm text-green-700">الوزن الأقصى لكل حقيبة هو 30 كيلوجرام.</p>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-right">
                    <h3 className="font-bold text-lg">حقائب إضافية</h3>
                    <p className="text-sm text-muted-foreground">أضف حقائب أكثر عند الحاجة</p>
                    <p className="text-xs font-bold text-accent mt-1">100 ريال لكل حقيبة إضافية</p>
                  </div>
                  <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-primary/5">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl border-primary/20"
                      onClick={() => setExtraBags(Math.max(0, extraBags - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-black min-w-[30px] text-center">{extraBags}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/90"
                      onClick={() => setExtraBags(extraBags + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/10 shadow-lg bg-primary/5">
            <CardContent className="p-6 space-y-4 text-right">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">قيمة التذاكر ({selectedSeats.length} مسافرين)</span>
                <span className="font-bold text-primary">${totalTicketPrice}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">حقائب إضافية ({extraBags})</span>
                <span className="font-bold text-primary">${totalExtraBagsPrice}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">رسوم الخدمة والضرائب</span>
                <span className="font-bold text-primary">$10</span>
              </div>
              <div className="pt-4 border-t-2 border-dashed border-primary/20 flex justify-between items-center text-2xl font-black text-primary">
                <span>الإجمالي النهائي</span>
                <span>${finalTotal}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleNextStep} className="w-full h-16 text-xl font-black shadow-xl rounded-2xl bg-primary hover:bg-primary/95 transition-all">
            متابعة لبيانات الاتصال
          </Button>
        </div>
      )}

      {/* Step 4: Contact Info & OTP */}
      {step === 4 && (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                معلومات الاتصال والتحقق
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-right">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">رقم الهاتف الجوال</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      className="pr-10 h-12 rounded-xl" 
                      placeholder="05XXXXXXXX" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isOtpVerified}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">البريد الإلكتروني (لتلقي التذاكر)</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input 
                      className="pr-10 h-12 rounded-xl" 
                      placeholder="example@mail.com" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isOtpVerified}
                    />
                  </div>
                </div>
              </div>

              {!isOtpVerified && (
                <div className="pt-4 space-y-4 border-t border-dashed">
                  {!isOtpSent ? (
                    <Button 
                      onClick={sendOtp} 
                      className="w-full h-12 rounded-xl" 
                      variant="outline"
                      disabled={isOtpVerifying || !phone}
                    >
                      {isOtpVerifying ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                      إرسال رمز التحقق
                    </Button>
                  ) : (
                    <div className="space-y-4 animate-in zoom-in duration-300">
                      <div className="space-y-2">
                        <Label className="text-xs text-center block text-muted-foreground">أدخل الرمز المرسل إلى {phone}</Label>
                        <Input 
                          className="text-center text-2xl tracking-[0.5em] font-black h-14 rounded-xl" 
                          placeholder="----" 
                          maxLength={4}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                        />
                      </div>
                      <Button 
                        onClick={verifyOtp} 
                        className="w-full h-12 rounded-xl bg-accent text-white hover:bg-accent/90"
                        disabled={isOtpVerifying || otp.length < 4}
                      >
                        {isOtpVerifying ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                        تحقق من الرمز
                      </Button>
                      <Button variant="link" className="w-full text-xs" onClick={() => setIsOtpSent(false)}>إعادة إرسال؟</Button>
                    </div>
                  )}
                </div>
              )}

              {isOtpVerified && (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center gap-3 animate-in zoom-in">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-green-800">تم التحقق من رقم الهاتف بنجاح</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Button 
            onClick={handlePayment} 
            disabled={!isOtpVerified || !email}
            className="w-full h-16 text-xl font-black shadow-xl rounded-2xl bg-primary hover:bg-primary/95 transition-all"
          >
            الانتقال للدفع وتلقي التذاكر
          </Button>
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
