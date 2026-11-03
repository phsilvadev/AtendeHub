import { NextRequest, NextResponse } from "next/server";
export async function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/cadastro"
  )
    return NextResponse.next();
  const redirectToLogin = () =>
    NextResponse.redirect(
      new URL("/login", process.env.APP_ORIGIN || request.url),
    );
  const token = request.cookies.get("atendehub_session");
  if (!token) return redirectToLogin();
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/v1/auth/me`,
      {
        headers: { Cookie: `atendehub_session=${token.value}` },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) return redirectToLogin();
    const result = NextResponse.next();
    result.headers.set("Cache-Control", "private, no-store");
    return result;
  } catch {
    return redirectToLogin();
  }
}
export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] };
