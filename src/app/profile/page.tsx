
"use client"

import { useState } from "react";
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
  ShieldCheck
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

  // جلب بيانات ملف المستخدم الشخصي
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user?.uid]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // جلب حجوزات المستخدم (بناءً على UID أو الإيميل)
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "bookings"), 
      where("userEmail", "==", user.email || profile?.email || "")
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

  if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="space-y-8 pb-24">
      {/* قسم الإدارة المنفرد - يظهر دائماً في الأعلى */}
      <section className="animate-in fade-in slide-in-from-top-4 duration-500">
        <Card className="border-none bg-primary text-primary-foreground shadow-2xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                  <ShieldCheck className="h-8 w-8 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black tracking-tight">إدارة النظام</h2>
                  <p className="text-[10px] text-white/70 font-medium">التحكم بالرحلات، الأسطول، والطرود</p>
                </div>
              </div>
              <Button asChild size="lg" className="rounded-2xl bg-white text-primary hover:bg-white/90 font-bold px-8 shadow-xl transition-all hover:scale-105 active:scale-95">
                <Link href="/admin">دخول</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {(!user || user.isAnonymous) ? (
        <div className="space-y-6 max-w-sm mx-auto pt-4 animate-in fade-in duration-700">
          <header className="text-center space-y-2">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/5 shadow-sm">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-headline text-primary">
              {authMode === 'login' ? 'تسجيل الدخول' : authMode === 'register' ? 'إنشاء حساب جديد' : 'استعادة كلمة المرور'}
            </h1>
            <p className="text-xs text-muted-foreground">ادخل بياناتك للوصول إلى تذاكرك وحجوزاتك السابقة</p>
          </header>

          <Card className="border-primary/5 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleAuthAction} className="space-y-4">
                <div className="space-y-2 text-right">
                  <Label className="font-bold text-xs opacity-70">البريد الإلكتروني</Label>
                  <Input 
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="rounded-xl h-12 border-primary/10 focus:ring-primary/20"
                    required
                  />
                </div>
                
                {authMode !== 'forgot' && (
                  <div className="space-y-2 text-right">
                    <Label className="font-bold text-xs opacity-70">كلمة المرور</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="rounded-xl h-12 border-primary/10 focus:ring-primary/20"
                      required
                    />
                  </div>
                )}

                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold gap-2 shadow-xl bg-primary hover:bg-primary/95 transition-all">
                  {authMode === 'login' ? <><LogIn className="h-5 w-5" /> دخول</> : authMode === 'register' ? <><UserPlus className="h-5 w-5" /> تسجيل جديد</> : <><RefreshCcw className="h-5 w-5" /> إرسال رابط التعيين</>}
                </Button>
              </form>

              <div className="mt-8 space-y-3 text-center text-xs">
                {authMode === 'login' ? (
                  <>
                    <button onClick={() => setAuthMode('register')} className="text-primary font-bold hover:underline block w-full">ليس لديك حساب؟ سجل الآن</button>
                    <button onClick={() => setAuthMode('forgot')} className="text-muted-foreground hover:text-primary block w-full mt-2">نسيت كلمة المرور؟</button>
                  </>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-primary font-bold hover:underline block w-full">بالفعل لديك حساب؟ سجل دخول</button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* بيانات المستخدم الشخصية */}
          <section className="space-y-4">
            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm border border-primary/5">
              <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-sm">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                <AvatarFallback className="bg-primary/5 text-primary"><UserIcon className="h-8 w-8" /></AvatarFallback>
              </Avatar>
              <div className="flex-1 text-right">
                <h2 className="text-xl font-bold text-primary">
                  {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : "مسافر العوجان"}
                </h2>
                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <p className="text-xs">{user.email || profile?.email}</p>
                </div>
                <Badge variant="secondary" className="mt-2 bg-accent/10 text-accent hover:bg-accent/20 border-none font-bold">
                  عضو مسجل
                </Badge>
              </div>
            </div>
          </section>

          {/* قسم الحجوزات */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                <Ticket className="h-5 w-5" /> رحلاتي وحجوزاتي
              </h3>
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
                          <p className="text-[10px] text-muted-foreground">تاريخ: {new Date(booking.bookingDate).toLocaleDateString('ar-EG')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={booking.status === 'Confirmed' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'bg-muted'}>
                        {booking.status === 'Confirmed' ? 'مؤكد' : booking.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
                <Ticket className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">لا توجد حجوزات مرتبطة ببريدك حالياً</p>
                <Button variant="link" asChild className="text-primary font-bold mt-2">
                  <Link href="/">احجز رحلتك الأولى الآن</Link>
                </Button>
              </div>
            )}
          </section>

          {/* إعدادات الحساب */}
          <section className="space-y-3">
            <h3 className="font-bold text-lg text-primary px-1 flex items-center gap-2">
              <Settings className="h-5 w-5" /> إعدادات الحساب
            </h3>
            
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-full justify-between h-14 bg-white border rounded-2xl hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">تغيير كلمة المرور</span>
                </div>
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>

              {showPasswordChange && (
                <Card className="border-primary/10 shadow-md animate-in slide-in-from-top-2">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2 text-right">
                      <Label>كلمة المرور الجديدة</Label>
                      <Input 
                        type="password" 
                        placeholder="أدخل 6 خانات على الأقل" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="rounded-xl h-11"
                      />
                    </div>
                    <Button onClick={handleChangePassword} className="w-full rounded-xl">تحديث الآن</Button>
                  </CardContent>
                </Card>
              )}

              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full h-14 rounded-2xl text-destructive border-destructive/20 hover:bg-destructive/5 transition-colors font-bold mt-2"
              >
                <LogOut className="h-5 w-5 ml-2" /> تسجيل الخروج
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
