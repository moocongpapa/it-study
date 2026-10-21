import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Atlas — 차근차근 배우는 IT",
  description: "꼭 필요한 IT 지식만 모았어요. 비전공자는 전공자 수준까지, 전공자는 지식 정리까지.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
