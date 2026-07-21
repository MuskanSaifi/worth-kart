import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOtpVerifiedRecently } from "@/lib/otp-check";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email } = parsed.data;
    const verified = await isOtpVerifiedRecently(email, "email");
    if (!verified) {
      return NextResponse.json({ error: "Please verify the email OTP first" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "Email is already linked to another account" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email, emailVerified: true },
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error("Account email update failed:", error);
    return NextResponse.json({ error: "Could not update email" }, { status: 500 });
  }
}
