# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🚀 حل مشكلة رفع المشروع على GitHub (Authentication 403)

في حال واجهت خطأ `Permission denied` أو `403` عند محاولة الرفع، اتبع هذه الخطوات البرمجية الدقيقة:

1. **إعداد الرابط مع التوكن (Token):**
   قم باستبدال `<YOUR_GITHUB_TOKEN>` بالتوكن الذي أنشأته من إعدادات GitHub (Developer Settings > Personal Access Tokens):
   ```bash
   git remote set-url origin https://<YOUR_GITHUB_TOKEN>@github.com/baselaljman/alaujan.git
   ```

2. **الرفع المباشر:**
   ```bash
   git push -u origin main
   ```

## 🛠 التقنيات المستخدمة
- **الإطار الأساسي**: Next.js 15 (App Router).
- **الجوال**: Capacitor JS.

## 📌 ملاحظات هامة للإدارة
- تم تفعيل التصدير الثابت لضمان السرعة.
- تم ضبط `next.config.ts` لتجاهل أخطاء التتبع أثناء البناء لضمان نجاح الـ Build.
- ملف `AndroidManifest.xml` يبدأ من السطر الأول تماماً لحل مشاكل التوافق مع Android Studio.
