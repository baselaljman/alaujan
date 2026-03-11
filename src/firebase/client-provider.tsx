
'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, initiateAnonymousSignIn } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // تهيئة خدمات Firebase مرة واحدة فقط
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []);

  useEffect(() => {
    // التحقق من حالة المستخدم قبل تسجيل الدخول المجهول
    // هذا يمنع تسجيل خروج المدير أو المستخدم المسجل عند تحديث الصفحة
    if (firebaseServices.auth) {
      const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
        if (!user) {
          initiateAnonymousSignIn(firebaseServices.auth);
        }
      });
      return () => unsubscribe();
    }
  }, [firebaseServices.auth]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
