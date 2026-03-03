
"use client"

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Package, Plus, Minus, Info, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";

export default function BookTrip({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const firestore = useFirestore();

  // جلب بيانات الرحلة
  const tripRef = useMemoFirebase(() => doc(firestore, "busTrips", tripId), [firestore, tripId]);
  const { data: trip, isLoading: isTripLoading } = useDoc(tripRef);

  // جلب جميع الحجوزات لهذه الرحلة (Fixed: Using top-level collection)
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
  const [extraBags, setExtraBags] = useState(0);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const TICKET_PRICE = trip?.pricePerSeat || 350;

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

  const handleNextStep = () => {
    if (step === 1 && selectedSeats.length === 0) return;
    setStep(step + 1);
  };

  const handlePayment = () => {
    if (!isOtpVerified || !email) return;
    const finalTotal = (selectedSeats.length * TICKET_PRICE) + (extraBags * 100);
    const queryParams = new URLSearchParams({ tripId, seats: selectedSeats.join(","), total: finalTotal.toString(), email });
    router.push(`/checkout?${queryParams.toString()}`);
  };

  if (isTripLoading || isBookingsLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-6 pb-32">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? router.back() : setStep(step - 1)}><ArrowRight className="h-6 w-6" /></Button>
        <h1 className="text-xl font-bold">حجز مقاعد: {trip?.originName} ⮕ {trip?.destinationName}</h1>
      </header>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in">
          <Card className="max-w-[320px] mx-auto p-8 bg-muted/20">
            <div className="grid grid-cols-5 gap-y-4 gap-x-2">
              {seats.map((seat) => (
                <button
                  key={seat.id}
                  disabled={!seat.isAvailable}
                  onClick={() => toggleSeat(seat.id)}
                  className={cn(
                    "h-12 w-12 rounded-xl text-xs font-bold border-2 transition-all",
                    !seat.isAvailable ? "bg-muted text-muted-foreground opacity-50" :
                    selectedSeats.includes(seat.id) ? "bg-primary text-white border-primary" : "bg-white border-primary/10"
                  )}
                >{seat.id}</button>
              ))}
            </div>
          </Card>
          <Button onClick={handleNextStep} className="w-full h-16 text-lg font-bold rounded-2xl">تأكيد {selectedSeats.length} مقاعد</Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in slide-in-from-left">
          <Card className="p-6 space-y-4">
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input placeholder="05XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <Button onClick={() => setIsOtpVerified(true)} className="w-full" variant={isOtpVerified ? "secondary" : "default"}>{isOtpVerified ? "تم التحقق" : "تحقق من الهاتف"}</Button>
          </Card>
          <Button onClick={handlePayment} disabled={!isOtpVerified || !email} className="w-full h-16 text-xl font-bold rounded-2xl">الانتقال للدفع</Button>
        </div>
      )}
    </div>
  );
}
