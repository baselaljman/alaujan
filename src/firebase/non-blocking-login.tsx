'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    // avoid logging to console to prevent red overlay
  });
}

/** Setup Recaptcha Verifier */
export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  // تصفية الحاوية من أي محاولات سابقة لمنع الخطأ -39
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  try {
    return new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      }
    });
  } catch (e: any) {
    throw e;
  }
}

/** Send OTP to Phone */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    const finalPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من الرسائل النصية الواصلة لجوالك" });
    return result;
  } catch (error: any) {
    let title = "خطأ في الإرسال";
    let message = "تعذر إرسال الرمز حالياً.";

    // معالجة الخطأ -39 الشهير في بيئة التطوير
    if (error.code?.includes('-39') || error.message?.includes('-39')) {
      title = "خطأ في تصريح النطاق";
      message = "يجب إضافة رابط المعاينة الحالي بالكامل إلى Authorized Domains في إعدادات Firebase Authentication.";
    } else {
      switch (error.code) {
        case 'auth/too-many-requests':
          message = "تم إرسال الكثير من الطلبات لهذا الرقم. يرجى إضافة رقمك كـ 'رقم اختبار' في Firebase Console لتجاوز هذا القيد أثناء التطوير.";
          break;
        case 'auth/invalid-phone-number':
          message = "رقم الهاتف غير صحيح. تأكد من الصيغة الدولية.";
          break;
        case 'auth/unauthorized-domain':
          title = "نطاق غير مصرح به";
          message = "يرجى إضافة النطاق الحالي إلى قائمة Authorized Domains في Firebase.";
          break;
        case 'auth/operation-not-allowed':
          title = "إعدادات Firebase ناقصة";
          message = "يجب تفعيل 'Phone Authentication' من تبويب Sign-in method في Firebase.";
          break;
        default:
          message = error.message || "حدث خطأ تقني، يرجى المحاولة لاحقاً.";
      }
    }
    
    toast({ variant: "destructive", title, description: message });
    throw error;
  }
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في العوجان للسفر" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ في التسجيل", description: error.message });
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      toast({ title: "تم الدخول بنجاح", description: "مرحباً بعودتك" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ في الدخول", description: "تأكد من البريد وكلمة المرور" });
    });
}

/** Send password reset email. */
export function initiatePasswordReset(authInstance: Auth, email: string): void {
  sendPasswordResetEmail(authInstance, email)
    .then(() => {
      toast({ title: "تم إرسال البريد", description: "يرجى التحقق من بريدك لضبط كلمة المرور" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال بريد الاستعادة" });
    });
}

/** Update user password. */
export function initiateUpdatePassword(user: User, newPassword: string): void {
  updatePassword(user, newPassword)
    .then(() => {
      toast({ title: "تم التغيير", description: "تمت تحديث كلمة المرور بنجاح" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى تسجيل الخروج والدخول مرة أخرى لتغيير كلمة المرور" });
    });
}
