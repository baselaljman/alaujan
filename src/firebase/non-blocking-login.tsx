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

/** تهيئة تسجيل الدخول المجهول لتأمين الجلسة وتصديرها بشكل صريح */
export async function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  try {
    await signInAnonymously(authInstance);
  } catch (error) {
    console.warn("Anonymous Sign-in skipped or failed");
  }
}

/** تهيئة reCAPTCHA مع تنظيف شامل للمتصفح لمنع خطأ الإرسال وتداخل المحركات */
export function setupRecaptcha(authInstance: Auth, containerId: string): RecaptchaVerifier {
  if (typeof window === 'undefined') return null as any;

  // تنظيف الحاوية تماماً من أي محاولات سابقة
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = ''; 
  }

  // تدمير المحقق القديم إذا وجد لمنع الخطأ -39
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch (e) {}
    globalRecaptchaVerifier = null;
  }

  try {
    // إنشاء محقق جديد بإعدادات متوافقة مع أندرويد وويب
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
    
    // فرض التصيير لضمان الجاهزية
    globalRecaptchaVerifier.render();
    
    return globalRecaptchaVerifier;
  } catch (error: any) {
    console.error("Recaptcha Initialization Failed:", error);
    throw error;
  }
}

/** إرسال رمز التحقق للهاتف مع معالجة ذكية لتنسيق الرقم وحذف الصفر الزائد */
export async function sendOtpToPhone(authInstance: Auth, phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
  try {
    let finalPhone = phoneNumber.trim();
    
    // منطق ذكي لحذف الصفر الزائد من الرقم بعد كود الدولة (مثلاً +96605 يصبح +9665)
    if (finalPhone.startsWith('+')) {
      // نفترض أن كود الدولة هو أول 4 خانات تقريباً (+XXX)
      // نبحث عن أول '0' بعد علامة الزائد في موضع الرقم الوطني
      const plusIndex = finalPhone.indexOf('+');
      // محاولة رصد الصفر الذي يلي كود الدولة (السعودية +966، سوريا +963)
      if (finalPhone.includes('+9660')) {
        finalPhone = finalPhone.replace('+9660', '+966');
      } else if (finalPhone.includes('+9630')) {
        finalPhone = finalPhone.replace('+9630', '+963');
      }
    } else {
       if (finalPhone.startsWith('0')) {
         finalPhone = finalPhone.substring(1);
       }
       finalPhone = `+966${finalPhone}`;
    }

    console.log("Attempting to send SMS to:", finalPhone);
    
    const result = await signInWithPhoneNumber(authInstance, finalPhone, appVerifier);
    toast({ title: "تم إرسال الرمز", description: "يرجى التحقق من رسائل SMS على هاتفك" });
    return result;
  } catch (error: any) {
    console.error("SMS Send Error:", error);
    let msg = "تعذر إرسال الرمز. يرجى تحديث الصفحة والمحاولة مرة أخرى.";
    
    if (error.code === 'auth/too-many-requests') {
      msg = "تم إرسال محاولات كثيرة لهذا الرقم. يرجى المحاولة لاحقاً.";
    } else if (error.code === 'auth/invalid-phone-number') {
      msg = "رقم الهاتف غير صحيح، يرجى كتابته بالصيغة الدولية وبدون أصفار زائدة.";
    } else if (error.code === 'auth/captcha-check-failed' || error.message.includes('code:-39')) {
      msg = "حدث تداخل في نظام الأمان، يرجى تحديث الصفحة والضغط مرة واحدة فقط.";
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