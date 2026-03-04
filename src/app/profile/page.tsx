
"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShieldAlert, 
  Loader2, 
  Mail, 
  User as UserIcon,
  KeyRound,
  LogIn,
  UserPlus,
  RefreshCcw,
  Settings,
  LayoutDashboard,
  ShieldCheck,
  MapPin,
  Truck
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

  // 1. فحص هل المستخدم هو الأدمن الأساسي (atlob.co@gmail.com)
  const isAdmin = useMemo(() => {
    return user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }, [user]);

  // 2. فحص هل المستخدم موظف (Staff)
  const staffQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "staff_permissions"), where("email", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: staffData, isLoading: isStaffLoading } = useCollection(staffQuery);
  const isStaff = staffData && staffData.length > 0;
  
  // 3. فحص هل المستخدم سائق (Driver)
  const driverQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(collection(firestore, "buses"), where("driverEmail", "==", user.email.toLowerCase()));
  }, [firestore, user?.email]);
  const { data: driverBuses, isLoading: isDriverLoading } = useCollection(driverQuery);
  const isDriver = driverBuses && driverBuses.length > 0;

  // جلب بيانات ملف المستخدم الشخصي
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // جلب حجوزات المستخدم
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.email) return null;
    return query(
      collection(firestore, "bookings"), 
      where("userEmail", "==", user.email.toLowerCase())
    );
  }, [firestore, user]);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "تم تسجيل الخروج", description: "نتمنى رؤيتك قريباً" });
  };

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى إدخال البريد الإلكتروني" });
      return;
    }
    
    if (authMode === 'login') {
      initiateEmailSignIn(auth, email, password);
    } else if (authMode === 'register') {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiatePasswordReset(auth, email);
      toast({ 
        title: "تم إرسال الطلب", 
        description: "إذا كان الحساب مسجلاً لدينا، فستظهر تعليمات استعادة كلمة المرور برمجياً." 
      });
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

  const isLoading = isUserLoading || isStaffLoading || isDriverLoading;

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="text-sm text-muted-foreground">جاري التحقق من الهوية...</p>
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
            <p className="text-xs text-muted-foreground px-6">
              {authMode === 'login' ? 'سجل دخولك للوصول إلى تذاكرك ومهامك الإدارية' : 'انضم إلينا للحصول على عروض حصرية وتتبع أسهل'}
            </p>
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
                    className="rounded-2xl h-12 border-primary/10 focus:ring-primary/20"
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
                      className="rounded-2xl h-12 border-primary/10 focus:ring-primary/20"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl bg-primary hover:bg-primary/95 transition-all mt-2">
                  {authMode === 'login' ? <><LogIn className="h-5 w-5" /> دخول</> : authMode === 'register' ? <><UserPlus className="h-5 w-5" /> تسجيل</> : <><RefreshCcw className="h-5 w-5" /> استعادة</>}
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
          {/* قسم الوصول الخاص للأدوار العليا */}
          <section className="space-y-4">
            {/* لوحة المدير العام (مخصصة لـ atlob.co@gmail.com) */}
            {isAdmin && (
              <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[2.5rem] overflow-hidden ring-4 ring-primary/10">
                <CardContent className="p-7 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                      <ShieldCheck className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">المدير العام</h2>
                      <p className="text-xs text-white/70">تحكم كامل في كافة مفاصل النظام</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl bg-white text-primary hover:bg-white/90 font-bold px-8 h-12 shadow-xl transition-transform hover:scale-105">
                    <Link href="/admin">دخول الإدارة</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* لوحة الموظف (للموظفين المضافين في staff_permissions) */}
            {isStaff && !isAdmin && (
              <Card className="border-none bg-indigo-600 text-white shadow-2xl rounded-[2.5rem] overflow-hidden ring-4 ring-indigo-100">
                <CardContent className="p-7 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                      <ShieldAlert className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">قسم الموظفين</h2>
                      <p className="text-xs text-white/70">أهلاً بك، يمكنك إدارة الأقسام المحددة لك</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl bg-white text-indigo-600 hover:bg-white/90 font-bold px-8 h-12 shadow-xl transition-transform hover:scale-105">
                    <Link href="/admin">دخول الإدارة</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* لوحة السائق (للسائقين المرتبطين بحافلة) */}
            {isDriver && (
              <Card className="border-none bg-emerald-600 text-white shadow-2xl rounded-[2.5rem] overflow-hidden ring-4 ring-emerald-100">
                <CardContent className="p-7 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                      <MapPin className="h-9 w-9 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">لوحة القائد</h2>
                      <p className="text-xs text-white/70">ابدأ الرحلة الآن وفعل تتبع الـ GPS</p>
                    </div>
                  </div>
                  <Button asChild className="rounded-2xl bg-white text-emerald-600 hover:bg-white/90 font-bold px-8 h-12 shadow-xl transition-transform hover:scale-105">
                    <Link href="/driver">بدء البث</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          {/* الملف الشخصي للمسافر */}
          <section className="space-y-4">
            <div className="flex items-center gap-5 p-6 bg-white rounded-[2rem] shadow-sm border border-primary/5">
              <Avatar className="h-24 w-24 border-4 border-primary/10 shadow-md">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-primary tracking-tight">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "مسافر العوجان"}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary/50" />
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 border-none font-black px-4 py-1">
                    {isAdmin ? "المدير العام" : isStaff ? "موظف النظام" : isDriver ? "قائد حافلة" : "عضو مسجل"}
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* قسم التذاكر والحجوزات */}
          <section className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-xl text-primary flex items-center gap-2">
                <Ticket className="h-6 w-6" /> تذاكري وحجوزاتي
              </h3>
              <Badge variant="outline" className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold">
                {bookings?.length || 0} حجز
              </Badge>
            </div>
            
            {isBookingsLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary opacity-20" /></div>
            ) : bookings && bookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="border-none shadow-sm ring-1 ring-primary/5 bg-white/50 hover:bg-white transition-all hover:shadow-md rounded-2xl overflow-hidden group">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/5 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Bus className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-base text-primary">حجز {booking.numberOfSeats} مقاعد</p>
                          <p className="text-xs text-muted-foreground mt-0.5">بتاريخ: {new Date(booking.bookingDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={booking.status === 'Confirmed' ? 'border-emerald-200 text-emerald-600 bg-emerald-50 font-bold' : 'bg-muted'}>
                          {booking.status === 'Confirmed' ? 'مؤكد' : booking.status}
                        </Badge>
                        <p className="text-[10px] font-bold text-primary opacity-50">#{booking.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-20 bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-muted">
                <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">لا توجد حجوزات مرتبطة بحسابك</p>
                <Button variant="link" asChild className="text-primary font-black mt-2 h-auto p-0">
                  <Link href="/">ابدأ رحلتك الأولى معنا</Link>
                </Button>
              </div>
            )}
          </section>

          {/* خيارات الحساب */}
          <section className="space-y-4 pt-4">
            <h3 className="font-bold text-xl text-primary px-2 flex items-center gap-2">
              <Settings className="h-6 w-6" /> الإعدادات والأمان
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-full justify-between h-16 bg-white border border-primary/5 rounded-2xl hover:bg-primary/5 transition-all group px-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-sm">تغيير كلمة المرور</span>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground/40 group-hover:translate-x-[-4px] transition-transform" />
              </Button>

              {showPasswordChange && (
                <Card className="border-primary/10 shadow-xl animate-in slide-in-from-top-2 rounded-2xl overflow-hidden">
                  <CardContent className="p-6 space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold opacity-70">كلمة المرور الجديدة</Label>
                      <Input 
                        type="password" 
                        placeholder="6 خانات على الأقل" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <Button onClick={handleChangePassword} className="w-full h-12 rounded-xl font-bold">تحديث كلمة المرور</Button>
                  </CardContent>
                </Card>
              )}

              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full h-16 rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/5 hover:border-destructive transition-all font-black gap-2 shadow-sm mt-2"
              >
                <LogOut className="h-5 w-5" /> تسجيل الخروج من النظام
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

