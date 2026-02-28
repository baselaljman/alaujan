"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, CheckCircle2, Truck, Box, MapPin } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ParcelsPage() {
  const [trackingId, setTrackingId] = useState("");
  const [isTracking, setIsTracking] = useState(false);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary font-headline">Parcel Service</h1>
        <p className="text-muted-foreground">Ship and track packages between cities</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Track Your Parcel</CardTitle>
          <CardDescription>Enter tracking number for status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., AWJ-PRC-772"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="h-12"
            />
            <Button onClick={() => setIsTracking(true)} className="h-12 px-6">
              <Search className="h-4 w-4 mr-2" /> Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {isTracking ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">AWJ-PRC-772</h3>
                    <p className="text-xs text-muted-foreground">Standard Delivery</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-accent">In Transit</p>
                  <p className="text-xs text-muted-foreground">Updated 1h ago</p>
                </div>
              </div>

              <div className="space-y-4">
                <Progress value={65} className="h-2" />
                <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <span>Riyadh</span>
                  <span>Amman</span>
                  <span>Damascus</span>
                </div>
              </div>

              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                <div className="relative pl-10 flex items-start gap-3">
                  <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                  <div>
                    <p className="text-sm font-bold">In Transit - Amman Hub</p>
                    <p className="text-xs text-muted-foreground">Arrived at sorting facility in Amman, Jordan</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Oct 24, 2023 • 09:30 AM</p>
                  </div>
                </div>
                <div className="relative pl-10 flex items-start gap-3">
                  <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-border" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">Departed Riyadh Main Hub</p>
                    <p className="text-xs text-muted-foreground">Oct 23, 2023 • 10:00 PM</p>
                  </div>
                </div>
                <div className="relative pl-10 flex items-start gap-3">
                  <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-border" />
                  <div>
                    <p className="text-sm font-bold text-muted-foreground">Package Received</p>
                    <p className="text-xs text-muted-foreground">Oct 23, 2023 • 02:15 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              <h4 className="font-bold text-sm">Fast Shipping</h4>
              <p className="text-xs text-muted-foreground">City to city in under 24 hours</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <Box className="h-8 w-8 text-primary" />
              <h4 className="font-bold text-sm">Secure Packing</h4>
              <p className="text-xs text-muted-foreground">Professional handling for fragile items</p>
            </CardContent>
          </Card>
          <Card className="bg-primary/5 border-none">
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              <h4 className="font-bold text-sm">Wide Network</h4>
              <span>Coverage in Riyadh, Jordan & Syria</span>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
