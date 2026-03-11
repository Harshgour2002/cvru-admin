"use client";

import { PropsWithChildren, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasAdminRole, isAuthenticated } from "@/lib/auth/session";

export function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const allowed = isAuthenticated() && hasAdminRole();

  useEffect(() => {
    if (!allowed) {
      router.replace("/login");
    }
  }, [allowed, router]);

  if (!allowed) {
    return <div className="p-6 text-sm text-slate-500">Checking session...</div>;
  }

  return <>{children}</>;
}
