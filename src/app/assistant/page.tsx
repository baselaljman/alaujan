
"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * صفحة فارغة بعد حذف المساعد الآلي.
 * تقوم بتحويل المستخدم تلقائياً للرئيسية في حال الوصول إليها برابط مباشر.
 */
export default function AssistantPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
      جاري التحويل...
    </div>
  );
}
