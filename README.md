# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🛠 التقنيات المستخدمة (Tech Stack)
- **الإطار الأساسي (Framework)**: Next.js 15 (App Router).
- **الجوال (Mobile)**: Capacitor JS.

---

## 🚀 دليل رفع المشروع على GitHub (حل مشكلة Authentication)

في حال واجهت خطأ `Authentication failed` عند استخدام `git push` في Firebase Studio، اتبع هذه الأوامر بالترتيب:

1. **تحديث رابط المستودع بالتوكن (Token):**
   قم باستبدال `<YOUR_GITHUB_TOKEN>` بالتوكن الذي أنشأته من إعدادات GitHub:
   ```bash
   git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/baselaljman/alaujan.git
   ```

2. **الرفع مرة أخرى:**
   ```bash
   git push -u origin main
   ```

---

## 📱 دليل بناء تطبيق الأندرويد

1. **بناء ملفات الويب:**
   ```bash
   npm run build
   ```
2. **مزامنة الملفات مع الأندرويد:**
   ```bash
   npx cap sync
   ```
3. **التشغيل من خلال Android Studio:**
   ```bash
   npx cap open android
   ```

## 📌 ملاحظات هامة
- تم ضبط `next.config.ts` لتجاهل مكتبات الموبايل أثناء البناء لضمان نجاح التصدير الثابت.
- يجب تفعيل صلاحية "الموقع دائماً" (Always Allow) في إعدادات الهاتف ليعمل البث في الخلفية.
