import { NextRequest, NextResponse } from "next/server";
import { lookupIfsc, validateIfscFormat } from "@/lib/bank-verify";

export async function GET(req: NextRequest) {
  const ifsc = req.nextUrl.searchParams.get("ifsc")?.trim().toUpperCase() || "";

  if (!validateIfscFormat(ifsc)) {
    return NextResponse.json({ error: "Invalid IFSC format" }, { status: 400 });
  }

  const data = await lookupIfsc(ifsc);
  if (!data) {
    return NextResponse.json({ error: "IFSC not found" }, { status: 404 });
  }

  return NextResponse.json({ ifsc: data });
}
