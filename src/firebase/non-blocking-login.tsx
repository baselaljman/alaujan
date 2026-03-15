
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

// متغير عالمي لتتبع محقق reCAPTCHA لمنع التداخل وتكرار التهيئة
let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

/** تهيئة تسجيل الدخول المجهول لتأمين الجلسة الابتدائية */
export async function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  try {
    await signInAnonymously(authInstance);
  } catch (error) {
    console.warn("Anonymous Sign-in skipped or failed");
  }
}

/** 
 * تهيئة reCAPTCHA مع تنظيف شامل للمتصفح.
 * تتضمن التحقق من وجود الحاوية في الـ DOM وتدمير أي نسخة سابقة (حل الخطأ -39).
 */
export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') return null as any;

  // 1. تدمير كائن المحقق القديم في الذاكرة إذا وجد لمنع التداخل (إصلاح الخطأ -39)
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch (e) {
      console.warn("Error clearing previous recaptcha instance:", e);
    }
    globalRecaptchaVerifier = null;
  }

  // 2. التحقق من وجود الحاوية في الـ DOM قبل البدء
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`reCAPTCHA container with id "${containerId}" not found in DOM.`);
    return null as any;
  }

  // 3. تنظيف الحاوية البصرية تماماً من أي بقايا HTML سابقة
  container.innerHTML = ''; 

  try {
    // 4. إنشاء محقق جديد بإعدادات غير مرئية
    globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': (response: any) => {
        // تم التحقق بنجاح
      },
      'expired-callback': () => {
        if (globalRecaptchaVerifier) globalRecaptchaVerifier.clear();
        globalRecaptchaVerifier = null;
      }
    });
    
    return globalRecaptchaVerifier;
  } catch (error: any) {
    console.error("Recaptcha Initialization Failed:", error);
    throw error;
  }
}

/** 
 * إرسال رمز التحقق (OTP) للهاتف مع معالجة ذكية للأرقام.
 */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    if (!appVerifier) {
      throw new Error("Verifier not initialized");
    }

    let finalPhone = phoneNumber.trim();
    
    // تصحيح الرقم: حذف الصفر الزائد (مثلاً يحول 05 إلى +9665)
    if (finalPhone.includes('+9660')) {
      finalPhone = finalPhone.replace('+9660', '+966');
    } else if (finalPhone.includes('+9630')) {
      finalPhone = finalPhone.replace('+9630', '+963');
    } else if (!finalPhone.startsWith('+')) {
      if (finalPhone.startsWith('0')) {
        finalPhone = finalPhone.substring(1);
      }
      // افتراض السعودية إذا لم يبدأ بمفتاح
      finalPhone = `+966${finalPhone}`;
    }

    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من رسائل SMS على هاتفك" });
    return result;
  } catch (error: any) {
    console.error("SMS Send Error:", error);
    let msg = "تعذر إرسال الرمز. يرجى المحاولة مرة أخرى.";
    
    if (error.code === 'auth/too-many-requests') {
      msg = "تم إرسال محاولات كثيرة لهذا الرقم. يرجى المحاولة بعد ساعة.";
    } else if (error.code === 'auth/invalid-phone-number') {
      msg = "رقم الهاتف غير صحيح، يرجى كتابته بدون أصفار زائدة.";
    } else if (error.code === 'auth/captcha-check-failed' || error.message.includes('-39')) {
      msg = "حدث تداخل في نظام الأمان، يرجى تحديث الصفحة والمحاولة مرة أخرى.";
    }
    
    toast({ variant: "destructive", title: "فشل في الإرسال", description: msg });
    throw error;
  }
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في العوجان للسفر" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ في التسجيل", description: error.message });
    });
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      toast({ title: "تم الدخول بنجاح", description: "مرحباً بعودتك" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ في الدخول", description: "تأكد من البريد وكلمة المرور" });
    });
}

export function initiatePasswordReset(authInstance: Auth, email: string): void {
  sendPasswordResetEmail(authInstance, email)
    .then(() => {
      toast({ title: "تم إرسال البريد", description: "يرجى التحقق من بريدك لضبط كلمة المرور" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال بريد الاستعادة" });
    });
}

export function initiateUpdatePassword(user: User, newPassword: string): void {
  updatePassword(user, newPassword)
    .then(() => {
      toast({ title: "تم التغيير", description: "تمت تحديث كلمة المرور بنجاح" });
    })
    .catch(error => {
      toast({ variant: "destructive", title: "خطأ", description: "يرجى تسجيل الخروج والدخول مرة أخرى" });
    });
}
