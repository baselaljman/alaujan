
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
  QrCode
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

  // جلب التذاكر من المجموعات الفرعية الخاصة بالمستخدم الحالي فقط لضمان الخصوصية
  const bookingsRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return collection(firestore, "users", user.uid, "bookings");
  }, [firestore, user?.uid]);
  
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsRef);

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

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && newPassword) {
      initiateUpdatePassword(user, newPassword);
      setNewPassword("");
      setShowPasswordChange(false);
    }
  };

  const downloadTicket = async (bookingId: string) => {
    const element = ticketRefs.current[bookingId];
    if (!element) return;

    setIsDownloading(bookingId);
    try {
      const dataUrl = await toPng(element, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        fontEmbedCSS: '',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top right'
        }
      });
      const link = document.createElement('a');
      link.download = `ticket-${bookingId.slice(-6)}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "تم التحميل", description: "تم حفظ التذكرة كصورة في جهازك" });
    } catch (err) {
      console.error("Download Error:", err);
      toast({ variant: "destructive", title: "خطأ في التحميل", description: "تعذر تحويل التذكرة لصورة بسبب قيود الأمان." });
    } finally {
      setIsDownloading(null);
    }
  };

  const isLoading = isUserLoading || isStaffLoading || isDriverLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="text-sm text-muted-foreground">جاري التحقق...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 text-right animate-in fade-in duration-500">
      {(!user || user.isAnonymous) ? (
        <div className="space-y-6 max-w-sm mx-auto pt-4">
          <header className="text-center space-y-2">
            <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-inner">
              <UserIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-primary">
              {authMode === 'login' ? 'مرحباً بك مجدداً' : authMode === 'register' ? 'إنشاء حساب جديد' : 'استعادة كلمة المرور'}
            </h1>
          </header>

          <Card className="border-primary/10 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/90 backdrop-blur-md">
            <CardContent className="p-8">
              <form onSubmit={handleAuthAction} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold text-xs pr-1">البريد الإلكتروني</Label>
                  <Input 
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-2xl h-12"
                    required
                  />
                </div>
                
                {authMode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label className="font-bold text-xs pr-1">كلمة المرور</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="rounded-2xl h-12"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold bg-primary shadow-xl mt-2">
                  {authMode === 'login' ? 'دخول' : authMode === 'register' ? 'تسجيل' : 'استعادة'}
                </Button>
              </form>

              <div className="mt-8 space-y-4 text-center">
                <div className="flex flex-col gap-2">
                  {authMode === 'login' ? (
                    <>
                      <button onClick={() => setAuthMode('register')} className="text-primary text-xs font-bold hover:underline">ليس لديك حساب؟ سجل الآن</button>
                      <button onClick={() => setAuthMode('forgot')} className="text-muted-foreground text-xs hover:text-primary">نسيت كلمة المرور؟</button>
                    </>
                  ) : (
                    <button onClick={() => setAuthMode('login')} className="text-primary text-xs font-bold hover:underline">بالفعل لديك حساب؟ سجل دخول</button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="space-y-4">
            {(isAdmin || isStaff) && (
              <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-7 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
                      <ShieldCheck className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">{isAdmin ? "المدير العام" : "قسم الموظفين"}</h2>
                      <p className="text-xs text-white/70">أهلاً بك في بوابة التحكم الإداري</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl bg-white text-primary hover:bg-white/90 font-bold px-8 h-12 shadow-xl">
                    <Link href="/admin">دخول الإدارة</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {isDriver && (
              <Card className="border-none bg-emerald-600 text-white shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-7 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center border border-white/30">
                      <MapPin className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black">لوحة القائد</h2>
                      <p className="text-xs text-white/70">تتبع الرحلة ومراقبة الطريق</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl bg-white text-emerald-600 hover:bg-white/90 font-bold px-8 h-12 shadow-xl">
                    <Link href="/driver">بدء البث</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-5 p-6 bg-white rounded-[2rem] shadow-sm border border-primary/5">
              <Avatar className="h-24 w-24 border-4 border-primary/10">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-primary">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "مسافر العوجان"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary/50" />
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-black px-4 py-1 mt-2">
                  {isAdmin ? "المدير العام" : isStaff ? "موظف معتمد" : isDriver ? "قائد حافلة" : "عضو مسجل"}
                </Badge>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <h3 className="font-bold text-xl text-primary flex items-center gap-2 px-2">
              <Ticket className="h-6 w-6" /> تذاكري وحجوزاتي
            </h3>
            
            {isBookingsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary opacity-20" /></div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className="relative group">
                    <div 
                      ref={el => { ticketRefs.current[booking.id] = el; }}
                      className="bg-white border-none shadow-sm ring-1 ring-primary/5 rounded-[2rem] overflow-hidden"
                    >
                      <div className="p-6 flex items-center justify-between border-b border-dashed border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                            <Bus className="h-7 w-7 text-white" />
                          </div>
                          <div className="text-right">
                            <p className="font-black text-lg text-primary">تذكرة سفر إلكترونية</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">AL-AWAJAN TRAVEL</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge variant="outline" className="border-emerald-200 text-emerald-600 bg-emerald-50 font-black px-4 h-8">مؤكد</Badge>
                          <p className="text-[9px] text-muted-foreground mt-1 font-mono">ID: {booking.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="p-8 space-y-8">
                         <div className="flex items-center justify-between">
                           <div className="text-right flex-1">
                             <p className="text-[10px] text-muted-foreground font-black mb-1">من (محطة الركوب)</p>
                             <p className="font-black text-xl text-primary">{booking.boardingPoint || "غير محدد"}</p>
                           </div>
                           <div className="flex flex-col items-center px-6">
                             <ArrowLeft className="h-5 w-5 text-primary/30" />
                             <div className="w-12 h-[1px] bg-primary/20 my-1" />
                           </div>
                           <div className="text-left flex-1">
                             <p className="text-[10px] text-muted-foreground font-black mb-1">إلى (محطة النزول)</p>
                             <p className="font-black text-xl text-primary">{booking.droppingPoint || "غير محدد"}</p>
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-8 pt-6 border-t border-primary/5">
                           <div className="text-right">
                             <p className="text-[10px] text-muted-foreground font-black mb-1">أرقام المقاعد</p>
                             <div className="flex flex-wrap gap-1 justify-end">
                               {booking.seatNumbers?.map((s: string) => (
                                 <Badge key={s} className="bg-primary/10 text-primary border-none font-black h-7 w-7 p-0 flex items-center justify-center">{s}</Badge>
                               ))}
                             </div>
                           </div>
                           <div className="text-left">
                             <p className="text-[10px] text-muted-foreground font-black mb-1">عدد المسافرين</p>
                             <p className="font-black text-xl text-primary">{booking.numberOfSeats}</p>
                           </div>
                         </div>

                         <div className="flex items-center justify-between pt-6 border-t border-dashed border-primary/20">
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground font-black mb-1">تاريخ الحجز</p>
                              <p className="font-bold text-sm">{new Date(booking.bookingDate).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p>
                            </div>
                            <div className="h-16 w-16 bg-muted/30 rounded-xl flex items-center justify-center">
                              <QrCode className="h-10 w-10 text-primary/20" />
                            </div>
                         </div>
                      </div>
                      
                      <div className="bg-primary h-2 w-full" />
                    </div>

                    <Button 
                      onClick={() => downloadTicket(booking.id)} 
                      disabled={isDownloading === booking.id}
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full h-12 px-8 bg-accent hover:bg-accent/90 shadow-xl border-4 border-white gap-2 font-bold transition-transform active:scale-95"
                    >
                      {isDownloading === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Download className="h-4 w-4" /> حفظ كصورة</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed">
                <Ticket className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">لا توجد حجوزات نشطة حالياً</p>
              </div>
            )}
          </section>

          <section className="space-y-4 pt-12">
            <h3 className="font-bold text-xl text-primary px-2 flex items-center gap-2">
              <Settings className="h-6 w-6" /> الأمان والحساب
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Button variant="ghost" onClick={() => setShowPasswordChange(!showPasswordChange)} className="w-full justify-between h-16 bg-white border rounded-2xl px-5">
                <div className="flex items-center gap-4">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">تغيير كلمة المرور</span>
                </div>
                <ChevronLeft className="h-5 w-5 opacity-30" />
              </Button>

              {showPasswordChange && (
                <Card className="border-primary/10 shadow-xl rounded-2xl">
                  <CardContent className="p-6 space-y-5">
                    <Input type="password" placeholder="كلمة المرور الجديدة" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="rounded-xl h-12" />
                    <Button onClick={handleChangePassword} className="w-full h-12 rounded-xl font-bold">تحديث</Button>
                  </CardContent>
                </Card>
              )}

              <Button variant="outline" onClick={handleLogout} className="w-full h-16 rounded-2xl text-destructive border-destructive/20 font-black gap-2">
                <LogOut className="h-5 w-5" /> تسجيل الخروج
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
