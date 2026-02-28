"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, LogOut, Ticket, Heart, Bell, ChevronRight, Bus } from "lucide-react";

export default function ProfilePage() {
  const bookings = [
    { id: "AWJ-BK-001", route: "Riyadh to Amman", date: "Dec 12, 2023", status: "Upcoming" },
    { id: "AWJ-BK-002", route: "Amman to Damascus", date: "Nov 20, 2023", status: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">My Account</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-primary/5">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src="https://picsum.photos/seed/user/200" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-lg font-bold">John Doe</h2>
          <p className="text-sm text-muted-foreground">john.doe@example.com</p>
          <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">Gold Member</Badge>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-base px-1">My Bookings</h3>
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden border-none shadow-sm ring-1 ring-border hover:ring-primary/30 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${booking.status === 'Upcoming' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Bus className={`h-5 w-5 ${booking.status === 'Upcoming' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-bold text-sm">{booking.route}</p>
                  <p className="text-xs text-muted-foreground">{booking.date}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={booking.status === 'Upcoming' ? 'bg-primary' : 'bg-muted text-muted-foreground'}>
                  {booking.status}
                </Badge>
                <p className="text-[10px] text-muted-foreground mt-1">{booking.id}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-between h-14 bg-white hover:bg-muted border border-transparent hover:border-border rounded-xl">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary" />
            <span>Past Tickets</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" className="w-full justify-between h-14 bg-white hover:bg-muted border border-transparent hover:border-border rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <span>Notifications</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" className="w-full justify-between h-14 bg-white hover:bg-muted border border-transparent hover:border-border rounded-xl">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <span>Saved Routes</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Button variant="outline" className="w-full h-14 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive mt-4">
        <LogOut className="h-5 w-5 mr-2" />
        Sign Out
      </Button>
    </div>
  );
}
