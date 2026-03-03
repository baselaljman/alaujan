
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, MapPin, Bus, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const saudiCities = ["الرياض", "الدمام"];
const syrianCities = ["دمشق", "حمص", "حماة", "إدلب", "الساحل السوري", "الميادين", "دير الزور", "الرقة"];

export default function HomePage() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>();

  const isSaudi = (city: string) => saudiCities.includes(city);
  const isSyrian = (city: string) => syrianCities.includes(city);

  // Filter destination based on departure
  const availableDestinations = from 
    ? (isSaudi(from) ? syrianCities : saudiCities)
    : [...saudiCities, ...syrianCities];

  useEffect(() => {
    // Clear destination if it becomes invalid when changing departure
    if (from && to) {
      if (isSaudi(from) && isSaudi(to)) setTo("");
      if (isSyrian(from) && isSyrian(to)) setTo("");
    }
  }, [from, to]);

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
          <h1 className="text-2xl font-bold text-primary font-headline">العوجان للسياحة والسفر</h1>
          <p className="text-sm text-muted-foreground italic">Al-Awajan Travel</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
          <Bus className="h-6 w-6 text-primary" />
        </div>
      </header>

      <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-lg border border-primary/10">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
          <p className="text-white font-bold text-xl shadow-sm">رحلات آمنة ومريحة عبر الحدود</p>
        </div>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-primary/10 bg-white/70 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-headline flex items-center gap-2 text-primary">
            <Search className="h-5 w-5" />
            ابحث عن رحلتك
          </CardTitle>
          <CardDescription>حدد وجهتك الدولية وتاريخ السفر</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="from" className="text-sm font-semibold pr-1">من مدينة الانطلاق</Label>
                <Select onValueChange={setFrom} value={from}>
                  <SelectTrigger id="from" className="bg-background border-primary/10 h-14 rounded-xl focus:ring-accent shadow-sm transition-all hover:border-primary/30">
                    <SelectValue placeholder="اختر مدينة الانطلاق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>المملكة العربية السعودية</SelectLabel>
                      {saudiCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>الجمهورية العربية السورية</SelectLabel>
                      {syrianCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="to" className="text-sm font-semibold pr-1">إلى الوجهة</Label>
                <Select onValueChange={setTo} value={to} disabled={!from}>
                  <SelectTrigger id="to" className="bg-background border-primary/10 h-14 rounded-xl focus:ring-accent shadow-sm transition-all hover:border-primary/30">
                    <SelectValue placeholder={from ? "اختر مدينة الوصول" : "اختر مدينة الانطلاق أولاً"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDestinations.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label className="text-sm font-semibold pr-1">تاريخ السفر</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal bg-background border-primary/10 h-14 rounded-xl shadow-sm transition-all hover:border-primary/30 hover:bg-white",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-3 h-5 w-5 text-primary opacity-70" />
                    {date ? format(date, "PPP", { locale: ar }) : <span>اختر تاريخ السفر المفضل</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-primary/10 shadow-2xl" align="center" sideOffset={10}>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                    locale={ar}
                    className="rounded-2xl border-none"
                    classNames={{
                      day_selected: "bg-primary text-white hover:bg-primary/90 focus:bg-primary font-bold rounded-lg",
                      day_today: "bg-accent/10 text-accent border border-accent/20 rounded-lg",
                      day: "h-10 w-10 text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors",
                      head_cell: "text-muted-foreground w-10 font-bold text-[0.8rem] pb-4",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/95 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.98] rounded-xl" 
              disabled={!from || !to || !date}
            >
              بحث عن الرحلات المتاحة
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto flex-col py-8 gap-3 border-primary/10 hover:border-primary/40 bg-white/70 shadow-sm transition-all hover:bg-white rounded-2xl" asChild>
          <Link href="/track">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/5">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold">تتبع الرحلة</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col py-8 gap-3 border-primary/10 hover:border-primary/40 bg-white/70 shadow-sm transition-all hover:bg-white rounded-2xl" asChild>
          <Link href="/parcels">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/5">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold">تتبع الطرود</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
