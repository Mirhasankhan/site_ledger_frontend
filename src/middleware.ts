import { NextResponse, type NextRequest } from "next/server";

const roleHome = {
  ADMIN: "/admin",
  SITE_MANAGER: "/site-manager",
  WORKER: "/worker",
} as const;

function readRole(token: string) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(
      normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="),
    );
    return JSON.parse(decoded).role as keyof typeof roleHome;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("token")?.value || req.cookies.get("accessToken")?.value;
  const { pathname } = req.nextUrl;
  const role = token ? readRole(token) : null;

  const isAuthRoute = [
    "/login",
    "/forgot-password",
    "/reset-password",
    "/accept-invite",
    "/auth/login",
    "/auth/reset-password",
  ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isProtectedRoute = !isAuthRoute;

  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && !role) return NextResponse.redirect(new URL("/login", req.url));

  if (token && role && isAuthRoute) {
    const homeUrl = new URL(roleHome[role], req.url);
    return NextResponse.redirect(homeUrl);
  }

  if (token && role) {
    const restrictedRoutes = {
      ADMIN: ["/site-manager", "/worker"],
      SITE_MANAGER: ["/admin"],
      WORKER: ["/admin", "/site-manager"],
    } as const;
    const blocked = restrictedRoutes[role].some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    if (blocked) return NextResponse.redirect(new URL(roleHome[role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
