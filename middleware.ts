import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
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
