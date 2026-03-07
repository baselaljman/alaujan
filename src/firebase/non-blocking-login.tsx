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
    
    toast({ 
      title: "تم إرسال الرمز بنجاح", 
      description: "ستصلك رسالة نصية (SMS) على جوالك خلال لحظات." 
    });
    
    return result;
  } catch (error: any) {
    let title = "فشل في الإرسال";
    let message = error.message || "تعذر إرسال الرسالة حالياً.";

    const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

    if (error.code === 'auth/too-many-requests') {
      title = "تم حظر الرقم مؤقتاً";
      message = "لقد قمت بمحاولات كثيرة. يرجى الانتظار لمدة ساعة أو إضافة هذا الرقم كـ 'رقم اختبار' في Firebase Console.";
    } else if (error.code === 'auth/unauthorized-domain' || error.code?.includes('-39') || error.message?.includes('-39')) {
      title = "نطاق غير مسجل";
      message = `يجب إضافة النطاق التالي في Authorized Domains بـ Firebase: ${currentHostname}`;
    } else if (error.code === 'auth/operation-not-allowed') {
      title = "الخدمة غير مفعلة";
      message = "يرجى تفعيل 'Phone Authentication' من تبويب Sign-in method في Firebase.";
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
