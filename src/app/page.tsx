
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, MapPin, Bus, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const cities = ["Riyadh", "Amman", "Damascus", "Aleppo", "Homs", "Zarqa"];

export default function HomePage() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (from && to && date) {
      router.push(`/search?from=${from}&to=${to}&date=${format(date, 'yyyy-MM-dd')}`);
    }
  };

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-bus');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-primary font-headline">Al-Awajan Travel</h1>
          <p className="text-sm text-muted-foreground">العوجان للسياحة والسفر</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Bus className="h-6 w-6 text-primary" />
        </div>
      </header>

      <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-lg border">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint="travel bus"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <p className="text-white font-semibold text-lg">Safe and Comfortable Trips Across Borders</p>
        </div>
      </div>

      <Card className="shadow-xl border-none ring-1 ring-border bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Your Trip
          </CardTitle>
          <CardDescription>Select your destination and travel date</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Select onValueChange={setFrom} value={from}>
                  <SelectTrigger id="from" className="bg-background">
                    <SelectValue placeholder="Select origin city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Select onValueChange={setTo} value={to}>
                  <SelectTrigger id="to" className="bg-background">
                    <SelectValue placeholder="Select destination city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date of Travel</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a travel date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all hover:scale-[1.01] active:scale-[0.98]" disabled={!from || !to || !date}>
              Search Trips
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto flex-col py-6 gap-2 border-primary/20 hover:border-primary bg-white/50" asChild>
          <Link href="/track">
            <MapPin className="h-6 w-6 text-primary" />
            <span>Track Trip</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col py-6 gap-2 border-primary/20 hover:border-primary bg-white/50" asChild>
          <Link href="/parcels">
            <Package className="h-6 w-6 text-primary" />
            <span>Track Parcel</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
