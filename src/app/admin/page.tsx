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
  const firestore = firestoreInstance(); // استخدام الدالة من الفايربيس
  const { user, isUserLoading } = useUser();

  // التحقق مما إذا كان المستخدم مديراً أو موظفاً
  const isAuthorized = useMemo(() => {
    if (!user) return false;
    return user.email === ADMIN_EMAIL || user.email?.endsWith("@alawajan.com");
  }, [user]);

  // استخدام فايرستور من الهوك بشكل صحيح
  const db = useFirestore();

  const tripsRef = useMemoFirebase(() => isAuthorized ? collection(db, "busTrips") : null, [db, isAuthorized]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  const parcelsRef = useMemoFirebase(() => isAuthorized ? collection(db, "parcels") : null, [db, isAuthorized]);
  const { data: parcels, isLoading: isParcelsLoading } = useCollection(parcelsRef);

  const bookingsRef = useMemoFirebase(() => isAuthorized ? collectionGroup(db, "bookings") : null, [db, isAuthorized]);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsRef);

  const stats = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    const todayTripsCount = trips?.filter(t => 
      t.departureTime && t.departureTime.startsWith(todayStr)
    ).length || 0;

    const activeParcelsCount = parcels?.filter(p => 
      p.status !== "Delivered"
    ).length || 0;

    const todayBookingsCount = bookings?.filter(b => 
      b.bookingDate && b.bookingDate.startsWith(todayStr)
    ).length || 0;

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

  const isLoading = isUserLoading || isTripsLoading || isParcelsLoading || isBookingsLoading;

  if (isUserLoading) return <div className="flex justify-center p-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h1 className="text-xl font-bold">غير مصرح لك بالدخول</h1>
        <p className="text-muted-foreground text-sm">هذه الصفحة مخصصة لمدراء النظام فقط.</p>
        <Button onClick={() => router.push("/")}>العودة للرئيسية</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
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
            <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl ${module.bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
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

      <Card className="border-primary/5 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2 justify-end">
             إحصائيات النظام الحقيقية
            <Settings className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white p-3 rounded-xl border">
              <p className="text-[10px] text-muted-foreground">رحلات اليوم</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
              ) : (
                <p className="text-lg font-black text-primary">{stats.todayTrips}</p>
              )}
            </div>
            <div className="bg-white p-3 rounded-xl border">
              <p className="text-[10px] text-muted-foreground">طرود نشطة</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
              ) : (
                <p className="text-lg font-black text-primary">{stats.activeParcels}</p>
              )}
            </div>
            <div className="bg-white p-3 rounded-xl border">
              <p className="text-[10px] text-muted-foreground">حجوزات اليوم</p>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
              ) : (
                <p className="text-lg font-black text-primary">{stats.newBookings}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function firestoreInstance() {
  // دالة مساعدة لتجنب أخطاء التهيئة المبكرة
  try {
    const { getFirestore } = require('firebase/firestore');
    const { getApp } = require('firebase/app');
    return getFirestore(getApp());
  } catch (e) {
    return null as any;
  }
}
