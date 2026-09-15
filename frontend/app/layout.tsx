import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQLD AI 튜터",
  description: "SQLD 자격증 합격을 돕는 AI 튜터",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SQLD AI 튜터",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  verification: {
    google: "q-nhv7v0WCdUC4u7ExAl2cmjfF8Q5nF9SU52nBTfEtg",
    other: {
      "naver-site-verification": "04170ee46028d883e075ea67b84eeecc242a8991",
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#7577f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-stone-50 text-stone-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
