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

  // 미인증: /chat, /onboarding → /login
  if (!user && (path.startsWith("/chat") || path.startsWith("/onboarding"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const onboardingDone = user.user_metadata?.onboarding_completed === true;

    // 인증됨 + 온보딩 미완료: /chat → /onboarding
    if (!onboardingDone && path.startsWith("/chat")) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // 인증됨 + 온보딩 완료: /onboarding → /chat
    if (onboardingDone && path.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }

    // 인증됨: /login, /signup → /chat
    if (path === "/login" || path === "/signup") {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/chat/:path*", "/onboarding", "/login", "/signup"],
};
