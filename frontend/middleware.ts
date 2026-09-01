import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 미인증: 보호 경로 → /login (chat, home, exam은 게스트 허용으로 제외)
  const protectedPaths = ["/onboarding", "/wrong-answers", "/admin"];
  if (!user && protectedPaths.some((p) => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const onboardingDone = user.user_metadata?.onboarding_completed === true;

    // 인증됨 + 온보딩 미완료: /home, /chat, /wrong-answers, /exam, /admin → /onboarding
    if (!onboardingDone && (path.startsWith("/home") || path.startsWith("/chat") || path.startsWith("/wrong-answers") || path.startsWith("/exam") || path.startsWith("/admin"))) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // 인증됨 + 온보딩 완료: /onboarding → /home
    if (onboardingDone && path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/home", request.url));
    }

    // 인증됨: /login, /signup → /home
    if (path === "/login" || path === "/signup") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/home", "/chat/:path*", "/onboarding", "/wrong-answers", "/exam/:path*", "/exam", "/login", "/signup", "/admin/:path*", "/home/:path*", "/wrong-answers/:path*"],
};
