
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Ticket, Heart, Bell, ChevronLeft, Bus, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // جلب حجوزات المستخدم (Fixed: Querying top-level collection)
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "bookings"), where("userId", "==", user.uid));
  }, [firestore, user?.uid]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline">حسابي</h1>
      </header>

      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 text-right">
          <h2 className="text-lg font-bold">{user?.email || "مسافر"}</h2>
          <Badge variant="secondary" className="mt-1">عضو ذهبي</Badge>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center"><ShieldAlert className="h-5 w-5 text-white" /></div>
            <div className="text-right"><p className="font-bold text-sm">لوحة الإدارة</p></div>
          </div>
          <Button asChild size="sm" className="rounded-xl"><Link href="/admin">دخول</Link></Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold text-base px-1">حجوزاتي</h3>
        {isBookingsLoading ? <Loader2 className="animate-spin mx-auto" /> : bookings?.map((booking) => (
          <Card key={booking.id} className="border-none shadow-sm ring-1 ring-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bus className="h-5 w-5 text-primary" />
                <div className="text-right">
                  <p className="font-bold text-sm">حجز {booking.seatNumbers?.length} مقاعد</p>
                  <p className="text-xs text-muted-foreground">{new Date(booking.bookingDate).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
              <Badge>{booking.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-between h-14 bg-white border rounded-xl">
          <div className="flex items-center gap-3"><Ticket className="h-5 w-5 text-primary" /><span>التذاكر السابقة</span></div>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <Button variant="outline" className="w-full h-14 rounded-xl text-destructive border-destructive/20 mt-4">
        <LogOut className="h-5 w-5 ml-2" /> تسجيل الخروج
      </Button>
    </div>
  );
}
