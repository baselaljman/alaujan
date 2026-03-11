
'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * مكون صامت يستمع للأخطاء العالمية.
 * تم تعديله لعدم "رمي" الخطأ لتجنب انهيار التطبيق (Crash) في المتصفح،
 * والاكتفاء بتسجيله في الكونسول للتطوير.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.warn("Firestore Permission Notice:", error.message);
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // لم نعد نستخدم throw error هنا لتجنب شاشة Application Error البيضاء
  return null;
}
