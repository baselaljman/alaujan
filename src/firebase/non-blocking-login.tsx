
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
  // 1. التحقق إذا كان المحرك موجوداً ومستقراً بالفعل لتجنب إعادة التهيئة المسببة للخطأ -39
  if (globalRecaptchaVerifier) {
    try {
      // إذا كان المحرك لا يزال مرتبطاً بنفس الحاوية، نعيده مباشرة
      return globalRecaptchaVerifier;
    } catch (e) {
      // إذا حدث خطأ، نقوم بالتنظيف
      if (typeof globalRecaptchaVerifier.clear === 'function') {
        globalRecaptchaVerifier.clear();
      }
      globalRecaptchaVerifier = null;
    }
  }

  // 2. تفريغ الحاوية في الـ DOM تماماً لضمان أنها فارغة 100%
  if (typeof document !== 'undefined') {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = ''; 
    }
  }

  // 3. إنشاء المحرك الجديد
  try {
    globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        toast({ title: "انتهت صلاحية التحقق", description: "يرجى إعادة المحاولة" });
        if (globalRecaptchaVerifier) globalRecaptchaVerifier.clear();
        globalRecaptchaVerifier = null;
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
      message = "لقد قمت بمحاولات كثيرة جداً. يرجى الانتظار قليلاً أو تحديث الصفحة.";
    } else if (error.message?.includes('placeholder') || error.message?.includes('-39')) {
      // في حال حدوث الخطأ رغم التنظيف، نطلب تحديث الصفحة كحل نهائي للمتصفح
      title = "تداخل في الحماية";
      message = "يرجى تحديث الصفحة (Refresh) والمحاولة مرة أخرى لضمان استقرار الأداة.";
      // تصفير المحرك للمحاولة القادمة
      if (globalRecaptchaVerifier) {
        try { globalRecaptchaVerifier.clear(); } catch(e) {}
        globalRecaptchaVerifier = null;
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
      toast({ variant: "destructive", title: "خطأ", description: "يرجى تسجيل الخروج والدخول مرة أخرى" });
    });
}
