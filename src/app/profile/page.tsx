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
  Mail, 
  User as UserIcon,
  KeyRound,
  Settings,
  ShieldCheck,
  Download,
  QrCode,
  UserCheck,
  Lock,
  PlusCircle,
  Smartphone,
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

  // استعلام صلاحيات الموظف - خاص بالمستخدم الحالي فقط
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "staff_permissions"), where("email", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: staffData } = useCollection(staffQuery);
  const isStaff = staffData && staffData.length > 0;
  
  // فحص ما إذا كان المستخدم مديراً عاماً
  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const email = user.email.toLowerCase();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.endsWith("@alawajan.com");
  }, [user]);

  // جلب بيانات البروفايل الإضافية
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // استعلام الحجوزات: خاص بالمستخدم الحالي فقط لضمان الخصوصية
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || user.isAnonymous) return null;
    return collection(firestore, "users", user.uid, "bookings");
  }, [firestore, user?.uid, user?.isAnonymous]);
  
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "تم تسجيل الخروج", description: "نتمنى رؤيتك قريباً" });
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

  if (isUserLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin h-12 w-12 text-primary opacity-20" />
      <p className="text-sm font-bold text-muted-foreground">جاري التحميل...</p>
    </div>
  );

  const isGuest = !user || user.isAnonymous;

  return (
    <div className="space-y-8 pb-24 text-right animate-in fade-in duration-700">
      {isGuest ? (
        <div className="max-w-md mx-auto pt-4 space-y-8">
          <header className="text-center space-y-4">
            <div className="h-20 w-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto border border-primary/10">
              <Bus className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">بوابة العوجان</h1>
          </header>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardContent className="p-8">
              <form onSubmit={handleAuthAction} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs">البريد الإلكتروني</Label>
                  <Input 
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-2xl h-14"
                    required
                  />
                </div>
                
                {authMode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label className="font-bold text-xs">كلمة المرور</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="rounded-2xl h-14"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black bg-primary shadow-xl">
                  {authMode === 'login' ? 'دخول النظام' : authMode === 'register' ? 'تسجيل حساب جديد' : 'استعادة كلمة المرور'}
                </Button>
              </form>

              <div className="mt-8 text-center flex flex-col gap-3">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('register')} className="text-primary text-sm font-black underline">اشترك الآن</button>
                    <button onClick={() => setAuthMode('forgot')} className="text-slate-400 text-xs font-bold">نسيت كلمة المرور؟</button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-primary text-sm font-black underline">لديك حساب؟ سجل دخولك</button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-10">
          <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-primary/5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-12 w-12" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-right space-y-2">
                <h2 className="text-2xl font-black text-slate-900">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user.email?.split('@')[0] || "مسافر")}
                </h2>
                <p className="text-slate-500 font-bold text-sm">{user.email}</p>
                <div className="flex flex-wrap justify-center md:justify-end gap-2 pt-3">
                  <Badge className="bg-primary text-white font-black px-5 py-2 rounded-full">
                    {isAdmin ? "المدير العام" : isStaff ? "موظف معتمد" : "عضو مسجل"}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {(isAdmin || isStaff) && (
            <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[3rem] overflow-hidden">
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <ShieldCheck className="h-12 w-12 text-white" />
                  <div className="text-right">
                    <h2 className="text-2xl font-black leading-none">لوحة الإدارة المركزية</h2>
                    <p className="text-xs text-white/60 font-bold mt-2 uppercase tracking-widest">Al-Awajan Admin System</p>
                  </div>
                </div>
                <Button asChild className="rounded-[1.5rem] bg-white text-primary hover:bg-white/90 font-black px-10 h-16 shadow-2xl">
                  <Link href="/admin">دخول اللوحة الآن</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <section className="space-y-8">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3">
                <Ticket className="h-6 w-6 text-primary" />
                تذاكري وحجوزاتي
              </h3>
              <Badge variant="secondary" className="font-black px-4 py-1.5 rounded-xl">{bookings?.length || 0} تذكرة</Badge>
            </div>
            
            {isBookingsLoading ? (
              <div className="flex justify-center p-20"><Loader2 className="animate-spin h-12 w-12 text-primary opacity-20" /></div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {bookings.map((booking) => (
                  <div key={booking.id} className="relative group">
                    <div 
                      ref={el => { ticketRefs.current[booking.id] = el; }}
                      className="bg-white border-none shadow-2xl rounded-[3.5rem] overflow-hidden ring-1 ring-slate-100"
                    >
                      <div className="p-8 flex items-center justify-between border-b border-dashed border-slate-100 bg-slate-50/30">
                        <div className="flex items-center gap-4">
                          <Bus className="h-7 w-7 text-primary" />
                          <div className="text-right">
                            <p className="font-black text-lg text-primary leading-none">تذكرة سفر</p>
                            <p className="text-[9px] text-slate-400 uppercase font-black mt-1.5">Al-Awajan Express</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500 text-white font-black px-5 py-1.5 rounded-full">مؤكد</Badge>
                      </div>

                      <div className="p-8 md:p-10 space-y-10">
                         <div className="flex items-center justify-between">
                           <div className="text-right flex-1">
                             <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-widest">المغادرة</p>
                             <p className="font-black text-xl text-slate-900 leading-tight">{booking.boardingPoint || "غير محدد"}</p>
                           </div>
                           <ArrowLeft className="h-5 w-5 text-primary/30" />
                           <div className="text-left flex-1">
                             <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-widest">الوصول</p>
                             <p className="font-black text-xl text-slate-900 leading-tight">{booking.droppingPoint || "غير محدد"}</p>
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                           <div className="text-right">
                             <p className="text-[10px] text-slate-400 font-black mb-3 uppercase tracking-widest">المقاعد</p>
                             <div className="flex flex-wrap gap-1.5 justify-end">
                               {booking.seatNumbers?.map((s: string) => (
                                 <Badge key={s} className="bg-slate-900 text-white font-black h-8 w-8 flex items-center justify-center text-xs rounded-lg">{s}</Badge>
                               ))}
                             </div>
                           </div>
                           <div className="text-left">
                             <p className="text-[10px] text-slate-400 font-black mb-2 uppercase tracking-widest">المسافرين</p>
                             <p className="font-black text-2xl text-primary">{booking.numberOfSeats}</p>
                           </div>
                         </div>

                         <div className="flex items-center justify-between pt-8 border-t border-dashed border-slate-200">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">كود الرحلة</p>
                              <p className="font-black text-lg text-accent font-mono">{booking.busTripId}</p>
                            </div>
                            <QrCode className="h-12 w-12 text-slate-200" />
                         </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => downloadTicket(booking.id)} 
                      disabled={isDownloading === booking.id}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full h-14 px-8 bg-white text-slate-900 shadow-2xl border-4 border-slate-900 gap-3 font-black"
                    >
                      {isDownloading === booking.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Download className="h-5 w-5" /> حفظ التذكرة</>}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-24 bg-white rounded-[3.5rem] border-2 border-dashed border-slate-100">
                <Ticket className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                <p className="text-sm text-slate-400 font-black">لا توجد حجوزات نشطة حالياً</p>
              </div>
            )}
          </section>

          {user && !user.isAnonymous && (
            <section className="space-y-6 pt-12">
              <h3 className="font-black text-2xl text-slate-900 px-4 flex items-center gap-3">
                <Settings className="h-6 w-6 text-slate-500" />
                إعدادات الحساب
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="ghost" onClick={() => setShowPasswordChange(!showPasswordChange)} className="w-full justify-between h-20 bg-white border border-slate-100 rounded-[2rem] px-8 shadow-sm">
                  <div className="flex items-center gap-5">
                    <KeyRound className="h-6 w-6 text-blue-600" />
                    <span className="font-black text-slate-700">تحديث كلمة المرور</span>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-slate-300" />
                </Button>

                <Button variant="outline" onClick={handleLogout} className="w-full h-20 rounded-[2rem] text-red-600 border-red-50 bg-red-50/20 font-black gap-3 hover:bg-red-50">
                  <LogOut className="h-6 w-6" /> تسجيل الخروج
                </Button>
              </div>

              {showPasswordChange && (
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-50 ring-1 ring-slate-200 mt-4 animate-in slide-in-from-top-4">
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black opacity-50 pr-1 uppercase">كلمة المرور الجديدة</Label>
                      <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-2xl h-12" />
                    </div>
                    <Button onClick={() => { if(user) { initiateUpdatePassword(user, newPassword); setNewPassword(""); setShowPasswordChange(false); } }} className="w-full h-14 rounded-2xl font-black bg-primary">تأكيد التحديث</Button>
                  </CardContent>
                </Card>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}