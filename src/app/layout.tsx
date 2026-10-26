import type { Metadata, Viewport } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
