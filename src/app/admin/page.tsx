
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
  ShieldAlert,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, collectionGroup } from "firebase/firestore";
import { format } from "date-fns";

export default function AdminDashboard() {
  const router = useRouter();
  const firestore = useFirestore();

  const tripsRef = useMemoFirebase(() => collection(firestore, "busTrips"), [firestore]);
  const { data: trips, isLoading: isTripsLoading } = useCollection(tripsRef);

  const parcelsRef = useMemoFirebase(() => collection(firestore, "parcels"), [firestore]);
  const { data: parcels, isLoading: isParcelsLoading } = useCollection(parcelsRef);

  // استخدام collectionGroup لجلب جميع الحجوزات من كافة مجموعات المستخدمين الفرعية لإحصائيات المدير
  const bookingsRef = useMemoFirebase(() => collectionGroup(firestore, "bookings"), [firestore]);
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

  const isLoading = isTripsLoading || isParcelsLoading || isBookingsLoading;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <div>
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
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Settings className="h-4 w-4" />
            إحصائيات النظام الحقيقية
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
