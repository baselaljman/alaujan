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
 * تخزين موثق Recaptcha بشكل عالمي في الملف للسماح بتنظيفه 
 * وتجنب الخطأ -39 (تكرار التحميل)
 */
let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    // avoid logging to console to prevent red overlay
  });
}

/** Setup Recaptcha Verifier */
export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  // تنظيف أي محاولة سابقة بشكل قطعي لمنع الخطأ -39
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
      globalRecaptchaVerifier = null;
    } catch (e) {}
  }

  // تفريغ الحاوية في الـ DOM لضمان عدم وجود بقايا محركات سابقة
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  try {
    globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': () => {
        // تم حل التحدي بنجاح
      },
      'expired-callback': () => {
        toast({ title: "انتهت صلاحية التحقق", description: "يرجى إعادة المحاولة" });
      }
    });
    return globalRecaptchaVerifier;
  } catch (e: any) {
    throw e;
  }
}

/** Send OTP to Phone */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    const finalPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // إجبار المحرك على التحميل الأولي لتجنب خطأ التوقيت
    await appVerifier.render();
    
    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    
    toast({ 
      title: "تم إرسال الرمز بنجاح", 
      description: "ستصلك رسالة نصية (SMS) خلال لحظات." 
    });
    
    return result;
  } catch (error: any) {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const cleanOrigin = currentOrigin.replace('https://', '').replace('http://', '');
    
    let title = "فشل في الإرسال";
    let message = error.message || "تعذر إرسال الرسالة حالياً.";

    if (error.code === 'auth/too-many-requests') {
      title = "تم حظر الرقم مؤقتاً";
      message = "لقد قمت بمحاولات كثيرة جداً. يرجى الانتظار 30 دقيقة أو استخدام رقم اختبار بكود ثابت.";
    } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized') || error.message?.includes('-39')) {
      title = "مشكلة في تصريح النطاق";
      message = `يجب أن تتأكد من إضافة هذا النطاق بدقة في Firebase Console تحت (Authorized Domains):\n\n${cleanOrigin}`;
    } else if (error.code === 'auth/invalid-phone-number') {
      message = "صيغة الرقم غير صحيحة. يرجى التأكد من إدخال الرقم بشكل سليم.";
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
