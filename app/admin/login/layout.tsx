import { NextResponse } from "next/server";

/** Admin login must not use the authenticated admin panel layout. */
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
