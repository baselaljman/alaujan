"use client"

import { useMemo } from "react";
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
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { format } from "date-fns";

const ADMIN_EMAIL = "atlob.co@gmail.com";

export default function AdminDashboard() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  // التحقق من الصلاحيات بناءً على البريد الإلكتروني (بأحرف صغيرة دائماً)
  const isAuthorized = useMemo(() => {
    if (isUserLoading || !user || !user.email) return false;
    
    const email = user.email.toLowerCase();
    const adminEmail = ADMIN_EMAIL.toLowerCase();
    
    // السماح للمدير العام أو أي إيميل ينتهي بنطاق الشركة
    return email === adminEmail || email.endsWith("@alawajan.com");
  }, [user, isUserLoading]);

  // استعلامات البيانات - يتم تفعيلها فقط بعد التأكد من الصلاحيات واستقرار الجلسة
  const tripsRef = useMemoFirebase(() => 
    (isAuthorized && !isUserLoading && db) ? collection(db, "busTrips") : null, 
    [db, isAuthorized, isUserLoading]
  );
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  const parcelsRef = useMemoFirebase(() => 
    (isAuthorized && !isUserLoading && db) ? collection(db, "parcels") : null, 
    [db, isAuthorized, isUserLoading]
  );
  const { data: parcels, isLoading: isParcelsLoading } = useCollection(parcelsRef);

  const bookingsRef = useMemoFirebase(() => 
    (isAuthorized && !isUserLoading && db) ? collectionGroup(db, "bookings") : null, 
    [db, isAuthorized, isUserLoading]
  );
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsRef);

  const stats = useMemo(() => {
    if (!trips || !parcels || !bookings) return { todayTrips: 0, activeParcels: 0, newBookings: 0 };
    
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const todayTripsCount = trips.filter(t => 
      t.departureTime && t.departureTime.startsWith(todayStr)
    ).length;

    const activeParcelsCount = parcels.filter(p => 
      p.status !== "Delivered"
    ).length;

    const todayBookingsCount = bookings.filter(b => 
      b.bookingDate && b.bookingDate.startsWith(todayStr)
    ).length;

    return {
      todayTrips: todayTripsCount,
      activeParcels: activeParcelsCount,
      newBookings: todayBookingsCount
    };
  }, [trips, parcels, bookings]);

  const adminModules = [
    {
      title: "إدارة الرحلات",
      description: "إضافة وتعديل وحذف الرحلات الدولية",
      icon: Calendar,
      href: "/admin/trips",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "إدارة المدن والمحطات",
      description: "إضافة وجهات جديدة ونقاط توقف",
      icon: MapPin,
      href: "/admin/locations",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "إدارة الحافلات",
      description: "إدارة أسطول الحافلات والمواصفات",
      icon: Bus,
      href: "/admin/buses",
      color: "text-amber-600",
      bgColor: "bg-amber-50"
    },
    {
      title: "إدارة السائقين",
      description: "إضافة السائقين وربطهم بالحافلات",
      icon: Users,
      href: "/admin/drivers",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    {
      title: "إدارة الطرود",
      description: "تسجيل وتتبع الشحنات الجديدة",
      icon: Package,
      href: "/admin/parcels",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "الموظفين والصلاحيات",
      description: "منح صلاحيات التعديل للموظفين",
      icon: ShieldAlert,
      href: "/admin/staff",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-bold">جاري التحقق من الهوية...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in fade-in duration-500">
        <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100 shadow-inner">
          <ShieldAlert className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold">غير مصرح لك بالدخول</h1>
        <p className="text-muted-foreground text-sm max-w-xs">عذراً، هذه المنطقة مخصصة لإدارة الشركة فقط. يرجى تسجيل الدخول بحساب المدير: {ADMIN_EMAIL}</p>
        <Button onClick={() => router.push("/")} className="rounded-xl h-12 px-8">العودة للرئيسية</Button>
      </div>
    );
  }

  const isStatsLoading = isTripsLoading || isParcelsLoading || isBookingsLoading;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold font-headline text-primary">لوحة الإدارة</h1>
            <p className="text-xs text-muted-foreground">إدارة نظام العوجان للسياحة والسفر</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/")} className="rounded-xl">
          <ChevronLeft className="h-4 w-4 ml-1" /> العودة للتطبيق
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adminModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group rounded-2xl border-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl ${module.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                  <module.icon className={`h-7 w-7 ${module.color}`} />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-lg">{module.title}</h3>
                  <p className="text-xs text-muted-foreground">{module.description}</p>
                </div>
                <ChevronLeft className="h-5 w-5 text-muted-foreground opacity-50" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-primary/5 bg-primary/5 rounded-[2rem] overflow-hidden">
        <CardHeader className="py-4 bg-primary/10">
          <CardTitle className="text-xs font-bold flex items-center gap-2 justify-end text-primary">
             إحصائيات النظام المباشرة
            <Settings className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-4 rounded-2xl border shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">رحلات اليوم</p>
              {isStatsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <p className="text-xl font-black text-primary">{stats.todayTrips}</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">طرود نشطة</p>
              {isStatsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <p className="text-xl font-black text-primary">{stats.activeParcels}</p>
              )}
            </div>
            <div className="bg-white p-4 rounded-2xl border shadow-sm">
              <p className="text-[10px] font-bold text-muted-foreground mb-1">حجوزات اليوم</p>
              {isStatsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                <p className="text-xl font-black text-primary">{stats.newBookings}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}