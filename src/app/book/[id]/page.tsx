
"use client"

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/**
 * This page is kept as a redirect to support old links while avoiding the 
 * "generateStaticParams" requirement for static exports. 
 * The logic has moved to /src/app/book/page.tsx
 */
export default function BookTripRedirect() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      router.replace(`/book?id=${id}`);
    } else {
      router.replace('/');
    }
  }, [id, router]);

  return (
    <div className="flex justify-center p-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );
}
