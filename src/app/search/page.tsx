
"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Trip {
  id: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  price: number;
  seatsLeft: number;
  busType: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  const [isLoading, setIsLoading] = useState(true);

  // Use the search params to generate more realistic mock data
  const mockTrips: Trip[] = [
    { id: "1", from: from || "الرياض", to: to || "دمشق", departure: "08:00 صباحاً", arrival: "11:00 مساءً", price: 350, seatsLeft: 12, busType: "VIP كوتش" },
    { id: "2", from: from || "الرياض", to: to || "دمشق", departure: "04:00 مساءً", arrival: "07:00 صباحاً", price: 280, seatsLeft: 5, busType: "إكسبريس" },
    { id: "3", from: from || "الرياض", to: to || "دمشق", departure: "10:30 مساءً", arrival: "01:30 مساءً", price: 310, seatsLeft: 20, busType: "إيكونومي بلس" },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">جاري البحث عن أفضل الرحلات...</p>
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
        <p className="text-sm font-medium text-muted-foreground px-1">تم العثور على {mockTrips.length} رحلات مباشرة</p>
        {mockTrips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden hover:shadow-xl transition-all border-primary/5 bg-white/80 backdrop-blur-sm group">
            <CardContent className="p-0">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-none px-3">
                      {trip.busType}
                    </Badge>
                    <div className="flex items-center gap-4 pt-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{trip.departure}</p>
                        <p className="text-xs text-muted-foreground">{trip.from}</p>
                      </div>
                      <div className="flex flex-col items-center flex-1 px-2">
                        <div className="w-full h-[2px] bg-gradient-to-r from-primary to-primary/10 relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border-2 border-primary bg-background" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">حوالي 18 ساعة</p>
                      </div>
                      <div className="text-left">
                        <p className="text-lg font-bold text-primary">{trip.arrival}</p>
                        <p className="text-xs text-muted-foreground">{trip.to}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left pr-4">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-xs font-bold text-primary">$</span>
                      <span className="text-2xl font-black text-primary font-headline">{trip.price}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">للفرد (ذهاب فقط)</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-primary/5 text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-primary/60" />
                      <span>مباشر</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary/60" />
                      <span className={trip.seatsLeft < 10 ? "text-accent font-bold animate-pulse" : ""}>
                        متبقي {trip.seatsLeft} مقاعد
                      </span>
                    </div>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/95 rounded-full px-8 shadow-lg group-hover:scale-105 transition-transform">
                    <Link href={`/book/${trip.id}`}>احجز مقعدك</Link>
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
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">جاري تحميل النتائج...</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
