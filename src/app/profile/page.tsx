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
  MapPin,
  ArrowLeft,
  Download,
  QrCode,
  UserCheck,
  Lock,
  PlusCircle,
  Smartphone
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
import { collection, query, where, doc, collectionGroup } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";
import { toPng } from 'html-to-image';

const ADMIN_EMAIL = "atlob.co@gmail.com";

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

  // استعلامات البيانات - لا تبدأ إلا إذا كان المستخدم مسجلاً
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "staff_permissions"), where("email", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: staffData } = useCollection(staffQuery);
  const isStaff = staffData && staffData.length > 0;
  
  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user]);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    if (user.email) {
      return query(collectionGroup(firestore, "bookings"), where("userEmail", "==", user.email.toLowerCase()));
    }
    return collection(firestore, "users", user.uid, "bookings");
  }, [firestore, user, user?.email]);
  
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
      link.download = `AlAwajan-Ticket-${bookingId.slice(-4)}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التحميل", description: "تم حفظ التذكرة في جهازك" });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "تعذر تحميل الصورة حالياً" });
    } finally {
      setIsDownloading(null);
    }
  };

  if (isUserLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin h-12 w-12 text-primary opacity-20" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">جاري تهيئة جلستك آمنة...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 text-right animate-in fade-in duration-700">
      {(!user || user.isAnonymous) && !bookings?.length ? (
        <div className="max-w-md mx-auto pt-4 space-y-8">
          <header className="text-center space-y-4">
            <div className="h-24 w-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/10 shadow-inner relative">
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-accent flex items-center justify-center shadow-lg border-2 border-white">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <Bus className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">بوابة العوجان</h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">سجل دخولك لمتابعة حجوزاتك وصلاحياتك</p>
            </div>
          </header>

          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl ring-1 ring-slate-100">
            <CardContent className="p-8 md:p-12">
              <form onSubmit={handleAuthAction} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs pr-1 text-slate-500 uppercase tracking-widest">البريد الإلكتروني</Label>
                  <Input 
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-2xl h-14 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-primary focus:bg-white transition-all text-right"
                    required
                  />
                </div>
                
                {authMode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label className="font-bold text-xs pr-1 text-slate-500 uppercase tracking-widest">كلمة المرور</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="rounded-2xl h-14 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-primary focus:bg-white transition-all text-right"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black bg-primary shadow-xl shadow-primary/20 mt-2 hover:scale-[1.02] transition-transform">
                  {authMode === 'login' ? (
                    <><UserCheck className="h-5 w-5 ml-2" /> دخول النظام</>
                  ) : authMode === 'register' ? (
                    <><PlusCircle className="h-5 w-5 ml-2" /> تسجيل حساب جديد</>
                  ) : (
                    'استعادة كلمة المرور'
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col gap-4 text-center">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('register')} className="text-primary text-sm font-black hover:underline decoration-2">ليس لديك حساب؟ اشترك الآن</button>
                    <button onClick={() => setAuthMode('forgot')} className="text-slate-400 text-xs font-bold hover:text-primary">نسيت كلمة المرور؟</button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-primary text-sm font-black hover:underline decoration-2">بالفعل لديك حساب؟ سجل دخولك</button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="p-5 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black text-amber-900">تنبيه الموظفين</h4>
              <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                يرجى استخدام البريد الإلكتروني الرسمي المعتمد من الإدارة لتفعيل صلاحياتك الممنوحة آلياً.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-10">
          <section className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-primary/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-16 -translate-y-16" />
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-1 ring-primary/5">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-12 w-12" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-right space-y-2">
                <h2 className="text-3xl font-black text-slate-900 leading-tight">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || "مسافر العوجان")}
                </h2>
                <div className="flex items-center justify-center md:justify-end gap-2 text-slate-500 font-bold text-sm">
                  <Mail className="h-4 w-4 text-primary opacity-40" />
                  {user?.email || "حساب غير مفعل"}
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-2 pt-3">
                  <Badge className="bg-primary text-white border-none font-black px-5 py-2 rounded-full shadow-lg">
                    {isAdmin ? "المدير العام" : isStaff ? "موظف معتمد" : "عضو مسجل"}
                  </Badge>
                  {profile?.phoneNumber && (
                    <Badge variant="outline" className="border-primary/10 text-primary px-5 py-2 rounded-full font-bold">
                      <Smartphone className="h-3 w-3 ml-1.5" /> {profile.phoneNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </section>

          {(isAdmin || isStaff) && (
            <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[3rem] overflow-hidden group">
              <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-[2rem] bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md group-hover:scale-110 transition-transform">
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-right">
                    <h2 className="text-2xl font-black leading-none">لوحة الإدارة المركزية</h2>
                    <p className="text-xs text-white/60 font-bold mt-2 uppercase tracking-widest">Al-Awajan Admin System</p>
                  </div>
                </div>
                <Button asChild className="rounded-[1.5rem] bg-white text-primary hover:bg-white/90 font-black px-10 h-16 shadow-2xl transition-all active:scale-95">
                  <Link href="/admin">دخول اللوحة الآن</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <section className="space-y-8">
            <div className="flex items-center justify-between px-4">
              <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                تذاكري وحجوزاتي
              </h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black px-4 py-1.5 rounded-xl">{bookings?.length || 0} تذكرة</Badge>
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
                          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                            <Bus className="h-7 w-7 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="font-black text-xl text-primary leading-none">تذكرة سفر</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black mt-1.5">Al-Awajan Express</p>
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
                           <div className="flex flex-col items-center px-6 opacity-30">
                             <ArrowLeft className="h-5 w-5 text-primary" />
                             <div className="w-12 h-[2px] bg-slate-300 my-2" />
                           </div>
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
                                 <Badge key={s} className="bg-slate-900 text-white border-none font-black h-8 w-8 p-0 flex items-center justify-center text-xs rounded-lg">{s}</Badge>
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
                              <p className="text-[10px] text-slate-500 font-bold mt-1">{new Date(booking.bookingDate).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</p>
                            </div>
                            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center ring-1 ring-slate-100">
                               <QrCode className="h-10 w-10 text-slate-200" />
                            </div>
                         </div>
                      </div>
                      <div className="bg-slate-900 h-3 w-full" />
                    </div>

                    <Button 
                      onClick={() => downloadTicket(booking.id)} 
                      disabled={isDownloading === booking.id}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full h-14 px-8 bg-white text-slate-900 hover:bg-slate-50 shadow-2xl border-4 border-slate-900 gap-3 font-black transition-all active:scale-90"
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

          {!user.isAnonymous && (
            <section className="space-y-6 pt-12">
              <h3 className="font-black text-2xl text-slate-900 px-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-slate-500" />
                </div>
                إعدادات الحساب
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="ghost" onClick={() => setShowPasswordChange(!showPasswordChange)} className="w-full justify-between h-20 bg-white border border-slate-100 rounded-[2rem] px-8 hover:bg-slate-50 transition-all shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-black text-slate-700">تحديث كلمة المرور</span>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-slate-300" />
                </Button>

                <Button variant="outline" onClick={handleLogout} className="w-full h-20 rounded-[2rem] text-red-600 border-red-50 bg-red-50/20 font-black gap-3 hover:bg-red-50 transition-all">
                  <LogOut className="h-6 w-6" /> تسجيل الخروج
                </Button>
              </div>

              {showPasswordChange && (
                <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-50 ring-1 ring-slate-200 mt-4 animate-in slide-in-from-top-4">
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black opacity-50 pr-1 uppercase">كلمة المرور الجديدة</Label>
                      <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-2xl h-12 border-none ring-1 ring-slate-200" />
                    </div>
                    <Button onClick={() => { initiateUpdatePassword(user, newPassword); setNewPassword(""); setShowPasswordChange(false); }} className="w-full h-14 rounded-2xl font-black bg-primary">تأكيد التحديث</Button>
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
