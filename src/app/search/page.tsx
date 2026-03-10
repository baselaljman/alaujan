
"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Users, ArrowLeft, MapPin, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  const tripsQuery = useMemoFirebase(() => {
    if (!firestore || !from || !to) return null;
    return query(
      collection(firestore, "busTrips"),
      where("status", "in", ["Scheduled", "Departed", "Delayed"])
    );
  }, [firestore, from, to]);

  const { data: trips, isLoading } = useCollection(tripsQuery);

  const filteredTrips = useMemo(() => {
    if (!trips || !from || !to || !date) return [];
    
    return trips.map((trip: any) => {
      // التحقق من تاريخ الرحلة (تجاهل الوقت)
      const tripDate = new Date(trip.departureTime).toISOString().split('T')[0];
      if (tripDate !== date) return null;

      // بناء مصفوفة كاملة للنقاط بأسعارها التراكمية
      // السعر في النقاط الوسيطة والوصول هو السعر من نقطة الانطلاق لتلك النقطة
      const allPoints = [
        { id: trip.originId, name: trip.originName, price: 0 },
        ...(trip.intermediateStops || []),
        { id: trip.destinationId, name: trip.destinationName, price: trip.pricePerSeat }
      ];

      const fromIndex = allPoints.findIndex(p => p.name === from);
      const toIndex = allPoints.findIndex(p => p.name === to);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex) {
        // حساب السعر للجزء المختار من المسار
        // إذا كان الشخص يركب من نقطة وسيطة (بسرع X) وينزل في نقطة وسيطة أخرى (بسعر Y)
        // فإن السعر هو الفرق بينهما Y - X
        const segmentPrice = allPoints[toIndex].price - allPoints[fromIndex].price;
        
        return {
          ...trip,
          calculatedPrice: segmentPrice > 0 ? segmentPrice : trip.pricePerSeat,
          fromLabel: from,
          toLabel: to
        };
      }
      return null;
    }).filter(Boolean);
  }, [trips, from, to, date]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="text-muted-foreground animate-pulse">جاري البحث عن أفضل الأسعار...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-primary/5">
          <ArrowRight className="h-6 w-6 text-primary" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {from} <ArrowLeft className="h-4 w-4 text-primary" /> {to}
          </h1>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </header>

      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground px-1">
          {filteredTrips.length > 0 ? `تم العثور على ${filteredTrips.length} رحلات تمر بمدينتك` : "لا توجد رحلات مجدولة حالياً لهذا المسار في هذا التاريخ"}
        </p>
        
        {filteredTrips.map((trip: any) => (
          <Card key={trip.id} className="overflow-hidden hover:shadow-xl transition-all border-primary/5 bg-white/80 backdrop-blur-sm group">
            <CardContent className="p-0">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 font-bold">
                      VIP
                    </Badge>
                    <div className="flex items-center gap-4 pt-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{new Date(trip.departureTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-xs text-muted-foreground">{from}</p>
                      </div>
                      <div className="flex flex-col items-center flex-1 px-2">
                        <div className="w-full h-[2px] bg-gradient-to-l from-primary to-primary/10 relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border-2 border-primary bg-background" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">مسار مخصص</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-primary">وصول</p>
                        <p className="text-xs text-muted-foreground">{to}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left pr-4">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-xs font-bold text-primary">ريال</span>
                      <span className="text-2xl font-black text-primary font-headline">{trip.calculatedPrice}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">سعر المقعد لهذا المسار</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-primary/5 text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary/60" />
                      <span>{trip.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary/60" />
                      <span>{trip.availableSeats} مقعد متاح</span>
                    </div>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/95 rounded-full px-8 shadow-lg group-hover:scale-105 transition-transform">
                    <Link href={`/book?id=${trip.id}&price=${trip.calculatedPrice}`}>احجز الآن</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SearchResults() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
