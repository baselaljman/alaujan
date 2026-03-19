# العوجان للسياحة والسفر | Al-Awajan Travel

تطبيق متطور لحجز الرحلات الدولية والطرود، مصمم ليعمل كـ Web App و Mobile App (Android/iOS) بهوية بصرية فاخرة.

## 🚀 حل مشكلة الرفع على GitHub (خطأ 403 Forbidden)

إذا واجهت خطأ `Permission denied` أو `403` عند الرفع، اتبع هذه الخطوات البرمجية الدقيقة:

1. **تحديث رابط المستودع مع التوكن (Token):**
   نفذ هذا الأمر في Terminal (استبدل `<YOUR_TOKEN>` بالتوكن الحقيقي الذي أنشأته من إعدادات GitHub):
   ```bash
   git remote set-url origin https://<YOUR_TOKEN>@github.com/baselaljman/alaujan.git
   ```

2. **الرفع النهائي:**
   ```bash
   git push -u origin main
   ```

## 🛠 ملاحظات تقنية للمطورين
- **Next.js Config**: تم استخدام `transpilePackages` لضمان توافق مكتبات Capacitor مع نظام ESM ونجاح عملية الـ Build في Vercel.
- **Android Support**: تم ضبط `AndroidManifest.xml` ليبدأ من السطر الأول تماماً لضمان التوافق مع Android Studio.
- **Geolocation**: يعتمد التطبيق على `@capacitor-community/background-geolocation` للبث المباشر للموقع في الخلفية.

---
© 2024 العوجان للسياحة والسفر - جميع الحقوق محفوظة.# alaujan
