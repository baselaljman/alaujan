"use client"

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, Banknote, CheckCircle2, ArrowRight, User as UserIcon, Loader2, MapPin, Navigation } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useFirestore, useUser, setDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking, useAuth, initiateAnonymousSignIn } from "@/firebase";
import { collection, doc, serverTimestamp, increment } from "firebase/firestore";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState("");

  const tripId = searchParams.get("tripId") || "";
  const departureTime = searchParams.get("departureTime") || "";
  const seatsParam = searchParams.get("seats") || "";
  const seats = seatsParam.split(",").filter(s => s !== "");
  const totalAmount = Number(searchParams.get("total") || 0);
  const emailInput = searchParams.get("email")?.toLowerCase().trim() || "";
  const phone = searchParams.get("phone") || "";
  const extraBags = Number(searchParams.get("extraBags") || 0);
  const boardingPoint = searchParams.get("boardingPoint") || "";
  const droppingPoint = searchParams.get("droppingPoint") || "";
  const passengersJson = searchParams.get("passengers");
  const rawPassengers = passengersJson ? JSON.parse(passengersJson) : [];
  
  const passengers = rawPassengers.map((p: any) => ({
    ...p,
    status: 'Confirmed'
  }));

  useEffect(() => {
    if (!isUserLoading && !user && auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  const handlePay = () => {
    if (!user || isUserLoading) {
      toast({ variant: "destructive", title: "جاري تهيئة الهوية", description: "يرجى المحاولة مرة أخرى خلال لحظة" });
      return;
    }
    
    if (seats.length === 0) {
      toast({ variant: "destructive", title: "خطأ", description: "لم يتم تحديد مقاعد" });
      return;
    }

    setIsProcessing(true);

    const trackingNumber = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedTicketId(trackingNumber);

    const userProfileRef = doc(firestore, "users", user.uid);
    setDocumentNonBlocking(userProfileRef, {
      id: user.uid,
      email: emailInput,
      phoneNumber: phone,
      firstName: passengers[0]?.fullName.split(' ')[0] || "مسافر",
      lastName: passengers[0]?.fullName.split(' ').slice(1).join(' ') || "العوجان",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp() 
    }, { merge: true });

    const bookingsRef = collection(firestore, "bookings");
    const bookingData = {
      trackingNumber: trackingNumber,
      busTripId: tripId,
      userId: user.uid,
      userEmail: emailInput,
      userPhone: phone,
      numberOfSeats: seats.length,
      seatNumbers: seats,
      extraBags: extraBags,
      passengers: passengers,
      boardingPoint: boardingPoint,
      droppingPoint: droppingPoint,
      departureTime: departureTime,
      totalAmount: totalAmount,
      bookingDate: new Date().toISOString(),
      paymentStatus: paymentMethod === "cash" ? "Pending" : "Completed",
      paymentMethodLabel: paymentMethod === "card" ? "بطاقة ائتمان" : paymentMethod === "wallet" ? "Apple Pay" : "دفع نقدي",
      paymentMethod: paymentMethod,
      status: "Confirmed",
      createdAt: serverTimestamp()
    };
    addDocumentNonBlocking(bookingsRef, bookingData);

    if (tripId) {
      const tripDocRef = doc(firestore, "busTrips", tripId);
      updateDocumentNonBlocking(tripDocRef, {
        availableSeats: increment(-seats.length),
        updatedAt: new Date().toISOString()
      });
    }

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast({
        title: "تم الحجز بنجاح",
        description: `رقم التتبع: ${trackingNumber}`,
      });
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-in zoom-in duration-500">
        <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-2">
          <CheckCircle2 className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold font-headline text-primary">تم الحجز بنجاح!</h1>
        
        <Card className="max-w-xs mx-auto border-none shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-primary p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">رقم الحجز المرجعي</p>
            <p className="text-3xl font-black font-mono">{generatedTicketId}</p>
          </div>
          <CardContent className="p-6 bg-white space-y-4">
            <div className="p-3 rounded-xl bg-muted/30 border border-dashed flex justify-between items-center">
              <span className="text-[10px] font-bold">عدد المقاعد:</span>
              <span className="text-sm font-mono font-bold text-primary">{seats.length}</span>
            </div>
            <p className="text-[10px] text-muted-foreground font-bold text-right">تذاكرك مرتبطة الآن ببريدك ({emailInput}). تم تحديث سعة الحافلة بنجاح.</p>
          </CardContent>
        </Card>

        <div className="space-y-3 w-full max-w-xs pt-4">
          <Button className="w-full h-14 rounded-2xl font-bold gap-2" onClick={() => router.push("/profile")}>
             عرض تذاكري الخاصة <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <Button variant="ghost" className="w-full h-12 rounded-xl" onClick={() => router.push("/")}>العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowRight className="h-6 w-6" /></Button>
        <h1 className="text-xl font-bold">تأكيد الحجز والدفع</h1>
      </header>

      <div className="space-y-4">
        <Card className="border-primary/10 shadow-sm">
          <CardHeader className="bg-primary/5 border-b py-4">
            <CardTitle className="text-base font-semibold">ملخص الحجز</CardTitle>
            <CardDescription className="flex flex-col gap-1">
              <span className="flex items-center gap-1 justify-end"><MapPin className="h-3 w-3" /> {boardingPoint} ⬅ {droppingPoint}</span>
              <span className="font-bold text-primary mt-1">الإجمالي: {totalAmount} ريال ({seats.length} مقاعد)</span>
            </CardDescription>
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
              <Label htmlFor="cash" className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:bg-muted"}`}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center"><Banknote className="h-5 w-5 text-green-600" /></div>
                  <div className="font-medium text-base text-right">دفع نقدي عند السفر</div>
                </div>
                <RadioGroupItem value="cash" id="cash" className="sr-only" />
              </Label>
            </RadioGroup>
          </CardContent>
        </Card>

        <Button onClick={handlePay} disabled={isProcessing || isUserLoading} className="w-full h-16 text-xl font-bold shadow-xl rounded-2xl bg-primary">
          {isProcessing ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : "إتمام الحجز وإصدار التذاكر"}
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}