"use client"

import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  MapPin, 
  Package, 
  Calendar, 
  Settings, 
  ChevronLeft,
  LayoutDashboard,
  Loader2,
  Users,
  ShieldAlert,
  Lock
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { format } from "date-fns";

const ADMIN_EMAIL = "atlob.co@gmail.com";

export default function AdminDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isReady, setIsReady] = useState(false);

  // منطق التحقق من الصلاحية - مبسط ومستقر
  const isAuthorized = useMemo(() => {
    if (isUserLoading) return false;
    if (!user || !user.email) return false;
    
    const email = user.email.toLowerCase();
    // السماح للمدير أو أي بريد رسمي للشركة
    return email === ADMIN_EMAIL.toLowerCase() || email.endsWith("@alawajan.com");
  }, [user, isUserLoading]);

  // تفعيل الحالة "جاهز" فقط بعد استقرار جلسة المستخدم والتحقق من الصلاحية
  useEffect(() => {
    if (!isUserLoading) {
      if (isAuthorized) {
        const timer = setTimeout(() => setIsReady(true), 800);
        return () => clearTimeout(timer);
      } else if (user) {
        // إذا كان المستخدم مسجل دخول ولكن غير مخول، ننتظر قليلاً ثم نظهر رسالة المنع
        setIsReady(true);
      }
    }
  }, [isUserLoading, isAuthorized, user]);

  // استعلامات البيانات - لا تبدأ أبداً إلا إذا كان المستخدم مخولاً والصفحة جاهزة
  const tripsRef = useMemoFirebase(() => 
    (isReady && isAuthorized && db) ? collection(db, "busTrips") : null, 
    [db, isAuthorized, isReady]
  );
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  const parcelsRef = useMemoFirebase(() => 
    (isReady && isAuthorized && db) ? collection(db, "parcels") : null, 
    [db, isAuthorized, isReady]
  );
  const { data: parcels, isLoading: isParcelsLoading } = useCollection(parcelsRef);

  const bookingsRef = useMemoFirebase(() => 
    (isReady && isAuthorized && db) ? collectionGroup(db, "bookings") : null, 
    [db, isAuthorized, isReady]
  );
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsRef);

  const stats = useMemo(() => {
    if (!trips || !parcels || !bookings) return { todayTrips: 0, activeParcels: 0, newBookings: 0 };
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return {
      todayTrips: trips.filter(t => t.departureTime?.startsWith(todayStr)).length,
      activeParcels: parcels.filter(p => p.status !== "Delivered").length,
      newBookings: bookings.filter(b => b.bookingDate?.startsWith(todayStr)).length
    };
  }, [trips, parcels, bookings]);

  // واجهة التحميل الأولية
  if (isUserLoading || !isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-pulse">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-primary">جاري تهيئة لوحة الإدارة</h2>
          <p className="text-xs text-muted-foreground font-medium">التحقق من التراخيص الأمنية وقواعد البيانات...</p>
        </div>
      </div>
    );
  }

  // واجهة المنع في حال عدم وجود صلاحيات
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 animate-in fade-in duration-700 px-6">
        <div className="h-24 w-24 rounded-[2rem] bg-red-50 flex items-center justify-center border-2 border-red-100 shadow-xl">
          <Lock className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">منطقة محظورة</h1>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            عذراً، يتطلب الوصول لهذه المنطقة صلاحيات "المدير العام". الحساب الحالي ({user?.email}) غير مدرج في قائمة المسؤولين.
          </p>
        </div>
        <div className="flex flex-col w-full gap-3">
          <Button onClick={() => router.push("/profile")} className="h-14 rounded-2xl font-bold bg-primary shadow-lg">تبديل الحساب</Button>
          <Button variant="ghost" onClick={() => router.push("/")} className="h-12 rounded-xl text-muted-foreground">العودة للرئيسية</Button>
        </div>
      </div>
    );
  }

  const adminModules = [
    { title: "إدارة الرحلات", description: "إضافة وتعديل الرحلات الدولية", icon: Calendar, href: "/admin/trips", color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "إدارة المدن", description: "إضافة وجهات ومحطات جديدة", icon: MapPin, href: "/admin/locations", color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "إدارة الحافلات", description: "إدارة الأسطول والمواصفات", icon: Bus, href: "/admin/buses", color: "text-amber-600", bgColor: "bg-amber-50" },
    { title: "إدارة السائقين", description: "تسجيل السائقين وربط المهام", icon: Users, href: "/admin/drivers", color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { title: "إدارة الطرود", description: "تسجيل وتتبع الشحنات", icon: Package, href: "/admin/parcels", color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "الموظفين", description: "إدارة صلاحيات الوصول", icon: ShieldAlert, href: "/admin/staff", color: "text-red-600", bgColor: "bg-red-50" }
  ];

  const isStatsLoading = isTripsLoading || isParcelsLoading || isBookingsLoading;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-primary/5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-xl font-bold text-primary leading-none">لوحة الإدارة</h1>
            <p className="text-[10px] text-muted-foreground font-bold mt-1">نظام العوجان للسفر | المجلد الرئيسي</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="rounded-xl h-10 border-primary/10">
          <ChevronLeft className="h-4 w-4 ml-1" /> خروج
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group rounded-[2rem] border-primary/5 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl">
              <CardContent className="p-6 flex items-center gap-5">
                <div className={`h-16 w-16 rounded-[1.5rem] ${module.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-white/50`}>
                  <module.icon className={`h-8 w-8 ${module.color}`} />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-lg text-slate-900 leading-none">{module.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5">{module.description}</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-none bg-slate-900 text-white rounded-[2.5rem] overflow-hidden shadow-2xl">
        <CardHeader className="py-5 border-b border-white/5">
          <CardTitle className="text-xs font-black flex items-center gap-2 justify-end opacity-70 uppercase tracking-widest">
             الإحصائيات التشغيلية المباشرة
            <Settings className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 pb-10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <p className="text-[10px] font-bold opacity-50 uppercase">رحلات اليوم</p>
              {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto opacity-20" /> : <p className="text-3xl font-black">{stats.todayTrips}</p>}
            </div>
            <div className="space-y-2 border-x border-white/10">
              <p className="text-[10px] font-bold opacity-50 uppercase">طرود نشطة</p>
              {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto opacity-20" /> : <p className="text-3xl font-black">{stats.activeParcels}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold opacity-50 uppercase">حجوزات اليوم</p>
              {isStatsLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto opacity-20" /> : <p className="text-3xl font-black">{stats.newBookings}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}