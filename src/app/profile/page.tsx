
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Ticket, Heart, Bell, ChevronLeft, Bus, ShieldAlert, Loader2, Mail, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  // جلب بيانات ملف المستخدم الشخصي
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // جلب حجوزات المستخدم
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, "bookings"), where("userId", "==", user.uid));
  }, [firestore, user?.uid]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك من الحساب بنجاح.",
      });
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء محاولة تسجيل الخروج.",
      });
    }
  };

  if (isUserLoading || isProfileLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline text-primary">حسابي الشخصي</h1>
      </header>

      <div className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm border border-primary/5">
        <Avatar className="h-20 w-20 border-2 border-primary/10">
          <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
          <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-8 w-8" /></AvatarFallback>
        </Avatar>
        <div className="flex-1 text-right">
          <h2 className="text-xl font-bold text-primary">
            {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "مسافر العوجان"}
          </h2>
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <p className="text-xs">{profile?.email || "لم يتم ربط البريد بعد"}</p>
          </div>
          <Badge variant="secondary" className="mt-2 bg-accent/10 text-accent hover:bg-accent/20 border-none font-bold">
            عضو ذهبي
          </Badge>
        </div>
      </div>

      <Card className="border-none bg-primary/5 shadow-none rounded-3xl overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-primary">لوحة إدارة النظام</p>
              <p className="text-[10px] text-muted-foreground">خاص بمسؤولي الشركة</p>
            </div>
          </div>
          <Button asChild size="sm" className="rounded-xl bg-primary hover:bg-primary/90">
            <Link href="/admin">دخول</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-lg text-primary">رحلاتي القادمة</h3>
          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-full">{bookings?.length || 0} حجوزات</span>
        </div>
        
        {isBookingsLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="border-none shadow-sm ring-1 ring-primary/5 bg-white/50 hover:bg-white transition-colors rounded-2xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                      <Bus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-primary">حجز {booking.numberOfSeats} مقاعد</p>
                      <p className="text-[10px] text-muted-foreground">تاريخ الحجز: {new Date(booking.bookingDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                  <Badge className={booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-muted text-muted-foreground'}>
                    {booking.status === 'Confirmed' ? 'مؤكد' : booking.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
            <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد حجوزات نشطة حالياً</p>
            <Button variant="link" asChild className="text-primary font-bold mt-2">
              <Link href="/">احجز رحلتك الأولى الآن</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4">
        <Button variant="ghost" className="w-full justify-between h-14 bg-white border rounded-2xl hover:bg-primary/5 transition-colors group">
          <div className="flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">أرشيف التذاكر السابقة</span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" className="w-full justify-between h-14 bg-white border rounded-2xl hover:bg-primary/5 transition-colors group">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-bold text-sm">الوجهات المفضلة</span>
          </div>
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <Button 
        variant="outline" 
        onClick={handleLogout}
        className="w-full h-14 rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/5 transition-colors font-bold mt-6"
      >
        <LogOut className="h-5 w-5 ml-2" /> تسجيل الخروج من الحساب
      </Button>
    </div>
  );
}
