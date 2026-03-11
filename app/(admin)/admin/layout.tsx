import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/layout/auth-guard";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-100 md:flex">
        <Sidebar />
        <div className="flex-1">
          <header className="border-b border-slate-200 bg-white px-6 py-4 text-lg font-semibold">Admin Panel</header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
