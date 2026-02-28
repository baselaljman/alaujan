"use client"

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Users, ArrowRight } from "lucide-react";
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

const mockTrips: Trip[] = [
  { id: "1", from: "Riyadh", to: "Damascus", departure: "08:00 AM", arrival: "11:00 PM", price: 350, seatsLeft: 12, busType: "VIP Coach" },
  { id: "2", from: "Riyadh", to: "Damascus", departure: "04:00 PM", arrival: "07:00 AM", price: 280, seatsLeft: 5, busType: "Express" },
  { id: "3", from: "Riyadh", to: "Damascus", departure: "10:30 PM", arrival: "01:30 PM", price: 310, seatsLeft: 20, busType: "Economy Plus" },
];

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground animate-pulse">Finding best trips for you...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {from} <ArrowRight className="h-4 w-4" /> {to}
          </h1>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </header>

      <div className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground px-1">{mockTrips.length} Trips found</p>
        {mockTrips.map((trip) => (
          <Card key={trip.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-primary/10">
            <CardContent className="p-0">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
                      {trip.busType}
                    </Badge>
                    <div className="flex items-center gap-6 pt-2">
                      <div className="text-center">
                        <p className="text-lg font-bold">{trip.departure}</p>
                        <p className="text-xs text-muted-foreground">{trip.from}</p>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-full h-[2px] bg-border relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full border-2 border-primary bg-background" />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">15h Approx</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{trip.arrival}</p>
                        <p className="text-xs text-muted-foreground">{trip.to}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary font-headline">${trip.price}</p>
                    <p className="text-[10px] text-muted-foreground">Per person</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Direct</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className={trip.seatsLeft < 10 ? "text-accent font-medium" : ""}>
                        {trip.seatsLeft} seats left
                      </span>
                    </div>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/90 rounded-full px-6">
                    <Link href={`/book/${trip.id}`}>Book Now</Link>
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
