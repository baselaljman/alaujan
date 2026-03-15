
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
  Smartphone,
  Clock,
  Navigation,
  MapPin
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
      return query(
        bookingsRef, 
        where("userEmail", "==", userEmail),
        limit(50)
      );
    }
    
    return query(
      bookingsRef,
      where("userId", "==", user.uid),
      limit(50)
    );
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

  if (isUserLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" />
      <p className="text-[10px] font-bold text-muted-foreground animate-pulse">جاري التحقق...</p>
    </div>
  );

  const isGuest = !user || user.isAnonymous;
  const hasBookings = bookings && bookings.length > 0;

  return (
    <div className="space-y-8 pb-24 text-right">
      <div className="max-w-4xl mx-auto space-y-10">
        {!isGuest && (
          <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-primary/5 no-print">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-12 w-12" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-right space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{profile?.firstName || "مسافر"} {profile?.lastName || "العوجان"}</h2>
                <div className="flex items-center justify-center md:justify-end gap-2 text-slate-500 font-bold text-sm">
                  <Mail className="h-3 w-3" /> {user.email || profile?.email}
                </div>
                <div className="flex items-center justify-center md:justify-end gap-2 mt-2">
                  <Badge className="bg-primary px-5 py-2 rounded-full">{isAdmin ? "إدارة عليا" : "عضوية ذهبية"}</Badge>
                </div>
              </div>
            </div>
          </section>
        )}

        {isAdmin && (
          <Card className="bg-primary text-primary-foreground shadow-2xl rounded-[3rem] no-print">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <ShieldCheck className="h-12 w-12" />
                <div className="text-right">
                  <h2 className="text-2xl font-black">مركز التحكم الإداري</h2>
                  <p className="text-xs opacity-70">إدارة الأسطول والركاب والطرود</p>
                </div>
              </div>
              <Button asChild className="rounded-[1.5rem] bg-white text-primary px-10 h-16 shadow-2xl font-black hover:bg-slate-50">
                <Link href="/admin">دخول لوحة الإدارة</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="space-y-8">
          <div className="flex items-center justify-between px-4 no-print">
            <h3 className="font-black text-2xl flex items-center gap-3 text-primary"><TicketIcon className="h-6 w-6" /> تذاكر السفر</h3>
            {hasBookings && <Badge variant="secondary" className="px-4 py-1.5 rounded-xl bg-primary/5 text-primary border-primary/10">{bookings.length} تذكرة</Badge>}
          </div>
          
          {isBookingsLoading ? (
            <div className="flex justify-center p-20 opacity-20 no-print"><Loader2 className="animate-spin h-12 w-12" /></div>
          ) : hasBookings ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {bookings.map((booking) => (
                <div key={booking.id} className="relative group">
                  <div ref={el => { ticketRefs.current[booking.id] = el; }} className="bg-white shadow-2xl rounded-[3.5rem] overflow-hidden border border-primary/5 print-area">
                    <div className="p-8 flex items-center justify-between bg-primary/5">
                      <div className="flex items-center gap-3">
                         <Bus className="h-6 w-6 text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Al-Awajan Official Pass</span>
                      </div>
                      <Badge className={cn(
                        "font-black px-4 py-1 rounded-full border-none",
                        booking.paymentStatus === "Completed" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                      )}>
                        {booking.paymentStatus === "Completed" ? "حجز مؤكد" : "بانتظار الدفع"}
                      </Badge>
                    </div>
                    
                    <div className="p-8 space-y-8">
                       <div className="flex items-center justify-between text-center px-4">
                         <div className="flex-1">
                           <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">من (From)</p>
                           <p className="font-black text-xl text-slate-900">{booking.boardingPoint}</p>
                         </div>
                         <div className="px-4 flex flex-col items-center gap-1 opacity-20">
                           <ArrowLeft className="h-4 w-4" />
                           <Bus className="h-4 w-4" />
                         </div>
                         <div className="flex-1">
                           <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase">إلى (To)</p>
                           <p className="font-black text-xl text-slate-900">{booking.droppingPoint}</p>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-8 border-t border-dashed border-slate-100">
                          <div>
                             <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 justify-end">اسم المسافر الرئيسي</p>
                             <p className="font-bold text-slate-900 truncate">{booking.passengers?.[0]?.fullName}</p>
                          </div>
                          <div className="text-left">
                             <p className="text-[10px] font-bold text-muted-foreground">رقم المقعد</p>
                             <p className="font-black text-primary text-xl">#{booking.seatNumbers?.join(', ')}</p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 justify-end">تاريخ السفر <Clock className="h-2 w-2" /></p>
                             <p className="font-black text-slate-900 text-sm">
                               {booking.departureTime ? format(new Date(booking.departureTime), "PPP", { locale: ar }) : "قيد التحديث"}
                             </p>
                          </div>
                          <div className="text-left">
                             <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">وقت التحرك</p>
                             <p className="font-black text-primary text-lg">
                               {booking.departureTime ? format(new Date(booking.departureTime), "p", { locale: ar }) : "قيد التحديث"}
                             </p>
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-muted-foreground">رقم الرحلة</p>
                             <p className="font-black text-accent font-mono text-base uppercase">{booking.busTripId}</p>
                          </div>
                          <div className="text-left">
                             <p className="text-[10px] font-bold text-muted-foreground">رقم التتبع (REF)</p>
                             <p className="font-black text-primary font-mono text-base">{booking.trackingNumber}</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-8 border-t-2 border-slate-50">
                          <div className="space-y-1">
                             <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Al-Awajan Digital Ticket</p>
                             <p className="text-[10px] font-bold text-slate-400">تاريخ الحجز: {booking.bookingDate ? format(new Date(booking.bookingDate), "PP", { locale: ar }) : ""}</p>
                          </div>
                          <QrCode className="h-14 w-14 text-slate-800" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-center mt-6 no-print">
                    <Button 
                      variant="outline"
                      onClick={() => window.print()} 
                      className="rounded-xl h-12 px-6 bg-white text-primary border-primary/10 font-black gap-2"
                    >
                      <Printer className="h-4 w-4" /> طباعة
                    </Button>
                    <Button 
                      onClick={() => downloadTicket(booking.id)} 
                      disabled={isDownloading === booking.id} 
                      className="rounded-xl h-12 px-6 bg-slate-900 text-white font-black gap-2 shadow-lg"
                    >
                      {isDownloading === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} 
                      تحميل التذكرة
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-24 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100 no-print">
              <TicketIcon className="h-16 w-16 text-slate-100 mx-auto mb-6" />
              <p className="text-sm text-slate-400 font-black">لا توجد حجوزات مسجلة ببريدك</p>
              <Button asChild variant="link" className="mt-4 text-primary font-bold">
                 <Link href="/">ابدأ رحلتك الأولى مع العوجان</Link>
              </Button>
            </div>
          )}
        </section>

        {isGuest && (
          <section className="max-w-md mx-auto pt-10 no-print">
            <Card className="rounded-[2.5rem] overflow-hidden shadow-2xl border-primary/5 bg-primary/5">
              <CardContent className="p-8">
                <div className="flex flex-col items-center mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-xl">
                    <UserCheck className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-xl font-black text-primary">تأمين تذاكر السفر</h2>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1 text-center">قم بإنشاء حساب ببريدك الإلكتروني لضمان الوصول لتذاكرك من أي هاتف آخر.</p>
                </div>
                
                <form onSubmit={handleAuthAction} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold">البريد الإلكتروني</Label>
                    <Input type="email" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-xl h-12 bg-white" required />
                  </div>
                  {authMode !== 'forgot' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">كلمة المرور</Label>
                      <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="rounded-xl h-12 bg-white" required />
                    </div>
                  )}
                  <Button type="submit" className="w-full h-14 rounded-xl text-base font-black shadow-lg">
                    {authMode === 'login' ? 'دخول النظام' : authMode === 'register' ? 'اشترك الآن' : 'استعادة كلمة المرور'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        {!isGuest && (
          <div className="pt-10 no-print">
            <Button variant="outline" onClick={handleLogout} className="w-full h-16 rounded-2xl text-red-600 border-red-50 font-black hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5 ml-2" /> تسجيل الخروج من الحساب
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
