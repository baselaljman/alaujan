
"use client"

import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Ticket, 
  ChevronLeft, 
  Bus, 
  Loader2, 
  User as UserIcon,
  KeyRound,
  Settings,
  ShieldCheck,
  Download,
  QrCode,
  ArrowLeft
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
  initiatePasswordReset,
  initiateUpdatePassword
} from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';

const ADMIN_EMAILS = ["atlob.co@gmail.com", "alaujantravel@gmail.com"];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "staff_permissions"), where("email", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: staffData } = useCollection(staffQuery);
  const isStaff = staffData && staffData.length > 0;
  
  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const email = user.email.toLowerCase();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.endsWith("@alawajan.com");
  }, [user]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // استعلام الحجوزات من المجموعة الموحدة العلوية - يمنع أخطاء التراخيص ويدعم الخصوصية عبر الـ Filter
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return query(collection(firestore, "bookings"), where("userId", "==", user.uid));
  }, [firestore, user?.uid, user?.isAnonymous]);
  
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "تم تسجيل الخروج" });
  };

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (authMode === 'login') {
      initiateEmailSignIn(auth, email, password);
    } else if (authMode === 'register') {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiatePasswordReset(auth, email);
    }
  };

  const downloadTicket = async (bookingId: string) => {
    const element = ticketRefs.current[bookingId];
    if (!element) return;
    setIsDownloading(bookingId);
    try {
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `Ticket-${bookingId.slice(-4)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ في التحميل" });
    } finally {
      setIsDownloading(null);
    }
  };

  if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary opacity-20" /></div>;

  const isGuest = !user || user.isAnonymous;

  return (
    <div className="space-y-8 pb-24 text-right">
      {isGuest ? (
        <div className="max-w-md mx-auto pt-4 space-y-8">
          <Card className="rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-8">
              <h1 className="text-2xl font-black text-center mb-8">بوابة العوجان</h1>
              <form onSubmit={handleAuthAction} className="space-y-6">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input type="email" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} className="rounded-2xl h-14" required />
                </div>
                {authMode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="rounded-2xl h-14" required />
                  </div>
                )}
                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-xl">
                  {authMode === 'login' ? 'دخول النظام' : authMode === 'register' ? 'تسجيل حساب جديد' : 'استعادة كلمة المرور'}
                </Button>
              </form>
              <div className="mt-8 text-center flex flex-col gap-3">
                {authMode === 'login' ? (
                  <button onClick={() => setAuthMode('register')} className="text-primary text-sm font-black underline">اشترك الآن</button>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-primary text-sm font-black underline">لديك حساب؟ سجل دخولك</button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-10">
          <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-primary/5">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-12 w-12" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-right space-y-2">
                <h2 className="text-2xl font-black text-slate-900">{profile?.firstName || "مسافر"} {profile?.lastName || "العوجان"}</h2>
                <p className="text-slate-500 font-bold text-sm">{user.email}</p>
                <Badge className="bg-primary px-5 py-2 rounded-full">{isAdmin ? "المدير العام" : isStaff ? "موظف معتمد" : "عضو مسجل"}</Badge>
              </div>
            </div>
          </section>

          {(isAdmin || isStaff) && (
            <Card className="bg-primary text-primary-foreground shadow-2xl rounded-[3rem]">
              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <ShieldCheck className="h-12 w-12" />
                  <div className="text-right">
                    <h2 className="text-2xl font-black">لوحة الإدارة المركزية</h2>
                  </div>
                </div>
                <Button asChild className="rounded-[1.5rem] bg-white text-primary px-10 h-16 shadow-2xl">
                  <Link href="/admin">دخول اللوحة الآن</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <section className="space-y-8">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-black text-2xl flex items-center gap-3"><Ticket className="h-6 w-6 text-primary" /> تذاكري</h3>
              <Badge variant="secondary" className="px-4 py-1.5 rounded-xl">{bookings?.length || 0} تذكرة</Badge>
            </div>
            
            {isBookingsLoading ? (
              <div className="flex justify-center p-20 opacity-20"><Loader2 className="animate-spin h-12 w-12" /></div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {bookings.map((booking) => (
                  <div key={booking.id} className="relative">
                    <div ref={el => { ticketRefs.current[booking.id] = el; }} className="bg-white shadow-2xl rounded-[3.5rem] overflow-hidden">
                      <div className="p-8 flex items-center justify-between bg-slate-50/30">
                        <Bus className="h-7 w-7 text-primary" />
                        <Badge className="bg-emerald-500 font-black">مؤكد</Badge>
                      </div>
                      <div className="p-8 space-y-10">
                         <div className="flex items-center justify-between text-center">
                           <p className="font-black text-xl">{booking.boardingPoint || "غير محدد"}</p>
                           <ArrowLeft className="h-5 w-5 opacity-30" />
                           <p className="font-black text-xl">{booking.droppingPoint || "غير محدد"}</p>
                         </div>
                         <div className="flex items-center justify-between pt-8 border-t border-dashed">
                            <p className="font-black text-lg text-accent font-mono">{booking.busTripId}</p>
                            <QrCode className="h-12 w-12 text-slate-200" />
                         </div>
                      </div>
                    </div>
                    <Button onClick={() => downloadTicket(booking.id)} disabled={isDownloading === booking.id} className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full h-14 px-8 bg-white text-slate-900 border-4 border-slate-900 font-black">
                      {isDownloading === booking.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-24 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
                <Ticket className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                <p className="text-sm text-slate-400 font-black">لا توجد حجوزات نشطة</p>
              </div>
            )}
          </section>

          {!isGuest && (
            <Button variant="outline" onClick={handleLogout} className="w-full h-20 rounded-[2rem] text-red-600 border-red-50 font-black">تسجيل الخروج</Button>
          )}
        </div>
      )}
    </div>
  );
}
