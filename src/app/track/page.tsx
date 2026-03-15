
"use client"

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Bus, Clock, Info, Loader2, Navigation } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Loader } from "@googlemaps/js-api-loader";

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const firestore = useFirestore();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // جعل البحث غير حساس لحالة الأحرف (aw001 يقابل AW001)
  const tripRef = useMemoFirebase(() => {
    if (!firestore || !activeTrackingId) return null;
    return doc(firestore, "busTrips", activeTrackingId.toLowerCase().trim());
  }, [firestore, activeTrackingId]);

  const { data: trip, isLoading } = useDoc(tripRef);

  const handleTrack = () => {
    if (!trackingId) return;
    setActiveTrackingId(trackingId.trim());
  };

  const GOOGLE_MAPS_KEY = "AIzaSyAwALad8_XPMoqQp1VhxoT_fFKTcLQ-9S4";

  useEffect(() => {
    if (trip && (trip.isLive || trip.status === "Departed") && mapRef.current) {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_KEY,
        version: "weekly",
      });

      loader.load().then((google) => {
        const position = { 
          lat: trip.currentLat || 24.7136, 
          lng: trip.currentLng || 46.6753 
        };

        const busIcon = {
          url: "https://xn--ogbhrq.vip/wp-content/uploads/2026/03/bus-svgrepo-com-1.svg",
          scaledSize: new google.maps.Size(50, 50),
          anchor: new google.maps.Point(25, 25),
        };

        if (!googleMapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current!, {
            center: position,
            zoom: 15,
            mapId: "AL_AWAJAN_MAP",
            disableDefaultUI: true,
            zoomControl: true,
          });

          markerRef.current = new google.maps.Marker({
            position: position,
            map: googleMapRef.current,
            icon: busIcon,
            title: "حافلة العوجان",
            animation: google.maps.Animation.DROP,
          });
        } else {
          googleMapRef.current.panTo(position);
          markerRef.current?.setPosition(position);
          markerRef.current?.setIcon(busIcon);
        }
      });
    }
  }, [trip]);

  return (
    <div className="space-y-6 pb-20 text-right">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">التتبع المباشر</h1>
        <p className="text-muted-foreground text-sm font-bold">راقب موقع الحافلة برقم الرحلة (REF)</p>
      </header>

      <Tabs defaultValue="bus" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="bus" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bus className="h-4 w-4" /> تتبع رحلة
          </TabsTrigger>
          <TabsTrigger value="parcel" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">
            <Clock className="h-4 w-4" /> تتبع طرد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bus" className="space-y-4">
          <Card className="border-primary/10 shadow-lg rounded-3xl">
            <CardHeader className="pb-4 text-right">
              <CardTitle className="text-lg font-black">أدخل رمز التتبع</CardTitle>
              <CardDescription>مثل: aw001 (يقبل أحرف كبيرة أو صغيرة)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="مثلاً: aw001"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="h-14 rounded-2xl text-center font-black"
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                />
                <Button onClick={handleTrack} disabled={isLoading} className="h-14 px-8 rounded-2xl bg-primary shadow-xl font-bold">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "بحث وتتبع"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {activeTrackingId && !isLoading && !trip && (
            <div className="text-center p-12 bg-red-50 text-red-600 rounded-3xl border border-red-100 animate-in fade-in">
              <p className="font-bold">عذراً، لم يتم العثور على رحلة برمز "{activeTrackingId}"</p>
              <p className="text-[10px] mt-2 text-muted-foreground">تأكد من كتابة aw متبوعة برقم الرحلة المكون من 3 خانات.</p>
            </div>
          )}

          {trip && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="overflow-hidden border-primary/20 shadow-xl bg-white/80 backdrop-blur-md rounded-[2.5rem]">
                <div className="h-80 bg-muted relative overflow-hidden border-b">
                  {(trip.isLive || trip.status === "Departed") ? (
                    <div ref={mapRef} className="absolute inset-0 w-full h-full" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 gap-3">
                      <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center">
                        <Bus className="h-8 w-8 text-white/20" />
                      </div>
                      <p className="text-white font-black text-xl">بث الموقع غير متاح حالياً</p>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Awaiting Bus Movement</p>
                    </div>
                  )}

                  <Badge className={cn(
                    "absolute top-6 right-6 text-[10px] font-black py-2 px-4 shadow-2xl z-10",
                    trip.status === "Departed" ? "bg-emerald-600" : "bg-primary"
                  )}>
                    {trip.status === "Scheduled" && "بانتظار التحرك"}
                    {trip.status === "Departed" && "على الطريق الآن"}
                    {trip.status === "Arrived" && "تم الوصول"}
                  </Badge>
                </div>

                <CardContent className="p-8 space-y-8 text-right">
                  <div className="space-y-6 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-primary/10">
                    <div className="relative pr-10">
                      <div className="absolute right-2 top-1.5 h-4 w-4 rounded-full bg-primary border-4 border-white shadow-md" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase">نقطة الانطلاق</p>
                      <p className="text-xl font-black text-primary">{trip.originName}</p>
                    </div>
                    <div className="relative pr-10">
                      <div className="absolute right-2 top-1.5 h-4 w-4 rounded-full bg-emerald-600 border-4 border-white shadow-md" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase">الوجهة النهائية</p>
                      <p className="text-xl font-black text-emerald-700">{trip.destinationName}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase">الموقع الحالي</p>
                      <p className="text-base font-black text-primary">{trip.currentLocationDescription || "مركز الانطلاق"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
