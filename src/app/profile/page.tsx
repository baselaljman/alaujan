
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  LogOut, 
  Ticket, 
  Heart, 
  Bell, 
  ChevronLeft, 
  Bus, 
  LayoutDashboard,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const bookings = [
    { id: "AWJ-BK-001", route: "الرياض إلى عمان", date: "12 ديسمبر 2023", status: "قادمة" },
    { id: "AWJ-BK-002", route: "عمان إلى دمشق", date: "20 نوفمبر 2023", status: "مكتملة" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">حسابي</h1>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-primary/5">
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          <AvatarImage src="https://picsum.photos/seed/user/200" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-right">
          <h2 className="text-lg font-bold">جون دو</h2>
          <p className="text-sm text-muted-foreground">john.doe@example.com</p>
          <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary">عضو ذهبي</Badge>
        </div>
      </div>

      {/* قسم الإدارة للمسؤولين */}
      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm">لوحة تحكم المسؤول</p>
              <p className="text-[10px] text-muted-foreground">إدارة الرحلات، المدن، والحافلات</p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/admin">دخول</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-base px-1">حجوزاتي</h3>
        {bookings.map((booking) => (
          <Card key={booking.id} className="overflow-hidden border-none shadow-sm ring-1 ring-border hover:ring-primary/30 transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${booking.status === 'قادمة' ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Bus className={`h-5 w-5 ${booking.status === 'قادمة' ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{booking.route}</p>
                  <p className="text-xs text-muted-foreground">{booking.date}</p>
                </div>
              </div>
              <div className="text-left">
                <Badge className={booking.status === 'قادمة' ? 'bg-primary' : 'bg-muted text-muted-foreground'}>
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
            <span>التذاكر السابقة</span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" className="w-full justify-between h-14 bg-white hover:bg-muted border border-transparent hover:border-border rounded-xl">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <span>التنبيهات</span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" className="w-full justify-between h-14 bg-white hover:bg-muted border border-transparent hover:border-border rounded-xl">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <span>المسارات المحفوظة</span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Button variant="outline" className="w-full h-14 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5 hover:text-destructive mt-4">
        <LogOut className="h-5 w-5 ml-2" />
        تسجيل الخروج
      </Button>
    </div>
  );
}
