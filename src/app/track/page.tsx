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
        const position = { lat: trip.currentLat || 24.7136, lng: trip.currentLng || 46.6753 };
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
          });
        } else {
          googleMapRef.current.panTo(position);
          markerRef.current?.setPosition(position);
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

      <div className="space-y-4">
        <Card className="rounded-3xl shadow-lg border-primary/10">
          <CardHeader className="text-right">
            <CardTitle className="text-lg font-black">أدخل رمز التتبع</CardTitle>
            <CardDescription>مثل: aw001 (يقبل أحرف كبيرة أو صغيرة)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="aw001"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="h-14 rounded-2xl text-center font-black"
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
              <Button onClick={handleTrack} disabled={isLoading} className="h-14 px-8 rounded-2xl bg-primary shadow-xl">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تتبع"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeTrackingId && !isLoading && !trip && (
          <div className="text-center p-12 bg-red-50 text-red-600 rounded-3xl border border-red-100">
            <p className="font-bold">عذراً، لم يتم العثور على رحلة بهذا الرمز.</p>
          </div>
        )}

        {trip && (
          <Card className="overflow-hidden border-primary/20 shadow-xl rounded-[2.5rem]">
            <div className="h-80 bg-muted relative">
              {(trip.isLive || trip.status === "Departed") ? (
                <div ref={mapRef} className="absolute inset-0 w-full h-full" />
              ) : (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 gap-3">
                  <p className="text-white font-black text-xl">بث الموقع غير متاح حالياً</p>
                </div>
              )}
              <Badge className="absolute top-6 right-6 font-black bg-primary">{trip.status}</Badge>
            </div>
            <CardContent className="p-8 space-y-4 text-right">
              <div className="flex justify-between items-center border-b pb-4">
                <div><p className="text-xs text-muted-foreground">من</p><p className="font-black">{trip.originName}</p></div>
                <div><p className="text-xs text-muted-foreground">إلى</p><p className="font-black">{trip.destinationName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center"><MapPin className="h-5 w-5 text-primary" /></div>
                <div><p className="text-xs text-muted-foreground">الموقع الحالي</p><p className="font-bold">{trip.currentLocationDescription || "غير محدد"}</p></div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}