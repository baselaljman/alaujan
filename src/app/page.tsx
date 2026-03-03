
"use client"

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, MapPin, Bus, Search, Package, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>();

  // جلب المدن من Firestore
  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading: isLocationsLoading } = useCollection(locationsRef);

  // جلب الرحلات المتاحة لعرض تواريخها
  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  // استخراج التواريخ التي تتوفر فيها رحلات للمسار المختار
  const availableTripDates = useMemo(() => {
    if (!trips) return new Set<string>();
    
    return new Set(
      trips
        .filter(trip => {
          // إذا تم اختيار المدن، نعرض فقط تواريخ الرحلات لهذا المسار
          if (from && to) {
            return trip.originName === from && trip.destinationName === to;
          }
          // إذا لم يتم اختيار المسار، نعرض كل تواريخ الرحلات القادمة
          return true;
        })
        .map(trip => startOfDay(new Date(trip.departureTime)).toDateString())
    );
  }, [trips, from, to]);

  // تقسيم المدن حسب الدولة
  const groupedLocations = useMemo(() => {
    if (!locations) return { saudi: [], syria: [], others: [] };
    
    return locations.reduce((acc: any, loc) => {
      const country = loc.country || "";
      if (country.includes("سعود") || country.toLowerCase().includes("saudi")) {
        acc.saudi.push(loc);
      } else if (country.includes("سور") || country.toLowerCase().includes("syria")) {
        acc.syria.push(loc);
      } else {
        acc.others.push(loc);
      }
      return acc;
    }, { saudi: [], syria: [], others: [] });
  }, [locations]);

  const isSaudi = (locationName: string) => {
    return groupedLocations.saudi.some((l: any) => l.name === locationName);
  };

  const isSyrian = (locationName: string) => {
    return groupedLocations.syria.some((l: any) => l.name === locationName);
  };

  // تصفية الوجهات بناءً على مدينة الانطلاق
  const availableDestinations = useMemo(() => {
    if (!from) return locations || [];
    
    if (isSaudi(from)) {
      return [...groupedLocations.syria, ...groupedLocations.others];
    } else if (isSyrian(from)) {
      return [...groupedLocations.saudi, ...groupedLocations.others];
    }
    return locations || [];
  }, [from, groupedLocations, locations]);

  useEffect(() => {
    if (from && to) {
      const fromIsSaudi = isSaudi(from);
      const toIsSaudi = isSaudi(to);
      const fromIsSyria = isSyrian(from);
      const toIsSyria = isSyrian(to);

      if ((fromIsSaudi && toIsSaudi) || (fromIsSyria && toIsSyria)) {
        setTo("");
      }
    }
    // تصفير التاريخ عند تغيير المسار لضمان اختيار تاريخ متاح للمسار الجديد
    setDate(undefined);
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
                <Select onValueChange={setFrom} value={from} disabled={isLocationsLoading}>
                  <SelectTrigger id="from" className="bg-background border-primary/10 h-14 rounded-xl focus:ring-accent shadow-sm transition-all hover:border-primary/30">
                    <SelectValue placeholder={isLocationsLoading ? "جاري التحميل..." : "اختر مدينة الانطلاق"} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedLocations.saudi.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>المملكة العربية السعودية</SelectLabel>
                        {groupedLocations.saudi.map((city: any) => (
                          <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {groupedLocations.syria.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>الجمهورية العربية السورية</SelectLabel>
                        {groupedLocations.syria.map((city: any) => (
                          <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {groupedLocations.others.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>وجهات أخرى</SelectLabel>
                        {groupedLocations.others.map((city: any) => (
                          <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="to" className="text-sm font-semibold pr-1">إلى الوجهة</Label>
                <Select onValueChange={setTo} value={to} disabled={!from || isLocationsLoading}>
                  <SelectTrigger id="to" className="bg-background border-primary/10 h-14 rounded-xl focus:ring-accent shadow-sm transition-all hover:border-primary/30">
                    <SelectValue placeholder={from ? "اختر مدينة الوصول" : "اختر مدينة الانطلاق أولاً"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDestinations.map((city: any) => (
                      <SelectItem key={city.id} value={city.name}>{city.name} - {city.country}</SelectItem>
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
                    disabled={!from || !to}
                  >
                    <CalendarIcon className="ml-3 h-5 w-5 text-primary opacity-70" />
                    {date ? format(date, "PPP", { locale: ar }) : <span>{(!from || !to) ? "اختر المسار أولاً لعرض التواريخ" : "اختر تاريخاً تتوفر فيه رحلات"}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-primary/10 shadow-2xl" align="center" sideOffset={10}>
                  <div className="p-3 bg-primary/5 text-[10px] text-center text-primary font-bold border-b">
                    التواريخ المظللة بالزمردي تحتوي على رحلات متاحة
                  </div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={ar}
                    className="rounded-2xl border-none"
                    disabled={(date) => {
                      const today = startOfDay(new Date());
                      const isPast = date < today;
                      const hasNoTrip = !availableTripDates.has(startOfDay(date).toDateString());
                      return isPast || hasNoTrip;
                    }}
                    classNames={{
                      day_selected: "bg-primary text-white hover:bg-primary/90 focus:bg-primary font-bold rounded-lg",
                      day_today: "bg-accent/10 text-accent border border-accent/20 rounded-lg",
                      day: "h-10 w-10 text-sm font-medium hover:bg-primary/5 rounded-lg transition-colors",
                      head_cell: "text-muted-foreground w-10 font-bold text-[0.8rem] pb-4",
                    }}
                  />
                </PopoverContent>
              </Popover>
              {from && to && availableTripDates.size === 0 && !isTripsLoading && (
                <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1 pr-1">
                  <Info className="h-3 w-3" /> لا توجد رحلات مجدولة حالياً لهذا المسار
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/95 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.98] rounded-xl" 
              disabled={!from || !to || !date || isLocationsLoading}
            >
              {isLocationsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "بحث عن الرحلات المتاحة"}
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
