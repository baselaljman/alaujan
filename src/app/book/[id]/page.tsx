"use client"

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, User, Luggage } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BookTrip({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [step, setStep] = useState(1);

  const toggleSeat = (seatId: number) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const seats = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    isAvailable: Math.random() > 0.3,
  }));

  const handleNext = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "لم يتم اختيار مقاعد",
        description: "يرجى اختيار مقعد واحد على الأقل للمتابعة.",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handlePayment = () => {
    router.push("/checkout");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? router.back() : setStep(1)}>
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">{step === 1 ? "اختيار المقاعد" : "بيانات المسافرين"}</h1>
      </header>

      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex justify-center gap-6 text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-primary" />
              <span>مختار</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-muted border" />
              <span>محجوز</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm border-primary/30 border" />
              <span>متاح</span>
            </div>
          </div>

          <Card className="max-w-xs mx-auto border-2 border-primary/10">
            <CardHeader className="pb-2 text-center border-b bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">مقدمة الحافلة</p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-4 gap-4">
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    disabled={!seat.isAvailable}
                    onClick={() => toggleSeat(seat.id)}
                    className={cn(
                      "h-10 w-10 rounded-lg text-xs font-medium transition-all flex items-center justify-center border",
                      !seat.isAvailable ? "bg-muted text-muted-foreground cursor-not-allowed" :
                      selectedSeats.includes(seat.id) ? "bg-primary text-white border-primary shadow-lg scale-105" :
                      "hover:border-primary border-primary/20"
                    )}
                  >
                    {seat.id}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-20 left-4 right-4 md:static">
            <Button onClick={handleNext} className="w-full h-14 text-lg shadow-xl md:max-w-md mx-auto block">
              متابعة ({selectedSeats.length} مقاعد)
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">المقاعد المختارة: {selectedSeats.join(", ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedSeats.map((seat, index) => (
                <div key={seat} className="p-4 border rounded-lg space-y-3 bg-white text-right">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <User className="h-4 w-4" />
                    <span>المسافر {index + 1} (مقعد {seat})</span>
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <input className="w-full p-2 border rounded-md" placeholder="أدخل الاسم الكامل" />
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهوية / جواز السفر</Label>
                    <input className="w-full p-2 border rounded-md" placeholder="أدخل رقم الهوية" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4 text-right">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">سعر التذكرة x {selectedSeats.length}</span>
                <span className="font-bold">${350 * selectedSeats.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">رسوم الحجز</span>
                <span className="font-bold">$10</span>
              </div>
              <div className="pt-4 border-t flex justify-between items-center text-xl font-bold text-primary">
                <span>المبلغ الإجمالي</span>
                <span>${(350 * selectedSeats.length) + 10}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handlePayment} className="w-full h-14 text-lg shadow-xl">
            الانتقال للدفع
          </Button>
        </div>
      )}
    </div>
  );
}
