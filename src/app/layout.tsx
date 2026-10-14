import type { Metadata } from "next";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT Atlas — 지식을 연결하는 로드맵",
  description: "기초부터 아키텍처까지, IT 지식을 선수 관계로 이어 배우는 인터랙티브 로드맵",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
