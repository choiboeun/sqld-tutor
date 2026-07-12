import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQLD AI 튜터",
  description: "SQLD 자격증 합격을 돕는 AI 튜터",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
