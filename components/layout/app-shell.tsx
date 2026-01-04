"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Building2 },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] as const },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const items = navItems.filter((item) => !item.roles || (isAdmin && item.roles.includes("admin")));

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
              active ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, firm, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const initials = user?.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <aside className="hidden w-64 border-r bg-background p-6 md:block">
        <div className="mb-6 space-y-6">
          <div>
            <div className="text-lg font-semibold">FirmLynk</div>
            <div className="text-sm text-muted-foreground">{firm?.name}</div>
          </div>
          <NavLinks />
        </div>
        <Separator className="my-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium leading-tight">{user?.name}</div>
            <div className="text-xs text-muted-foreground">{user?.role}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <div className="mb-4">
                <div className="text-lg font-semibold">FirmLynk</div>
                <div className="text-sm text-muted-foreground">{firm?.name}</div>
              </div>
              <NavLinks onNavigate={() => setOpen(false)} />
              <Separator className="my-4" />
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </SheetContent>
          </Sheet>
          <div className="text-base font-semibold">FirmLynk</div>
        </header>

        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

