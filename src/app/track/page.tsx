
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Bus, Clock, Info, AlertTriangle, CheckCircle2, Loader2, Navigation } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const firestore = useFirestore();

  const tripRef = useMemoFirebase(() => {
    if (!firestore || !activeTrackingId) return null;
    return doc(firestore, "busTrips", activeTrackingId);
  }, [firestore, activeTrackingId]);

  const { data: trip, isLoading } = useDoc(tripRef);

  const handleTrack = () => {
    if (!trackingId) return;
    setActiveTrackingId(trackingId);
  };

  // رابط الخريطة الحقيقي باستخدام مفتاح Google Maps المزود
  const GOOGLE_MAPS_KEY = "AIzaSyAwALad8_XPMoqQp1VhxoT_fFKTcLQ-9S4";
  
  const getMapUrl = () => {
    if (trip?.currentLat && trip?.currentLng) {
      // استخدام إحداثيات السائق الحقيقية
      return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${trip.currentLat},${trip.currentLng}&zoom=14`;
    }
    // في حالة عدم وجود إحداثيات، نعرض صورة خريطة ثابتة للمنطقة
    return `https://picsum.photos/seed/map-static/800/400`;
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">التتبع المباشر</h1>
        <p className="text-muted-foreground">راقب موقع الحافلة والوقت المتوقع للوصول</p>
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
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="pb-4 text-right">
              <CardTitle className="text-lg">أدخل رقم الرحلة</CardTitle>
              <CardDescription>ستجد الرقم في تذكرة الحجز الخاصة بك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="مثلاً: AWJ-TRIP-TEST"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="h-12 rounded-xl"
                />
                <Button onClick={handleTrack} disabled={isLoading} className="h-12 px-8 rounded-xl bg-primary shadow-lg">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تتبع الآن"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {trip && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="overflow-hidden border-primary/20 shadow-xl bg-white/80 backdrop-blur-md">
                <div className="h-72 bg-muted relative overflow-hidden border-b">
                  {trip.isLive ? (
                    <div className="absolute inset-0 w-full h-full">
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={getMapUrl()}
                        allowFullScreen
                      ></iframe>
                      <div className="absolute top-4 left-4 z-10">
                        <Badge className="bg-red-600 animate-pulse border-none shadow-lg">LIVE</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://picsum.photos/seed/${trip.id}/800/400')` }}>
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-6 gap-3">
                        <Bus className="h-12 w-12 text-white/50" />
                        <p className="text-white font-bold text-lg">بث الموقع المباشر غير نشط</p>
                        <p className="text-white/60 text-xs">ستظهر الخريطة فور انطلاق الحافلة وتفعيل السائق للـ GPS</p>
                      </div>
                    </div>
                  )}

                  <Badge className={cn(
                    "absolute top-4 right-4 text-xs py-1 px-3 shadow-lg",
                    trip.status === "Departed" ? "bg-green-600" : "bg-primary"
                  )}>
                    {trip.status === "Scheduled" && "بانتظار الانطلاق"}
                    {trip.status === "Departed" && "على الطريق الآن"}
                    {trip.status === "Delayed" && "تأخير في الرحلة"}
                    {trip.status === "Arrived" && "تم الوصول"}
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-6 text-right">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-2xl border text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">من</p>
                      <p className="font-bold text-sm">{trip.originName}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-2xl border text-center">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">إلى</p>
                      <p className="font-bold text-sm">{trip.destinationName}</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold">الموقع المباشر الحالي</p>
                        <p className="text-sm font-bold text-primary">{trip.currentLocationDescription || "الموقع يتم تحديثه من قبل السائق"}</p>
                        {trip.lastLocationUpdate && (
                          <p className="text-[9px] text-muted-foreground mt-1">
                            توقيت آخر إشارة: {new Date(trip.lastLocationUpdate).toLocaleTimeString('ar-EG')}
                          </p>
                        )}
                      </div>
                    </div>

                    {trip.status === "Delayed" && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <p className="text-xs font-bold text-red-700">تنبيه: تم تسجيل تأخير بسبب إجراءات الحدود</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-dashed">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground font-bold">موعد الوصول التقديري</p>
                        <p className="text-sm font-black text-primary">
                          {new Date(trip.arrivalTime).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="parcel">
           <Card className="border-primary/10 shadow-lg">
            <CardHeader className="text-right">
              <CardTitle className="text-lg">تتبع شحنتك</CardTitle>
              <CardDescription>أدخل رقم تتبع الطرد المكون من (AWJ-PRC-xxxx)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="AWJ-PRC-700123" className="h-12 rounded-xl" />
                <Button className="h-12 px-8 rounded-xl bg-primary shadow-lg">بحث</Button>
              </div>
              <div className="p-16 border-2 border-dashed rounded-3xl text-center text-muted-foreground bg-muted/10">
                <Navigation className="h-10 w-10 mx-auto mb-4 opacity-20" />
                أدخل الرقم لمشاهدة موقع الحافلة المحملة بطردك مباشرة
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
