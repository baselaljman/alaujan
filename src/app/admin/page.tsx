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

const ADMIN_EMAILS = ["atlob.co@gmail.com", "alaujantravel@gmail.com"];

export default function AdminDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isReady, setIsReady] = useState(false);

  // التحقق الصارم من الصلاحيات للمديرين المعتمدين
  const isAuthorized = useMemo(() => {
    if (isUserLoading || !user?.email) return false;
    const email = user.email.toLowerCase();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.endsWith("@alawajan.com");
  }, [user, isUserLoading]);

  // تأخير الاستعلامات لضمان استقرار الجلسة تماماً (يمنع أخطاء Permissions المؤقتة عند التحميل)
  useEffect(() => {
    if (!isUserLoading && isAuthorized) {
      const timer = setTimeout(() => setIsReady(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isUserLoading, isAuthorized]);

  // استعلامات البيانات - مشروطة بالجاهزية التامة للمدير
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

  // واجهة التحميل أثناء فحص التراخيص
  if (isUserLoading || (isAuthorized && !isReady)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
          <ShieldAlert className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">جاري التحقق من التراخيص</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Establishing Secure Session...</p>
        </div>
      </div>
    );
  }

  // واجهة حظر الدخول لغير المديرين
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 px-6">
        <div className="h-24 w-24 rounded-[2.5rem] bg-red-50 flex items-center justify-center border border-red-100 shadow-xl">
          <Lock className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">دخول محظور</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            هذه المنطقة مخصصة للإدارة فقط. حسابك الحالي لا يملك الصلاحيات الكافية.
          </p>
        </div>
        <Button onClick={() => router.push("/profile")} className="h-14 rounded-2xl px-10 font-bold shadow-lg">تبديل الحساب</Button>
      </div>
    );
  }

  const adminModules = [
    { title: "إدارة الرحلات", description: "إضافة وتعديل الرحلات وكشوف الركاب", icon: Calendar, href: "/admin/trips", color: "text-blue-600", bgColor: "bg-blue-50" },
    { title: "إدارة المدن", description: "إضافة وجهات ومحطات جديدة", icon: MapPin, href: "/admin/locations", color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "إدارة الحافلات", description: "إدارة الأسطول والمواصفات", icon: Bus, href: "/admin/buses", color: "text-amber-600", bgColor: "bg-amber-50" },
    { title: "إدارة السائقين", description: "تسجيل السائقين وربط المهام", icon: Users, href: "/admin/drivers", color: "text-indigo-600", bgColor: "bg-indigo-50" },
    { title: "إدارة الطرود", description: "تسجيل وتتبع الشحنات", icon: Package, href: "/admin/parcels", color: "text-purple-600", bgColor: "bg-purple-50" },
    { title: "الموظفين", description: "إدارة صلاحيات الوصول المتقدمة", icon: ShieldAlert, href: "/admin/staff", color: "text-red-600", bgColor: "bg-red-50" }
  ];

  const isStatsLoading = isTripsLoading || isParcelsLoading || isBookingsLoading;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between bg-white p-5 rounded-[2.5rem] shadow-sm border border-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
            <LayoutDashboard className="h-8 w-8 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-primary leading-none">لوحة الإدارة</h1>
            <p className="text-[10px] text-muted-foreground font-black mt-1.5 uppercase tracking-widest">Al-Awajan Command Center</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="rounded-xl h-12 px-6 font-bold">
          خروج
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {adminModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer rounded-[2.5rem] border-primary/5 bg-white shadow-sm">
              <CardContent className="p-6 flex items-center gap-6">
                <div className={`h-16 w-16 rounded-[1.75rem] ${module.bgColor} flex items-center justify-center shadow-sm`}>
                  <module.icon className={`h-8 w-8 ${module.color}`} />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-black text-lg text-slate-900 leading-tight">{module.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5">{module.description}</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground opacity-20" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-none bg-slate-900 text-white rounded-[3rem] overflow-hidden shadow-2xl relative">
        <CardContent className="pt-10 pb-12">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">رحلات اليوم</p>
              {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /> : <p className="text-4xl font-black">{stats.todayTrips}</p>}
            </div>
            <div className="space-y-2 border-x border-white/10">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">طرود نشطة</p>
              {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /> : <p className="text-4xl font-black">{stats.activeParcels}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">حجوزات اليوم</p>
              {isStatsLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /> : <p className="text-4xl font-black">{stats.newBookings}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}