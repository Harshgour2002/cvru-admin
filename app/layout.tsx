import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/providers/app-provider";

export const metadata: Metadata = {
  title: "CVRUK Admin Panel",
  description: "Admin dashboard for CVRUK backend content modules",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
