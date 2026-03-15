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

let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

export async function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  try {
    await signInAnonymously(authInstance);
  } catch (error) {
    console.warn("Anonymous Sign-in skipped or failed");
  }
}

export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') return null as any;

  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch (e) {
      console.warn("Error clearing previous recaptcha instance:", e);
    }
    globalRecaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`reCAPTCHA container with id "${containerId}" not found.`);
    return null as any;
  }

  container.innerHTML = ''; 

  try {
    globalRecaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: 'invisible',
      'callback': (response: any) => {},
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

export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    if (!appVerifier) throw new Error("Verifier not initialized");

    let finalPhone = phoneNumber.trim();
    
    if (finalPhone.includes('+9660')) {
      finalPhone = finalPhone.replace('+9660', '+966');
    } else if (finalPhone.includes('+9630')) {
      finalPhone = finalPhone.replace('+9630', '+963');
    } else if (!finalPhone.startsWith('+')) {
      if (finalPhone.startsWith('0')) finalPhone = finalPhone.substring(1);
      finalPhone = `+966${finalPhone}`;
    }

    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من رسائل SMS على هاتفك" });
    return result;
  } catch (error: any) {
    console.error("SMS Send Error:", error);
    let msg = "تعذر إرسال الرمز. يرجى المحاولة مرة أخرى.";
    if (error.code === 'auth/too-many-requests') msg = "محاولات كثيرة جداً. جرب لاحقاً.";
    if (error.code === 'auth/captcha-check-failed' || error.message.includes('-39')) {
      msg = "حدث تداخل في نظام الأمان، يرجى تحديث الصفحة والمحاولة مرة أخرى.";
    }
    toast({ variant: "destructive", title: "فشل الإرسال", description: msg });
    throw error;
  }
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في العوجان للسفر" }))
    .catch(error => toast({ variant: "destructive", title: "خطأ", description: error.message }));
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .then(() => toast({ title: "تم الدخول بنجاح", description: "مرحباً بعودتك" }))
    .catch(error => toast({ variant: "destructive", title: "خطأ", description: "تأكد من البريد وكلمة المرور" }));
}

export function initiatePasswordReset(authInstance: Auth, email: string): void {
  sendPasswordResetEmail(authInstance, email)
    .then(() => toast({ title: "تم إرسال البريد", description: "تحقق من بريدك لضبط كلمة المرور" }))
    .catch(error => toast({ variant: "destructive", title: "خطأ", description: "فشل إرسال البريد" }));
}

export function initiateUpdatePassword(user: User, newPassword: string): void {
  updatePassword(user, newPassword)
    .then(() => toast({ title: "تم التغيير", description: "تمت تحديث كلمة المرور" }))
    .catch(error => toast({ variant: "destructive", title: "خطأ", description: "يرجى إعادة الدخول" }));
}