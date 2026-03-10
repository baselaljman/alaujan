
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, MapPin, Package, User, Bus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "حجز رحلة", href: "/", icon: Search },
  { label: "تتبع الحافلة", href: "/track", icon: MapPin },
  { label: "شحن الطرود", href: "/parcels", icon: Package },
  { label: "حسابي", href: "/profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="hidden md:block sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-primary/5 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Bus className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <span className="block font-black text-primary text-lg leading-none">العوجان</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">للسياحة والسفر</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all",
                  isActive 
                    ? "bg-primary text-white shadow-md scale-105" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-primary/60")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <div className="h-8 w-[1px] bg-border mx-2" />
          <Link 
            href="/profile" 
            className="h-10 w-10 rounded-full border border-primary/10 flex items-center justify-center hover:bg-primary/5 transition-colors"
          >
            <User className="h-5 w-5 text-primary" />
          </Link>
        </div>
      </div>
    </header>
  );
}
