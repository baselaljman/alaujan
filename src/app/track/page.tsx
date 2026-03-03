"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Bus, Clock, Info, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">التتبع المباشر</h1>
        <p className="text-muted-foreground">راقب رحلتك أو طردك في الوقت الحقيقي</p>
      </header>

      <Tabs defaultValue="bus" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="bus" className="gap-2">
            <Bus className="h-4 w-4" /> رحلة
          </TabsTrigger>
          <TabsTrigger value="parcel" className="gap-2">
            <Clock className="h-4 w-4" /> طرد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bus" className="space-y-4">
          <Card className="border-primary/10">
            <CardHeader className="pb-4 text-right">
              <CardTitle className="text-lg">تتبع الحافلة</CardTitle>
              <CardDescription>أدخل رقم الرحلة الموجود في تذكرتك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="مثلاً: AWJ-TRIP-TEST"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="h-12 rounded-xl"
                />
                <Button onClick={handleTrack} disabled={isLoading} className="h-12 px-8 rounded-xl bg-primary">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تتبع"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {trip && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="overflow-hidden border-primary/20 shadow-lg">
                <div className="h-48 bg-muted relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-1000" 
                    style={{ backgroundImage: `url('https://picsum.photos/seed/${trip.id}/800/400')` }}
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  
                  {(trip.status === "Departed" || trip.status === "Delayed") && (
                    <div className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="absolute -top-4 right-1/2 translate-x-1/2 animate-ping h-12 w-12 rounded-full bg-primary/40" />
                        <div className="h-8 w-8 rounded-full bg-primary border-4 border-white shadow-xl relative z-10 flex items-center justify-center">
                          <Bus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  )}

                  <Badge className="absolute bottom-4 right-4 bg-white/90 text-primary hover:bg-white text-xs py-1 px-3">
                    {trip.status === "Scheduled" && "رحلة مجدولة"}
                    {trip.status === "Departed" && "في الطريق حالياً"}
                    {trip.status === "Delayed" && "يوجد تأخير"}
                    {trip.status === "Arrived" && "تم الوصول"}
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-6 text-right">
                  {trip.status === "Scheduled" && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-primary">لم تبدأ الرحلة بعد</p>
                        <p className="text-xs text-muted-foreground">موعد الانطلاق: {new Date(trip.departureTime).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                  )}

                  {trip.status === "Delayed" && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-4 animate-pulse">
                      <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-6 w-6 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-red-700">تحديث من القائد: يوجد تأخير</p>
                        <p className="text-xs text-red-600">بسبب إجراءات الحدود أو حركة السير.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 relative">
                    <div className="absolute right-1/2 top-1/2 -translate-y-1/2 w-8 h-[2px] bg-muted-foreground/20 rotate-180" />
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">من</p>
                      <p className="font-bold text-lg">نقطة الانطلاق</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">إلى</p>
                      <p className="font-bold text-lg">الوجهة النهائية</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-dashed">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary/60" />
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground font-bold">الموقع الحالي</p>
                        <p className="text-sm font-medium">{trip.currentLocationDescription || "الموقع غير متوفر حالياً"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary/60" />
                      <div className="flex-1">
                        <p className="text-[10px] text-muted-foreground font-bold">الوصول المتوقع</p>
                        <p className="text-sm font-medium">{new Date(trip.arrivalTime).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="parcel">
           <Card className="border-primary/10">
            <CardHeader className="text-right">
              <CardTitle>تتبع طرد</CardTitle>
              <CardDescription>أدخل رقم تتبع الطرد للحصول على تحديثات الحالة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="PRC-44552" className="h-12 rounded-xl" />
                <Button className="h-12 px-8 rounded-xl bg-primary">تتبع</Button>
              </div>
              <div className="p-12 border-2 border-dashed rounded-2xl text-center text-muted-foreground bg-muted/20">
                أدخل الرقم لمشاهدة مسار طردك بين المدن
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
