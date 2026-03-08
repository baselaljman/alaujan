# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🛠 التقنيات المستخدمة (Tech Stack)
- **الإطار الأساسي (Framework)**: Next.js 15 (App Router).
- **مكتبة الواجهة (UI Library)**: React 19.
- **التصميم (Styling)**: Tailwind CSS مع مكونات Shadcn UI.
- **قواعد البيانات (Backend)**: Firebase (Firestore & Authentication).
- **الجوال (Mobile)**: Capacitor JS (لتحويل كود الويب إلى تطبيقات أصيلة Android/iOS).

## 🎨 الهوية البصرية
- **الألوان**: أخضر زمردي ملكي (Primary) وذهبي كلاسيكي (Accent).
- **الخطوط**: Noto Sans Arabic (للعربية) و Inter (للأرقام والإنجليزية).
- **التصميم**: يدعم RTL بالكامل، تصميم Mobile-first، حواف مستديرة (2xl).

## 🚀 تعليمات التشغيل والبناء
1. **بيئة التطوير**: `npm run dev` للتشغيل على المتصفح (Port 9002).
2. **بناء وتصدير ملفات الجوال**:
   - يجب أولاً تشغيل `npm run build` لإنتاج مجلد `out`.
   - لمزامنة التغييرات مع الأندرويد: `npx cap sync`.
   - لفتح المشروع في Android Studio: `npx cap open android`.

## 📌 ملاحظات هامة
- التطبيق يستخدم **Static Export** لضمان أعلى توافقية مع تطبيقات الجوال.
- تم تعطيل ميزات Server Actions لضمان عمل التطبيق بدون الحاجة لسيرفر Node.js نشط (Serverless).
- التحقق من رقم الهاتف يتطلب إضافة النطاق (Domain) في Firebase Console تحت Authorized Domains.

---
تم إعداد هذا الملف ليكون مرجعاً تقنياً لمشروع العوجان للسياحة والسفر.