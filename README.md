
# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🛠 التقنيات المستخدمة (Tech Stack)
- **الإطار الأساسي (Framework)**: Next.js 15 (App Router).
- **مكتبة الواجهة (UI Library)**: React 19.
- **التصميم (Styling)**: Tailwind CSS مع مكونات Shadcn UI.
- **قواعد البيانات (Backend)**: Firebase (Firestore & Authentication).
- **الجوال (Mobile)**: Capacitor JS.

## 🎨 الهوية البصرية
- **الألوان**: أخضر زمردي ملكي (Primary) وذهبي كلاسيكي (Accent).
- **الخطوط**: Noto Sans Arabic.
- **التصميم**: يدعم RTL بالكامل، تصميم Mobile-first.

## 🚀 خطوات تجهيز وبناء الأندرويد
لضمان عمل التطبيق كـ APK بنجاح، اتبع الخطوات التالية بالترتيب:

1. **البناء والتصدير**:
   - شغّل `npm run build`. سينتج مجلد `out`.
2. **إضافة منصة الأندرويد**:
   - شغّل `npx cap add android`.
3. **تجهيز خدمات Firebase (مهم جداً)**:
   - قم بنسخ ملف `google-services.json` من جذر المشروع وضعه في المسار التالي:
     `android/app/google-services.json`.
4. **تفعيل تصاريح الموقع الجغرافي**:
   - افتح ملف `android/app/src/main/AndroidManifest.xml` وأضف الأسطر التالية داخل وسم `<manifest>`:
     ```xml
     <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
     <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
     <uses-feature android:name="android.hardware.location.gps" />
     ```
5. **المزامنة والتشغيل**:
   - شغّل `npx cap sync`.
   - شغّل `npx cap open android` لفتح المشروع في Android Studio والبناء النهائي.

## 📌 ملاحظات تقنية
- تم تعطيل Server Actions واستخدام Firebase Client SDK لضمان التوافق مع التصدير الثابت.
- يجب إضافة رابط الـ Origin الخاص بالتطبيق في Firebase Console تحت "Authorized Domains" ليعمل التحقق من الهاتف.
