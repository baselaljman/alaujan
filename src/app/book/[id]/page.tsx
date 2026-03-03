"use client"

import { useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, User, Stepper as SteeringWheel } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BookTrip({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [step, setStep] = useState(1);

  // توليد مقاعد ثابتة لتجنب مشاكل الهيدريشن (Hydration)
  const seats = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      // جعل بعض المقاعد محجوزة بشكل ثابت للعرض
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
    <div className="space-y-6 pb-32 md:pb-10">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => step === 1 ? router.back() : setStep(1)} className="rounded-full">
          <ArrowRight className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold">{step === 1 ? "اختيار المقاعد" : "بيانات المسافرين"}</h1>
      </header>

      {step === 1 ? (
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
                      AISLE
                    </div>
                    <SeatButton seat={seats[rowIndex * 4 + 2]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 2].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 2].id)} />
                    <SeatButton seat={seats[rowIndex * 4 + 3]} isSelected={selectedSeats.includes(seats[rowIndex * 4 + 3].id)} onClick={() => toggleSeat(seats[rowIndex * 4 + 3].id)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="fixed bottom-20 left-4 right-4 md:static">
            <Button onClick={handleNext} className="w-full h-16 text-lg font-bold shadow-2xl rounded-2xl bg-primary hover:bg-primary/95 transition-all">
              تأكيد {selectedSeats.length} مقاعد والمتابعة
            </Button>
          </div>
        </div>
      ) : (
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
                {selectedSeats.map((seat, index) => (
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

          <Card className="border-primary/10 shadow-lg">
            <CardContent className="p-6 space-y-4 text-right">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">قيمة التذاكر ({selectedSeats.length} مقاعد)</span>
                <span className="font-bold text-primary">${350 * selectedSeats.length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">رسوم الخدمة والضرائب</span>
                <span className="font-bold text-primary">$10</span>
              </div>
              <div className="pt-4 border-t-2 border-dashed flex justify-between items-center text-2xl font-black text-primary font-headline">
                <span>الإجمالي النهائي</span>
                <span>${(350 * selectedSeats.length) + 10}</span>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handlePayment} className="w-full h-16 text-xl font-black shadow-xl rounded-2xl bg-primary hover:bg-primary/95 transition-all">
            الانتقال للدفع الآمن
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
