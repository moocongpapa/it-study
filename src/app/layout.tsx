import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Atlas — 차근차근 배우는 IT",
  description: "컴퓨터 기초부터 AI와 프로젝트 관리까지. 쉬운 비유, 시각 자료와 실무 연습으로 차근차근 배우세요.",
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
