
"use client"

import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isRootAdmin = pathname === "/admin";

  return (
    <div className="min-h-screen bg-slate-50/50 -mx-4 px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {!isRootAdmin && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/admin")}
            className="mb-2 gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronRight className="h-4 w-4" /> العودة للوحة الإدارة
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
