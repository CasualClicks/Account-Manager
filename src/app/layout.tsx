import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ledgerly — Account manager",
  description: "A calm, clear home for your business accounts.",
  applicationName: "Ledgerly",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Ledgerly" },
};

export const viewport: Viewport = { themeColor: "#f6f7f4", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try { const t = localStorage.getItem('ledgerly-theme'); const p = t === 'dark' || t === 'light' ? t : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); document.documentElement.dataset.theme = p; } catch {}" }}/>
      </head>
      <body><Suspense fallback={null}>{children}</Suspense></body>
    </html>
  );
}
