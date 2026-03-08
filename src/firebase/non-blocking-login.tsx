
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
  // 1. تنظيف أي محاولة سابقة برمجياً وجسدياً في الـ DOM
  if (globalRecaptchaVerifier) {
    try {
      if (typeof globalRecaptchaVerifier.clear === 'function') {
        globalRecaptchaVerifier.clear();
      }
      globalRecaptchaVerifier = null;
    } catch (e) {
      console.warn("Error clearing recaptcha instance:", e);
    }
  }

  // 2. تفريغ الحاوية في الـ DOM تماماً لضمان أنها فارغة 100%
  // هذا هو الحل الجذري لخطأ "reCAPTCHA placeholder element must be empty"
  if (typeof document !== 'undefined') {
    const container = document.getElementById(containerId);
    if (container) {
      // حذف كافة العناصر الأبناء برمجياً لضمان الفراغ المطلق
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.innerHTML = ''; 
    }
  }

  // 3. إنشاء المحرك الجديد بحجم "invisible" لتقليل ظهور الصور
  try {
    globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        toast({ title: "انتهت صلاحية التحقق", description: "يرجى إعادة المحاولة" });
      }
    });
  } catch (error: any) {
    console.error("Failed to construct RecaptchaVerifier:", error);
    throw error;
  }
  
  return globalRecaptchaVerifier;
}

/** Send OTP to Phone */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    const finalPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // التأكد من أن المحرك جاهز ومنظف
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

    // معالجة الأخطاء الشائعة لتوجيه المستخدم
    if (error.code === 'auth/too-many-requests') {
      title = "تم حظر الرقم مؤقتاً";
      message = "لقد قمت بمحاولات كثيرة جداً. يرجى الانتظار ساعة أو إضافة رقمك كـ 'رقم اختبار' في Firebase Console.";
    } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized')) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'هذا النطاق';
      title = "نطاق غير مصرح به";
      message = `يجب إضافة الرابط التالي في Firebase Console (Authorized Domains):\n${currentOrigin}`;
    } else if (error.message?.includes('placeholder')) {
      title = "خطأ في تهيئة الحماية";
      message = "حدث تعارض في تحميل أداة التحقق. يرجى تحديث الصفحة (Refresh) والمحاولة مرة أخرى.";
    } else if (error.code === 'auth/invalid-phone-number') {
      title = "رقم هاتف غير صحيح";
      message = "يرجى التأكد من كتابة الرقم بشكل صحيح مع مفتاح الدولة.";
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
