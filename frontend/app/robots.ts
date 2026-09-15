import type { MetadataRoute } from "next";

const BASE_URL = "https://sqld-tutor.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/chat",
        "/home",
        "/exam",
        "/onboarding",
        "/wrong-answers",
        "/admin",
        "/account",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
