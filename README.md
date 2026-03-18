# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🚀 حل مشكلة رفع المشروع على GitHub (403 Forbidden)

إذا واجهت خطأ `Permission denied to baselaljman` بالرغم من استخدام التوكن، اتبع هذه الخطوات:

1. **التأكد من صلاحيات التوكن (PAT):**
   - عند إنشاء التوكن في GitHub، تأكد من اختيار صلاحية `repo` (Full control of private repositories).
   - تأكد من أنك قمت بنسخ التوكن بالكامل.

2. **تحديث الرابط وحذف التخزين المؤقت:**
   نفذ الأمر التالي في Terminal (استبدل `<YOUR_TOKEN>` بالتوكن الحقيقي):
   ```bash
   git remote set-url origin https://<YOUR_TOKEN>@github.com/baselaljman/alaujan.git
   ```

3. **الرفع النهائي:**
   ```bash
   git push -u origin main
   ```

## 🛠 التقنيات المستخدمة
- **الإطار الأساسي**: Next.js 15 (App Router).
- **الجوال**: Capacitor JS.

## 📌 ملاحظات تقنية للإدارة
- تم ضبط `next.config.ts` لتجاهل أخطاء التتبع أثناء البناء لضمان نجاح التصدير الثابت (`next build`).
- ملف `AndroidManifest.xml` يبدأ من السطر الأول تماماً لحل مشاكل التوافق مع Android Studio.
