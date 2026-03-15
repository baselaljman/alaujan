
"use client"

import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Ticket as TicketIcon, 
  Bus, 
  Loader2, 
  User as UserIcon,
  ShieldCheck,
  Download,
  QrCode,
  ArrowLeft,
  Printer,
  Mail,
  UserCheck,
  MapPin,
  Calendar as CalendarIcon
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useDoc, 
  useMemoFirebase, 
  useAuth,
  initiateEmailSignIn,
  initiateEmailSignUp,
  initiatePasswordReset
} from "@/firebase";
import { collection, query, where, doc, limit } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const ADMIN_EMAILS = ["atlob.co@gmail.com", "alaujantravel@gmail.com"];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const isAdmin = useMemo(() => {
    if (!user?.email || user.isAnonymous) return false;
    const emailStr = user.email.toLowerCase();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === emailStr) || emailStr.endsWith("@alawajan.com");
  }, [user]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const bookingsRef = collection(firestore, "bookings");
    const userEmail = (user.email || profile?.email || "").toLowerCase().trim();
    if (userEmail) {
      return query(bookingsRef, where("userEmail", "==", userEmail), limit(50));
    }
    return query(bookingsRef, where("userId", "==", user.uid), limit(50));
  }, [firestore, user, profile?.email]);
  
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "تم تسجيل الخروج" });
  };

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const cleanEmail = email.toLowerCase().trim();
    if (authMode === 'login') {
      initiateEmailSignIn(auth, cleanEmail, password);
    } else if (authMode === 'register') {
      initiateEmailSignUp(auth, cleanEmail, password);
    } else {
      initiatePasswordReset(auth, cleanEmail);
    }
  };

  const downloadTicket = async (bookingId: string) => {
    const element = ticketRefs.current[bookingId];
    if (!element) return;
    setIsDownloading(bookingId);
    try {
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `AlAwajan-Ticket-${bookingId.slice(-4)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ في التحميل" });
    } finally {
      setIsDownloading(null);
    }
  };

  if (isUserLoading) return <div className="flex justify-center p-20 opacity-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  const isGuest = !user || user.isAnonymous;
  const hasBookings = bookings && bookings.length > 0;

  return (
    <div className="space-y-8 pb-32 text-right">
      {!isGuest && (
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-primary/5 no-print">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border shadow-lg">
              <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-10 w-10" /></AvatarFallback>
            </Avatar>
            <div className="text-right">
              <h2 className="text-xl font-black text-slate-900">{profile?.firstName || "كابتن"} {profile?.lastName || "العوجان"}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end"><Mail className="h-3 w-3" /> {user.email}</p>
              {isAdmin && <Badge className="mt-2 bg-primary">صلاحية إدارية</Badge>}
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <Button asChild className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black shadow-xl no-print">
          <Link href="/admin">دخول لوحة الإدارة <ShieldCheck className="mr-2 h-5 w-5" /></Link>
        </Button>
      )}

      <section className="space-y-6">
        <h3 className="font-black text-xl flex items-center gap-2 justify-end text-primary">تذاكر السفر <TicketIcon className="h-5 w-5" /></h3>
        
        {isBookingsLoading ? (
          <div className="flex justify-center p-20 opacity-20"><Loader2 className="animate-spin h-10 w-10" /></div>
        ) : hasBookings ? (
          <div className="grid grid-cols-1 gap-12">
            {bookings.map((booking) => (
              <div key={booking.id} className="relative">
                <div ref={el => { ticketRefs.current[booking.id] = el; }} className="bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-primary/5 print-area">
                  <div className="p-6 bg-primary/5 flex justify-between items-center border-b">
                     <div className="flex items-center gap-2">
                        <Bus className="h-5 w-5 text-primary" />
                        <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Official Travel Pass</span>
                     </div>
                     <Badge className="bg-emerald-600 font-black px-4">حجز مؤكد</Badge>
                  </div>
                  
                  <div className="p-8 space-y-8">
                     <div className="flex items-center justify-between text-center">
                        <div className="flex-1">
                           <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">من (FROM)</p>
                           <p className="font-black text-lg text-slate-900">{booking.boardingPoint}</p>
                        </div>
                        <div className="px-4 opacity-20"><ArrowLeft className="h-4 w-4" /></div>
                        <div className="flex-1">
                           <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">إلى (TO)</p>
                           <p className="font-black text-lg text-slate-900">{booking.droppingPoint}</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-y-6 pt-6 border-t border-dashed border-slate-100">
                        <div>
                           <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">اسم المسافر</p>
                           <p className="font-black text-slate-900">{booking.passengers?.[0]?.fullName || "مسافر"}</p>
                        </div>
                        <div className="text-left">
                           <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">المقاعد</p>
                           <p className="font-black text-primary text-xl">#{booking.seatNumbers?.join(', ')}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">تاريخ السفر</p>
                           <p className="font-black text-slate-900">
                             {booking.departureTime ? format(new Date(booking.departureTime), "d MMMM yyyy", { locale: ar }) : "قيد التأكيد"}
                           </p>
                        </div>
                        <div className="text-left">
                           <p className="text-[9px] font-bold text-muted-foreground mb-1 uppercase">وقت التحرك</p>
                           <p className="font-black text-primary text-lg">
                             {booking.departureTime ? format(new Date(booking.departureTime), "HH:mm", { locale: ar }) : "00:00"}
                           </p>
                        </div>
                        <div>
                           <p className="text-[9px] font-black text-primary/50 uppercase tracking-widest">تتبع الرحلة (REF)</p>
                           <p className="font-black text-primary font-mono text-xl uppercase">{booking.busTripId}</p>
                        </div>
                        <div className="text-left">
                           <p className="text-[9px] font-bold text-muted-foreground uppercase">رقم الحجز</p>
                           <p className="font-black text-muted-foreground font-mono">{booking.trackingNumber}</p>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-8 border-t-2 border-slate-50">
                        <div className="text-right">
                           <p className="text-[8px] font-black text-slate-300 uppercase">Al-Awajan Travel Official</p>
                           <p className="text-[10px] text-muted-foreground">صادرة في: {booking.bookingDate ? format(new Date(booking.bookingDate), "PP", { locale: ar }) : ""}</p>
                        </div>
                        <QrCode className="h-12 w-12 text-slate-800" />
                     </div>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-center mt-6 no-print">
                  <Button variant="outline" onClick={() => window.print()} className="rounded-xl h-12 px-6 font-black gap-2"><Printer className="h-4 w-4" /> طباعة</Button>
                  <Button onClick={() => downloadTicket(booking.id)} disabled={isDownloading === booking.id} className="rounded-xl h-12 px-6 bg-primary text-white font-black gap-2 shadow-lg">
                    {isDownloading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} تحميل الصورة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-16 bg-white rounded-[2.5rem] border-2 border-dashed no-print">
            <TicketIcon className="h-12 w-12 text-slate-100 mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-bold">لا توجد حجوزات نشطة حالياً</p>
            <Button asChild variant="link" className="mt-2 text-primary font-bold"><Link href="/">احجز رحلتك الأولى</Link></Button>
          </div>
        )}
      </section>

      {isGuest && (
        <section className="pt-10 no-print">
          <Card className="rounded-[2.5rem] overflow-hidden shadow-2xl border-primary/5 bg-primary/5">
            <CardContent className="p-8 text-right">
              <div className="flex flex-col items-center mb-6">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-4"><UserCheck className="h-6 w-6 text-white" /></div>
                <h2 className="text-xl font-black text-primary">تأمين تذاكرك</h2>
                <p className="text-[10px] text-muted-foreground font-bold mt-1 text-center">سجل دخولك لتتمكن من الوصول لتذاكرك من أي جهاز آخر.</p>
              </div>
              <form onSubmit={handleAuthAction} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold">البريد الإلكتروني</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-12 bg-white" required />
                </div>
                {authMode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">كلمة المرور</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl h-12 bg-white" required />
                  </div>
                )}
                <Button type="submit" className="w-full h-14 rounded-xl font-black shadow-lg">
                  {authMode === 'login' ? 'دخول النظام' : authMode === 'register' ? 'اشترك الآن' : 'استعادة كلمة المرور'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      )}

      {!isGuest && (
        <div className="pt-10 no-print">
          <Button variant="outline" onClick={handleLogout} className="w-full h-16 rounded-2xl text-red-600 border-red-50 font-black">
            <LogOut className="h-5 w-5 ml-2" /> تسجيل الخروج
          </Button>
        </div>
      )}
    </div>
  );
}
