
"use client"

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Banknote, CheckCircle2, ArrowRight, Mail, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, serverTimestamp, increment } from "firebase/firestore";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // استرجاع بيانات الحجز من الرابط
  const tripId = searchParams.get("tripId");
  const seats = searchParams.get("seats")?.split(",") || [];
  const totalAmount = Number(searchParams.get("total") || 0);
  const email = searchParams.get("email") || "";

  const handlePay = () => {
    if (!user) {
      toast({ title: "خطأ", description: "يجب تسجيل الدخول لإتمام الحجز", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);

    // 1. تسجيل الحجز في مجموعة رئيسية واحدة (لتجنب مشاكل الفهارس)
    const bookingsRef = collection(firestore, "bookings");
    const bookingData = {
      busTripId: tripId,
      userId: user.uid,
      userEmail: email,
      numberOfSeats: seats.length,
      seatNumbers: seats,
      totalAmount: totalAmount,
      bookingDate: new Date().toISOString(),
      paymentStatus: paymentMethod === "cash" ? "Pending" : "Completed",
      paymentMethod: paymentMethod === "card" ? "Credit Card" : paymentMethod === "wallet" ? "Apple Pay" : "Cash on Delivery",
      status: "Confirmed",
      createdAt: serverTimestamp()
    };

    addDocumentNonBlocking(bookingsRef, bookingData);

    // 2. تحديث عدد المقاعد المتاحة في الرحلة
    if (tripId) {
      const tripRef = doc(firestore, "busTrips", tripId);
      updateDocumentNonBlocking(tripRef, {
        availableSeats: increment(-seats.length)
      });
    }

    // محاكاة معالجة الدفع
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast({
        title: "تم تأكيد الحجز!",
        description: "تم إرسال تذاكرك وبيانات الحجز إلى بريدك الإلكتروني بنجاح.",
      });
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold font-headline">تم الحجز بنجاح!</h1>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 max-w-xs mx-auto">
          <Mail className="h-5 w-5 text-primary" />
          <p className="text-xs text-primary font-medium text-right">تم إرسال نسخة من التذاكر إلى {email}</p>
        </div>
        <div className="space-y-3 w-full max-w-xs">
          <Button className="w-full h-12" onClick={() => router.push("/track")}>تتبع رحلتي</Button>
          <Button variant="outline" className="w-full h-12" onClick={() => router.push("/")}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">طرق الدفع</h1>
      </header>

      <div className="space-y-4">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-base font-semibold">ملخص الدفع</CardTitle>
            <CardDescription>المقاعد: {seats.join(", ")} | الإجمالي: {totalAmount} ريال</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="space-y-4">
              <Label htmlFor="card" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "card" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><CreditCard className="h-5 w-5 text-primary" /></div>
                  <div className="font-medium text-base text-right">بطاقة ائتمان / مدى</div>
                </div>
                <RadioGroupItem value="card" id="card" className="sr-only" />
              </Label>
              <Label htmlFor="wallet" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "wallet" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><Wallet className="h-5 w-5 text-blue-600" /></div>
                  <div className="font-medium text-base text-right">Apple Pay / Google Pay</div>
                </div>
                <RadioGroupItem value="wallet" id="wallet" className="sr-only" />
              </Label>
              <Label htmlFor="cash" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center"><Banknote className="h-5 w-5 text-green-600" /></div>
                  <div className="font-medium text-base text-right">دفع نقدي في المكتب</div>
                </div>
                <RadioGroupItem value="cash" id="cash" className="sr-only" />
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button onClick={handlePay} disabled={isProcessing} className="w-full h-16 text-xl font-bold shadow-xl rounded-2xl bg-primary">
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : "تأكيد الحجز والدفع"}
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
