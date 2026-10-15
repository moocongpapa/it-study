import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Atlas — 차근차근 배우는 IT",
  description: "기초부터 아키텍처까지, 분야별 학습 주제를 골라 비유와 예제로 배우는 IT 학습 공간",
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
