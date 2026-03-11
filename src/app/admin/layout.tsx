
"use client"

import { useMemo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, ShieldAlert, Lock, Loader2 } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const ADMIN_EMAILS = ["atlob.co@gmail.com", "alaujantravel@gmail.com"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isReady, setIsReady] = useState(false);
  const isRootAdmin = pathname === "/admin";

  // التحقق من الصلاحيات الإدارية المطلقة (حصرياً بالبريد الإلكتروني الموثق)
  const isAdmin = useMemo(() => {
    if (isUserLoading || !user?.email) return false;
    const email = user.email.toLowerCase();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === email) || email.endsWith("@alawajan.com");
  }, [user, isUserLoading]);

  // التحقق من صلاحيات الموظفين
  const staffQuery = useMemoFirebase(() => {
    if (!db || !user?.email) return null;
    return query(collection(db, "staff_permissions"), where("email", "==", user.email.toLowerCase()));
  }, [db, user?.email]);
  
  const { data: staffData, isLoading: isStaffLoading } = useCollection(staffQuery);
  const isStaff = staffData && staffData.length > 0;

  useEffect(() => {
    // ننتظر حتى ينتهي التحميل تماماً وتستقر الجلسة وتظهر الهوية البريدية
    if (!isUserLoading && !isStaffLoading) {
      const timer = setTimeout(() => setIsReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isUserLoading, isStaffLoading]);

  // واجهة التحميل أثناء فحص التراخيص
  if (isUserLoading || isStaffLoading || !isReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
          <ShieldAlert className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">جاري التحقق من التراخيص</h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Securing Dashboard Session...</p>
        </div>
      </div>
    );
  }

  // واجهة حظر الدخول لغير المخولين (تعتمد على البريد الإلكتروني حصرياً)
  if (!isAdmin && !isStaff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6 px-6">
        <div className="h-24 w-24 rounded-[2.5rem] bg-red-50 flex items-center justify-center border border-red-100 shadow-xl">
          <Lock className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">دخول محظور</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto text-right">
            هذه المنطقة مخصصة للإدارة فقط. حسابك الحالي لا يملك صلاحيات إدارية مرتبطة ببريدك الإلكتروني. يرجى تسجيل الدخول ببريد إداري معتمد.
          </p>
        </div>
        <Button onClick={() => router.push("/profile")} className="h-14 rounded-2xl px-10 font-bold shadow-lg bg-primary">تبديل الحساب</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 -mx-4 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {!isRootAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/admin")}
            className="mb-2 gap-2 text-muted-foreground hover:text-primary transition-colors no-print"
          >
            <ChevronRight className="h-4 w-4" /> العودة للوحة الإدارة
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
