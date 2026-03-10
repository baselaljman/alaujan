
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
import { Badge } from "@/components/ui/badge";
import { format, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, MapPin, Bus, Search, Package, Loader2, Info, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const firestore = useFirestore();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState<Date>();

  const locationsRef = useMemoFirebase(() => collection(firestore, "locations"), [firestore]);
  const { data: locations, isLoading: isLocationsLoading } = useCollection(locationsRef);

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  // وظيفة مساعدة للحصول على كافة النقاط التي تمر بها الرحلة بالترتيب
  const getTripPath = (trip: any) => {
    return [
      trip.originName,
      ...(trip.intermediateStops?.map((s: any) => s.name) || []),
      trip.destinationName
    ];
  };

  const availableTripDates = useMemo(() => {
    if (!trips) return new Set<string>();
    
    return new Set(
      trips
        .filter(trip => {
          if (from && to) {
            const path = getTripPath(trip);
            const fromIndex = path.indexOf(from);
            const toIndex = path.indexOf(to);
            // يجب أن تكون المدينة "من" موجودة وتسبق المدينة "إلى" في المسار
            return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
          }
          return true;
        })
        .map(trip => startOfDay(new Date(trip.departureTime)).toDateString())
    );
  }, [trips, from, to]);

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

  // تحديد الوجهات المتاحة بناءً على الرحلات الفعلية الموجودة في النظام
  const availableDestinations = useMemo(() => {
    if (!from || !trips || !locations) return locations || [];
    
    const possibleDestinations = new Set<string>();
    trips.forEach(trip => {
      const path = getTripPath(trip);
      const fromIndex = path.indexOf(from);
      if (fromIndex !== -1) {
        // إضافة جميع المدن التي تلي مدينة الانطلاق في هذا المسار
        path.slice(fromIndex + 1).forEach(city => possibleDestinations.add(city));
      }
    });

    return locations.filter(loc => possibleDestinations.has(loc.name));
  }, [from, trips, locations]);

  useEffect(() => {
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
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-primary font-headline tracking-tight text-right">العوجان للسياحة والسفر</h1>
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
            <Globe className="h-2.5 w-2.5" /> alaujantravel.com
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
          <Bus className="h-6 w-6 text-primary" />
        </div>
      </header>

      <div className="relative h-56 w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-primary/5">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint="luxury bus"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-8">
          <Badge className="w-fit mb-3 bg-accent/90 text-white border-none text-[10px] font-bold px-4">أهلاً بك في العوجان</Badge>
          <p className="text-white font-black text-2xl shadow-sm leading-tight text-right">سفريات دولية آمنة ومريحة</p>
        </div>
      </div>

      <Card className="shadow-2xl border-none ring-1 ring-primary/10 bg-white/70 backdrop-blur-md rounded-[2.5rem]">
        <CardHeader className="text-right">
          <CardTitle className="text-xl font-headline flex items-center justify-end gap-2 text-primary">
            ابحث عن رحلتك
            <Search className="h-5 w-5" />
          </CardTitle>
          <CardDescription className="text-xs">حدد وجهتك الدولية وتاريخ السفر</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <Label htmlFor="from" className="text-sm font-bold pr-1">من مدينة الانطلاق</Label>
                <Select onValueChange={setFrom} value={from} disabled={isLocationsLoading}>
                  <SelectTrigger id="from" className="bg-background border-primary/10 h-14 rounded-2xl focus:ring-accent shadow-sm transition-all hover:border-primary/30 text-right">
                    <SelectValue placeholder={isLocationsLoading ? "جاري التحميل..." : "اختر مدينة الانطلاق"} />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedLocations.saudi.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-right">المملكة العربية السعودية</SelectLabel>
                        {groupedLocations.saudi.map((city: any) => (
                          <SelectItem key={city.id} value={city.name} className="text-right justify-end">{city.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {groupedLocations.syria.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-right">الجمهورية العربية السورية</SelectLabel>
                        {groupedLocations.syria.map((city: any) => (
                          <SelectItem key={city.id} value={city.name} className="text-right justify-end">{city.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {groupedLocations.others.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-right">وجهات أخرى</SelectLabel>
                        {groupedLocations.others.map((city: any) => (
                          <SelectItem key={city.id} value={city.name} className="text-right justify-end">{city.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="to" className="text-sm font-bold pr-1">إلى الوجهة</Label>
                <Select onValueChange={setTo} value={to} disabled={!from || isLocationsLoading}>
                  <SelectTrigger id="to" className="bg-background border-primary/10 h-14 rounded-2xl focus:ring-accent shadow-sm transition-all hover:border-primary/30 text-right">
                    <SelectValue placeholder={from ? "اختر مدينة الوصول" : "اختر مدينة الانطلاق أولاً"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDestinations.map((city: any) => (
                      <SelectItem key={city.id} value={city.name} className="text-right justify-end">{city.name} - {city.country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label className="text-sm font-bold pr-1">تاريخ السفر</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-end text-right font-normal bg-background border-primary/10 h-14 rounded-2xl shadow-sm transition-all hover:border-primary/30 hover:bg-white",
                      !date && "text-muted-foreground"
                    )}
                    disabled={!from || !to}
                  >
                    {date ? format(date, "PPP", { locale: ar }) : <span>{(!from || !to) ? "اختر المسار أولاً" : "اختر تاريخاً"}</span>}
                    <CalendarIcon className="mr-3 h-5 w-5 text-primary opacity-70" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-primary/10 shadow-2xl" align="center" sideOffset={10}>
                  <div className="p-3 bg-accent/10 text-[10px] text-center text-accent font-bold border-b">
                    التواريخ المظللة باللون الذهبي تحتوي على رحلات متاحة
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
                    modifiers={{
                      available: (date) => availableTripDates.has(startOfDay(date).toDateString())
                    }}
                    modifiersClassNames={{
                      available: "bg-accent text-accent-foreground font-bold hover:bg-accent/80"
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
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 text-lg font-black bg-primary hover:bg-primary/95 transition-all shadow-xl hover:scale-[1.01] active:scale-[0.98] rounded-2xl" 
              disabled={!from || !to || !date || isLocationsLoading}
            >
              {isLocationsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "بحث عن الرحلات المتاحة"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto flex-col py-8 gap-3 border-primary/10 hover:border-primary/40 bg-white shadow-sm transition-all hover:bg-white rounded-[2rem]" asChild>
          <Link href="/track">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/5">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold">تتبع الرحلة</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col py-8 gap-3 border-primary/10 hover:border-primary/40 bg-white shadow-sm transition-all hover:bg-white rounded-[2rem]" asChild>
          <Link href="/parcels">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center border border-primary/5">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <span className="font-bold">تتبع الطرود</span>
          </Link>
        </Button>
      </div>

      <footer className="text-center pt-8 pb-4 opacity-40">
        <p className="text-[9px] font-bold uppercase tracking-tighter">© 2024 Al-Awajan Travel | alaujantravel.com</p>
      </footer>
    </div>
  );
}
