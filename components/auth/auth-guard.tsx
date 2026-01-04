"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (initialized && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [user, router, pathname, initialized]);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="rounded-lg border bg-card px-8 py-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== "/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="rounded-lg border bg-card px-8 py-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Redirecting to login…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

