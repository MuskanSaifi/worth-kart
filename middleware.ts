import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl.host ||
    "";
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.nextUrl.protocol ? req.nextUrl.protocol.replace(":", "") : "https");

  const isLocal =
    host.includes("localhost") ||
    host.startsWith("127.") ||
    host.startsWith("192.168.") ||
    host.includes("::1");

  // 1. 301 Permanent Redirect for www domain to non-www
  if (!isLocal && host.toLowerCase().startsWith("www.")) {
    const cleanHost = host.replace(/^www\./i, "");
    const primaryHost = cleanHost.includes("worthkart.com")
      ? "worthkart.in"
      : cleanHost;
    const targetUrl = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      `https://${primaryHost}`
    );
    return NextResponse.redirect(targetUrl, 301);
  }

  // 2. 301 Permanent Redirect for worthkart.com to worthkart.in
  if (!isLocal && host.toLowerCase().includes("worthkart.com")) {
    const targetUrl = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      "https://worthkart.in"
    );
    return NextResponse.redirect(targetUrl, 301);
  }

  // 3. 301 Permanent Redirect for HTTP to HTTPS in production
  if (!isLocal && proto === "http") {
    const targetUrl = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      `https://${host}`
    );
    return NextResponse.redirect(targetUrl, 301);
  }

  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAdminLogin = pathname.startsWith("/admin/login");
  const isAdminPanel = pathname.startsWith("/admin") && !isAdminLogin;

  const isSellerHub =
    pathname.startsWith("/seller") &&
    !pathname.startsWith("/seller/register") &&
    !pathname.startsWith("/seller/login");

  const buyerProtected = ["/account", "/cart", "/checkout", "/orders", "/wishlist"];
  const isBuyerProtected = buyerProtected.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if ((isSellerHub || isBuyerProtected || isAdminPanel) && !isLoggedIn) {
    const loginUrl = new URL(
      isAdminPanel ? "/admin/login" : isSellerHub ? "/seller/login" : "/login",
      req.url
    );
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isSellerHub && role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAdminPanel && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  // Logged-in admin visiting login → go to dashboard
  if (isAdminLogin && isLoggedIn && role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
