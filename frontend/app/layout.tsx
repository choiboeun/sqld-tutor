import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const SITE_URL = "https://sqld-tutor.vercel.app";
const SITE_NAME = "SQLD AI 튜터";
const SITE_DESCRIPTION = "SQLD 자격증 합격을 돕는 AI 튜터";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: ["SQLD", "SQLD 자격증", "SQLD 문제", "SQLD 기출", "SQL 개발자", "AI 튜터", "SQL 학습"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/icons/logo-mark-256.png", width: 256, height: 256, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/icons/logo-mark-256.png"],
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

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "ko",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "KRW",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-stone-50 text-stone-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
