"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { endpoints } from "@/lib/api/endpoints";
import { apiClient } from "@/lib/api/client";
import { clearSession, getRefreshToken } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

const items = [{ href: "/admin/events", label: "Events" }];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    const refreshToken = getRefreshToken();
    try {
      await apiClient.post(endpoints.auth.logout, { refreshToken });
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  return (
    <aside className="w-full border-r border-slate-200 bg-white p-4 md:w-64">
      <h2 className="text-xl font-bold">CVRUK Admin</h2>
      <nav className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm ${pathname === item.href ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Button className="mt-8 w-full bg-red-600 hover:bg-red-500" onClick={onLogout}>
        Logout
      </Button>
    </aside>
  );
}
