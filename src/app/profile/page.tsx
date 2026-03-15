
"use client"

import { useState, useMemo, useRef, useEffect } from "react";
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
  Calendar as CalendarIcon,
  LayoutDashboard,
  Shield
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
import { collection, query, where, doc, limit, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';
import { format } from "date-fns";
import { ar } from "date-fns/locale";

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
  const [isDriver, setIsDriver] = useState(false);
  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const isAdmin = useMemo(() => {
    if (!user?.email || user.isAnonymous) return false;
    const emailStr = user.email.toLowerCase();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === emailStr) || emailStr.endsWith("@alawajan.com");
  }, [user]);

  // التحقق مما إذا كان المستخدم سائقاً لعرض لوحة القائد
  useEffect(() => {
    async function checkDriver() {
      if (!user?.email || !firestore) return;
      const emailKey = user.email.toLowerCase().trim();
      
      // فحص مجموعة السائقين
      const driversRef = collection(firestore, "drivers");
      const q = query(driversRef, where("email", "==", emailKey));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsDriver(true);
      } else {
        // فحص ما إذا كان مرتبطاً بحافلة
        const busesRef = collection(firestore, "buses");
        const qBus = query(busesRef, where("driverEmail", "==", emailKey));
        const busSnapshot = await getDocs(qBus);
        if (!busSnapshot.empty) setIsDriver(true);
      }
    }
    if (user && !user.isAnonymous) checkDriver();
  }, [user, firestore]);

  const profileRef = useMemoFirebase(() => (user?.uid ? doc(firestore, "users", user.uid) : null), [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const emailToSearch = (user.email || profile?.email || "").toLowerCase().trim();
    if (emailToSearch) return query(collection(firestore, "bookings"), where("userEmail", "==", emailToSearch), limit(20));
    return query(collection(firestore, "bookings"), where("userId", "==", user.uid), limit(20));
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
    if (authMode === 'login') initiateEmailSignIn(auth, cleanEmail, password);
    else if (authMode === 'register') initiateEmailSignUp(auth, cleanEmail, password);
    else initiatePasswordReset(auth, cleanEmail);
  };

  const downloadTicket = async (id: string) => {
    const el = ticketRefs.current[id];
    if (!el) return;
    setIsDownloading(id);
    try {
      const url = await toPng(el, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Ticket-${id.slice(-4)}.png`;
      link.href = url;
      link.click();
    } catch (e) { toast({ variant: "destructive", title: "خطأ" }); } finally { setIsDownloading(null); }
  };

  if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-32 text-right">
      {user && !user.isAnonymous && (
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border shadow-sm">
              <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-8 w-8" /></AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-black">{profile?.firstName || "كابتن"} {profile?.lastName || "العوجان"}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                {isAdmin && <Badge className="bg-red-600 font-bold px-3">مسؤول النظام</Badge>}
                {isDriver && <Badge className="bg-primary font-bold px-3">قائد حافلة</Badge>}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-3">
        {isAdmin && (
          <Button asChild className="w-full h-14 rounded-2xl bg-slate-900 font-black shadow-lg gap-2">
            <Link href="/admin">
              <Shield className="h-5 w-5" /> دخول لوحة الإدارة
            </Link>
          </Button>
        )}

        {isDriver && (
          <Button asChild className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black shadow-xl gap-3 animate-pulse">
            <Link href="/driver">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bus className="h-5 w-5 text-white" />
              </div>
              فتح لوحة القائد وبدء البث المباشر
            </Link>
          </Button>
        )}
      </div>

      <section className="space-y-6">
        <h3 className="font-black text-xl text-primary flex items-center gap-2 justify-end">
          تذاكرك وحجوزاتك
          <TicketIcon className="h-5 w-5" />
        </h3>
        {isBookingsLoading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div> : bookings?.length ? (
          <div className="space-y-10">
            {bookings.map(booking => (
              <div key={booking.id} className="animate-in fade-in slide-in-from-bottom-2">
                <div ref={el => { ticketRefs.current[booking.id] = el; }} className="bg-white shadow-xl rounded-[2.5rem] overflow-hidden border print-area">
                  <div className="p-5 bg-primary/5 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2"><Bus className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase text-primary/60">Al-Awajan Official</span></div>
                    <Badge className="bg-emerald-600 font-black">حجز مؤكد</Badge>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between text-center border-b pb-6 border-dashed">
                      <div className="flex-1"><p className="text-[9px] font-bold text-muted-foreground mb-1">من</p><p className="font-black">{booking.boardingPoint}</p></div>
                      <div className="px-4 opacity-20"><ArrowLeft className="h-4 w-4" /></div>
                      <div className="flex-1"><p className="text-[9px] font-bold text-muted-foreground mb-1">إلى</p><p className="font-black">{booking.droppingPoint}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4 pt-4">
                      <div><p className="text-[9px] font-bold text-muted-foreground">المسافر</p><p className="font-black">{booking.passengers?.[0]?.fullName}</p></div>
                      <div className="text-left"><p className="text-[9px] font-bold text-muted-foreground">المقاعد</p><p className="font-black text-primary text-xl">#{booking.seatNumbers?.join(', ')}</p></div>
                      <div><p className="text-[9px] font-bold text-muted-foreground">التاريخ</p><p className="font-black">{booking.departureTime ? format(new Date(booking.departureTime), "d MMMM yyyy", { locale: ar }) : "قيد التأكيد"}</p></div>
                      <div className="text-left"><p className="text-[9px] font-bold text-muted-foreground">وقت التحرك</p><p className="font-black text-lg">{booking.departureTime ? format(new Date(booking.departureTime), "HH:mm", { locale: ar }) : "00:00"}</p></div>
                      <div><p className="text-[9px] font-black text-primary/50 uppercase">رمز التتبع الموحد (REF)</p><p className="font-black text-primary font-mono text-xl uppercase">{booking.busTripId}</p></div>
                      <div className="text-left"><p className="text-[9px] font-bold text-muted-foreground">رقم الحجز</p><p className="font-black text-xs text-muted-foreground">{booking.trackingNumber}</p></div>
                    </div>
                    <div className="flex justify-between pt-6 border-t border-slate-50">
                      <p className="text-[8px] text-slate-300">© Al-Awajan Travel</p>
                      <QrCode className="h-10 w-10 opacity-30" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center mt-4 no-print">
                   <Button variant="outline" className="h-12 rounded-xl" onClick={() => window.print()}>طباعة</Button>
                   <Button className="h-12 rounded-xl bg-primary" onClick={() => downloadTicket(booking.id)} disabled={isDownloading === booking.id}>{isDownloading === booking.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Download className="h-4 w-4 ml-2" />} تحميل صورة</Button>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed"><p className="text-muted-foreground font-bold">لا توجد تذاكر حالياً</p></div>}
      </section>

      {(!user || user.isAnonymous) && (
        <Card className="rounded-[2rem] bg-primary/5 p-8 text-right border-none shadow-sm animate-in zoom-in-95">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-2"><UserCheck className="h-6 w-6 text-white" /></div>
            <h2 className="text-xl font-black">دخول المسافرين والسائقين</h2>
            <p className="text-xs text-muted-foreground text-center">سجل دخولك لمشاهدة تذاكرك أو إدارة رحلاتك</p>
          </div>
          <form onSubmit={handleAuthAction} className="space-y-4">
            <div className="space-y-2"><Label>البريد</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl" /></div>
            {authMode !== 'forgot' && <div className="space-y-2"><Label>كلمة المرور</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" /></div>}
            <Button type="submit" className="w-full h-12 rounded-xl font-bold">{authMode === 'login' ? 'دخول' : 'تسجيل'}</Button>
            <Button type="button" variant="link" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full text-xs">{authMode === 'login' ? 'إنشاء حساب جديد' : 'لديك حساب؟ ادخل هنا'}</Button>
          </form>
        </Card>
      )}

      {user && !user.isAnonymous && (
        <Button variant="outline" onClick={handleLogout} className="w-full h-14 rounded-2xl text-red-600 font-bold border-red-100 hover:bg-red-50"><LogOut className="h-5 w-5 ml-2" /> تسجيل الخروج من الحساب</Button>
      )}
    </div>
  );
}
