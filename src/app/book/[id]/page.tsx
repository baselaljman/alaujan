
import { redirect } from "next/navigation";

/**
 * @fileOverview صفحة تحويل للمسارات الديناميكية لضمان التوافق مع التصدير الثابت (Static Export).
 * يتطلب Next.js وجود generateStaticParams عند استخدام output: export.
 */

export function generateStaticParams() {
  // نقوم بتوليد مسار افتراضي واحد على الأقل لإرضاء معالج البناء (Build)
  return [{ id: "select" }];
}

export default async function BookTripRedirect(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  // التحويل إلى المسار الجديد الذي يستخدم Query Parameters المتوافق مع التصدير الثابت
  redirect(`/book?id=${id}`);
}
