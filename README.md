
# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🛠 التقنيات المستخدمة (Tech Stack)
- **الإطار الأساسي (Framework)**: Next.js 15 (App Router).
- **مكتبة الواجهة (UI Library)**: React 19.
- **التصميم (Styling)**: Tailwind CSS مع مكونات Shadcn UI.
- **قواعد البيانات (Backend)**: Firebase (Firestore & Authentication).
- **الجوال (Mobile)**: Capacitor JS.

---

## 🚀 دليل تحويل التطبيق إلى أندرويد (خطوة بخطوة)

لتحويل هذا المشروع إلى تطبيق أندرويد وتشغيله على المحاكي، اتبع الخطوات التالية بدقة:

### 1. تجهيز المكتبات الأساسية
تأكد من تثبيت كافة الاعتمادات الخاصة بـ Capacitor (تمت إضافتها بالفعل في `package.json`):
```bash
npm install
```

### 2. بناء ملفات الويب (Build)
يجب تحويل كود React إلى ملفات ثابتة يفهمها الأندرويد:
```bash
npm run build
```
*سيظهر لك مجلد جديد باسم `out` في جذر المشروع.*

### 3. إضافة منصة الأندرويد
قم بإنشاء مجلد مشروع الأندرويد داخل التطبيق:
```bash
npx cap add android
```

### 4. إعدادات Firebase للأندرويد (مهم جداً)
- اذهب إلى مجلد المشروع وابحث عن ملف `google-services.json`.
- قم بنسخه ولصقه في المسار التالي داخل مجلد الأندرويد الجديد:
  `android/app/google-services.json`

### 5. تفعيل تصاريح الموقع الجغرافي
افتح ملف `android/app/src/main/AndroidManifest.xml` وأضف هذه الأسطر قبل وسم `<application>`:
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.location.gps" />
```

### 6. مزامنة الملفات (Sync)
لنقل ملفات الويب (HTML/JS) والإعدادات إلى مجلد الأندرويد:
```bash
npx cap sync
```

### 7. التشغيل على المحاكي
افتح المشروع في Android Studio للبدء بالبناء النهائي والتشغيل:
```bash
npx cap open android
```
- من داخل Android Studio، اختر المحاكي (Emulator) ثم اضغط على زر **Run (السهم الأخضر)**.

---

## 📌 ملاحظات تقنية هامة
- تم ضبط `next.config.ts` ليعمل بنظام `output: 'export'` لضمان التوافق مع تطبيقات الجوال.
- تم ضبط `capacitor.config.ts` ليوجه مسار الويب إلى مجلد `out`.
- في حال قمت بأي تعديل على الكود البرمجي، يجب عليك دائماً تشغيل `npm run build` ثم `npx cap sync` لتظهر التعديلات في التطبيق.
# alaujan
# alaujan
# alaujan
# alaujan
# alaujan
# alaujan
