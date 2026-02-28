"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, MapPin, Package, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "حجز", href: "/", icon: Search },
  { label: "تتبع", href: "/track", icon: MapPin },
  { label: "طرود", href: "/parcels", icon: Package },
  { label: "المساعد الآلي", href: "/assistant", icon: MessageSquare },
  { label: "حسابي", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t md:hidden">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
