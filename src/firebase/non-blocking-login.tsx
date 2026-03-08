
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

/** 
 * تخزين موثق Recaptcha بشكل عالمي للسماح بتنظيفه 
 * وتجنب الخطأ -39 والخطأ placeholder must be empty
 */
let globalRecaptchaVerifier: any = null;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    // ignore
  });
}

/** Setup Recaptcha Verifier */
export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  // 1. تنظيف أي محاولة سابقة برمجياً
  if (globalRecaptchaVerifier) {
    try {
      if (typeof globalRecaptchaVerifier.clear === 'function') {
        globalRecaptchaVerifier.clear();
      }
      globalRecaptchaVerifier = null;
    } catch (e) {
      console.warn("Error clearing recaptcha:", e);
    }
  }

  // 2. تفريغ الحاوية في الـ DOM تماماً لضمان أنها فارغة 100%
  // هذا يحل خطأ "reCAPTCHA placeholder element must be empty"
  if (typeof document !== 'undefined') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = ''; 
    }
  }

  // 3. إنشاء المحرك الجديد بحجم "invisible" لتقليل ظهور الصور
  globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
    size: 'invisible',
    'callback': () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      toast({ title: "انتهت صلاحية التحقق", description: "يرجى إعادة المحاولة" });
    }
  });
  
  return globalRecaptchaVerifier;
}

/** Send OTP to Phone */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    const finalPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // التأكد من أن المحرك جاهز
    await appVerifier.render();
    
    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    
    toast({ 
      title: "تم إرسال الرمز بنجاح", 
      description: "ستصلك رسالة نصية (SMS) خلال لحظات." 
    });
    
    return result;
  } catch (error: any) {
    let title = "فشل في الإرسال";
    let message = error.message || "تعذر إرسال الرسالة حالياً.";

    if (error.code === 'auth/too-many-requests') {
      title = "تم حظر الرقم مؤقتاً";
      message = "لقد قمت بمحاولات كثيرة جداً. يرجى الانتظار أو استخدام رقم اختبار.";
    } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized')) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'this domain';
      title = "نطاق غير مصرح به";
      message = `يجب إضافة الرابط التالي في Firebase Console:\n${currentOrigin}`;
    } else if (error.message?.includes('placeholder')) {
      title = "خطأ في تحميل المحرك";
      message = "يرجى تحديث الصفحة والمحاولة مرة أخرى.";
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
      toast({ variant: "destructive", title: "خطأ", description: "يرجى تسجيل الخروج والدخول مرة أخرى" });
    });
}
