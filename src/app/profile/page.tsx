"use client"

import { useState, useMemo, useRef, useEffect } from "react";
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
  Navigation,
  UserCheck,
  Lock,
  PlusCircle
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

  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user]);

  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "staff_permissions"), where("email", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: staffData, isLoading: isStaffLoading } = useCollection(staffQuery);
  const isStaff = staffData && staffData.length > 0;
  
  const driverQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "buses"), where("driverEmail", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: driverBuses, isLoading: isDriverLoading } = useCollection(driverQuery);
  const isDriver = driverBuses && driverBuses.length > 0;

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // استعلام مجموعة الحجوزات للعثور على تذاكر المستخدم ببريده
    if (user.email) {
      return query(collectionGroup(firestore, "bookings"), where("userEmail", "==", user.email.toLowerCase()));
    }
    // للمستخدمين المجهولين، نبحث في مسارهم الخاص فقط
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
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `ticket-${bookingId.slice(-6)}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التحميل", description: "تم حفظ التذكرة كصورة" });
    } catch (err) {
      toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل الصورة" });
    } finally {
      setIsDownloading(null);
    }
  };

  if (isUserLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="text-sm text-muted-foreground font-bold">جاري تحميل بياناتك...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 text-right animate-in fade-in duration-500">
      {(!user || user.isAnonymous) && !bookings?.length ? (
        <div className="space-y-8 max-w-sm mx-auto pt-6 px-2">
          <header className="text-center space-y-4">
            <div className="h-24 w-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-primary/10 shadow-inner relative">
              <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <UserIcon className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {authMode === 'login' ? 'بوابة العوجان للسفر' : authMode === 'register' ? 'انضم إلى العوجان' : 'استعادة الحساب'}
              </h1>
              <p className="text-xs text-muted-foreground font-medium">سجل دخولك لإدارة حجوزاتك وصلاحياتك</p>
            </div>
          </header>

          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <CardContent className="p-10">
              <form onSubmit={handleAuthAction} className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs pr-1 text-slate-500 uppercase tracking-widest">البريد الإلكتروني</Label>
                  <Input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-[1.25rem] h-14 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-primary focus:bg-white transition-all text-right"
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
                      className="rounded-[1.25rem] h-14 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-primary focus:bg-white transition-all text-right"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-16 rounded-[1.5rem] text-lg font-black bg-primary shadow-xl shadow-primary/20 mt-4 transition-transform active:scale-95">
                  {authMode === 'login' ? (
                    <><UserCheck className="h-5 w-5 ml-2" /> دخول النظام</>
                  ) : authMode === 'register' ? (
                    <><PlusCircle className="h-5 w-5 ml-2" /> فتح حساب جديد</>
                  ) : (
                    'إرسال تعليمات الضبط'
                  )}
                </Button>
              </form>

              <div className="mt-10 pt-6 border-t border-slate-50 flex flex-col gap-4 text-center">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('register')} className="text-primary text-xs font-black hover:underline underline-offset-4 decoration-2">ليس لديك حساب؟ اشترك مجاناً</button>
                    <button onClick={() => setAuthMode('forgot')} className="text-slate-400 text-xs font-bold hover:text-primary transition-colors">نسيت تفاصيل الدخول؟</button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-primary text-xs font-black hover:underline underline-offset-4 decoration-2">بالفعل لديك حساب؟ سجل دخول الآن</button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
            <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
              تنبيه الموظفين: يرجى استخدام البريد الإلكتروني الرسمي المعتمد من الإدارة لتتمكن من الوصول للصلاحيات الممنوحة لك.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <section className="space-y-4">
            <div className="flex items-center gap-6 p-8 bg-white rounded-[2.5rem] shadow-sm border border-primary/5">
              <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-lg">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h2 className="text-2xl font-black text-slate-900 leading-none">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] || "مسافر العوجان")}
                </h2>
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-widest">
                  <Mail className="h-3 w-3 text-primary/40" />
                  {user?.email || profile?.email || "حساب ضيف"}
                </div>
                <div className="flex gap-2 pt-2">
                  <Badge className="bg-accent text-white border-none font-black px-4 py-1.5 rounded-full shadow-sm">
                    {isAdmin ? "المدير العام" : isStaff ? "موظف معتمد" : isDriver ? "قائد حافلة" : "عضو مسجل"}
                  </Badge>
                </div>
              </div>
            </div>

            {(isAdmin || isStaff) && (
              <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[2.5rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 h-full w-32 bg-white/5 skew-x-[-20deg] translate-x-16" />
                <CardContent className="p-8 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md">
                      <ShieldCheck className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black leading-none">{isAdmin ? "بوابة الإدارة المركزية" : "بوابة الموظفين"}</h2>
                      <p className="text-[10px] text-white/60 font-bold mt-2 uppercase tracking-widest">Al-Awajan Admin System</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-[1.25rem] bg-white text-primary hover:bg-white/90 font-black px-8 h-14 shadow-xl transition-transform active:scale-95">
                    <Link href="/admin">دخول اللوحة</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-black text-xl text-slate-900 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                تذاكري وحجوزاتي
              </h3>
              <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500">{bookings?.length || 0} تذكرة</Badge>
            </div>
            
            {isBookingsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary opacity-20" /></div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {bookings.map((booking) => (
                  <div key={booking.id} className="relative group">
                    <div 
                      ref={el => { ticketRefs.current[booking.id] = el; }}
                      className="bg-white border-none shadow-xl rounded-[3rem] overflow-hidden ring-1 ring-slate-100"
                    >
                      <div className="p-8 flex items-center justify-between border-b border-dashed border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-lg">
                            <Bus className="h-8 w-8 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="font-black text-xl text-primary leading-none">تذكرة سفر</p>
                            <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-black mt-2">Al-Awajan Express</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge className="bg-emerald-500 text-white font-black px-5 py-1.5 rounded-full">مؤكد</Badge>
                        </div>
                      </div>

                      <div className="p-10 space-y-10">
                         <div className="flex items-center justify-between">
                           <div className="text-right flex-1">
                             <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-widest">من محطة</p>
                             <p className="font-black text-2xl text-slate-900 leading-tight">{booking.boardingPoint || "غير محدد"}</p>
                           </div>
                           <div className="flex flex-col items-center px-8 opacity-20">
                             <ArrowLeft className="h-6 w-6 text-primary" />
                             <div className="w-16 h-[2px] bg-slate-300 my-2" />
                           </div>
                           <div className="text-left flex-1">
                             <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-widest">إلى محطة</p>
                             <p className="font-black text-2xl text-slate-900 leading-tight">{booking.droppingPoint || "غير محدد"}</p>
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-10 pt-8 border-t border-slate-50">
                           <div className="text-right">
                             <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-widest">المقاعد</p>
                             <div className="flex flex-wrap gap-1.5 justify-end">
                               {booking.seatNumbers?.map((s: string) => (
                                 <Badge key={s} className="bg-slate-900 text-white border-none font-black h-8 w-8 p-0 flex items-center justify-center text-xs rounded-lg">{s}</Badge>
                               ))}
                             </div>
                           </div>
                           <div className="text-left">
                             <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-widest">المسافرين</p>
                             <p className="font-black text-2xl text-primary">{booking.numberOfSeats}</p>
                           </div>
                         </div>

                         <div className="flex items-center justify-between pt-8 border-t border-dashed border-slate-200">
                            <div className="text-right">
                              <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-widest flex items-center gap-1 justify-end">تتبع الحافلة</p>
                              <p className="font-black text-lg text-accent font-mono tracking-tighter">{booking.busTripId}</p>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">{new Date(booking.bookingDate).toLocaleDateString('ar-EG', { dateStyle: 'medium' })}</p>
                            </div>
                            <div className="text-left flex items-center gap-4">
                               <div className="text-left">
                                 <p className="text-[9px] text-slate-400 font-black mb-1 uppercase tracking-widest">رقم الحجز</p>
                                 <p className="font-mono text-[10px] font-bold text-slate-400">#{booking.trackingNumber || booking.id.slice(0, 8)}</p>
                               </div>
                               <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center ring-1 ring-slate-100">
                                 <QrCode className="h-10 w-10 text-slate-200" />
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-slate-900 h-3 w-full" />
                    </div>

                    <Button 
                      onClick={() => downloadTicket(booking.id)} 
                      disabled={isDownloading === booking.id}
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full h-14 px-10 bg-white text-slate-900 hover:bg-slate-50 shadow-2xl border-4 border-slate-900 gap-3 font-black transition-all active:scale-90"
                    >
                      {isDownloading === booking.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <><Download className="h-5 w-5" /> حفظ التذكرة كصورة</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-inner">
                <Ticket className="h-16 w-16 text-slate-100 mx-auto mb-6" />
                <p className="text-sm text-slate-400 font-bold">لا يوجد أي حجوزات نشطة في سجلاتك</p>
              </div>
            )}
          </section>

          {!user.isAnonymous && (
            <section className="space-y-6 pt-16">
              <h3 className="font-black text-xl text-slate-900 px-2 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-slate-500" />
                </div>
                إعدادات الأمان
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <Button variant="ghost" onClick={() => setShowPasswordChange(!showPasswordChange)} className="w-full justify-between h-20 bg-white border border-slate-100 rounded-[1.5rem] px-8 hover:bg-slate-50 transition-all shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <KeyRound className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-black text-slate-700">تحديث كلمة المرور</span>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-slate-300" />
                </Button>

                {showPasswordChange && (
                  <Card className="border-none shadow-2xl rounded-[2rem] bg-slate-50 ring-1 ring-slate-200">
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-black opacity-50 pr-1 uppercase">كلمة المرور الجديدة</Label>
                        <Input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-xl h-12 border-none ring-1 ring-slate-200" />
                      </div>
                      <Button onClick={() => { initiateUpdatePassword(user, newPassword); setNewPassword(""); setShowPasswordChange(false); }} className="w-full h-14 rounded-xl font-black bg-primary">تأكيد التحديث</Button>
                    </CardContent>
                  </Card>
                )}

                <Button variant="outline" onClick={handleLogout} className="w-full h-20 rounded-[1.5rem] text-red-600 border-red-50 bg-red-50/30 font-black gap-3 hover:bg-red-50 hover:border-red-100 transition-all">
                  <LogOut className="h-6 w-6" /> تسجيل خروج آمن
                </Button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}