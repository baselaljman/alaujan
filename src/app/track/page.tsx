"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Bus, Clock, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);

  const handleTrack = () => {
    if (trackingId) setIsTracking(true);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold font-headline text-primary">Live Tracking</h1>
        <p className="text-muted-foreground">Monitor your bus or parcel in real-time</p>
      </header>

      <Tabs defaultValue="bus" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="bus" className="gap-2">
            <Bus className="h-4 w-4" /> Trip
          </TabsTrigger>
          <TabsTrigger value="parcel" className="gap-2">
            <Clock className="h-4 w-4" /> Parcel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bus" className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Enter Trip Number</CardTitle>
              <CardDescription>Found on your ticket or confirmation SMS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., AWJ-9923"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="h-12"
                />
                <Button onClick={handleTrack} className="h-12 px-6">
                  <Search className="h-4 w-4 mr-2" /> Track
                </Button>
              </div>
            </CardContent>
          </Card>

          {isTracking && (
            <div className="space-y-4 animate-in slide-in-from-bottom-4">
              <Card className="overflow-hidden border-primary/20">
                <div className="h-48 bg-muted flex items-center justify-center relative bg-[url('https://picsum.photos/seed/map/600/300')] bg-cover">
                  <div className="absolute top-1/2 left-1/3 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 animate-ping h-8 w-8 rounded-full bg-primary/40" />
                      <div className="h-6 w-6 rounded-full bg-primary border-4 border-white shadow-lg relative z-10 flex items-center justify-center">
                        <Bus className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <Badge className="absolute bottom-4 left-4 bg-white/90 text-primary hover:bg-white/95">
                    Live Location
                  </Badge>
                </div>
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-muted-foreground">Currently near</p>
                      <h3 className="font-bold text-lg">Irbid, Jordan</h3>
                    </div>
                    <Badge variant="outline" className="text-accent border-accent">On Time</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Destination</p>
                        <p className="font-medium">Damascus, Syria</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                        <p className="font-medium">Tonight, 11:30 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg flex gap-2">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>Bus is crossing the border shortly. Delays are possible depending on traffic.</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="parcel">
          <Card>
            <CardHeader>
              <CardTitle>Track Parcel</CardTitle>
              <CardDescription>Enter your tracking ID for package updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="PRC-44552" className="h-12" />
                <Button className="h-12">Track</Button>
              </div>
              <div className="p-8 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                Enter ID to see parcel journey
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
