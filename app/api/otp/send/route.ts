import { NextRequest, NextResponse } from "next/server";
import { otpSendSchema } from "@/lib/validations";
import { sendAndStoreOtp } from "@/lib/otp-send";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = otpSendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { target, type } = parsed.data;
    const result = await sendAndStoreOtp(target, type);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      ...(result.devOtp ? { devOtp: result.devOtp } : {}),
    });
  } catch (e) {
    console.error("OTP send error:", e);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
