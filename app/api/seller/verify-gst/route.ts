import { NextRequest, NextResponse } from "next/server";
import { validateGstin, lookupGstinOnline } from "@/lib/gst";
import { z } from "zod";

const schema = z.object({
  gstin: z.string().min(15).max(15),
  panNumber: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { gstin, panNumber } = parsed.data;
    const local = validateGstin(gstin);

    if (!local.valid) {
      return NextResponse.json({
        verified: false,
        error: local.error,
      });
    }

    // Cross-check PAN if seller provided one
    if (panNumber && panNumber.toUpperCase() !== local.pan) {
      return NextResponse.json({
        verified: false,
        error: "PAN does not match the PAN embedded in GSTIN",
      });
    }

    const lookup = await lookupGstinOnline(local.gstin);

    return NextResponse.json({
      verified: lookup.verified,
      gstin: local.gstin,
      stateCode: local.stateCode,
      pan: local.pan,
      legalName: lookup.legalName,
      status: lookup.status,
      source: lookup.source,
      message:
        lookup.source === "api"
          ? "GSTIN verified with government records"
          : "GSTIN format & checksum valid (configure GST_VERIFY_API_URL for live lookup)",
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
