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

let globalRecaptchaVerifier: any = null;

/** تهيئة تسجيل الدخول المجهول لتأمين الجلسة */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    // فشل صامت لا يؤثر على المستخدم
  });
}

/** تهيئة reCAPTCHA مع تنظيف شامل للمتصفح لمنع خطأ الإرسال وتداخل المحركات */
export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  if (typeof document === 'undefined') return null as any;

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = ''; 
  }

  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch (e) {}
    globalRecaptchaVerifier = null;
  }

  try {
    globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': () => {},
      'expired-callback': () => {
        if (globalRecaptchaVerifier) globalRecaptchaVerifier.clear();
        globalRecaptchaVerifier = null;
      }
    });
  } catch (error: any) {
    throw error;
  }
  
  return globalRecaptchaVerifier;
}

/** إرسال رمز التحقق للهاتف مع معالجة الأخطاء الذكية */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    let finalPhone = phoneNumber.trim();
    if (!finalPhone.startsWith('+')) {
      finalPhone = `+${finalPhone.replace(/^0+/, '')}`;
    }

    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    toast({ title: "تم إرسال الرمز بنجاح", description: "يرجى التحقق من رسائل SMS" });
    return result;
  } catch (error: any) {
    let msg = "فشل في الإرسال، يرجى تحديث الصفحة والمحاولة مرة أخرى.";
    if (error.code === 'auth/too-many-requests') msg = "محاولات كثيرة جداً، يرجى الانتظار قليلاً.";
    
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