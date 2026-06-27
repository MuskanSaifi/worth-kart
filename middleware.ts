import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const adminRoutes = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isSellerHub =
    pathname.startsWith("/seller") && !pathname.startsWith("/seller/register");

  const buyerProtected = ["/account", "/cart", "/checkout", "/orders", "/wishlist"];
  const isBuyerProtected = buyerProtected.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if ((isSellerHub || isBuyerProtected || pathname.startsWith("/admin")) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isSellerHub && role !== "SELLER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
