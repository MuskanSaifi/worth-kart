import { NextRequest, NextResponse } from "next/server";
import { requireAppUser } from "@/lib/app-auth";
import { AccountDeleteError, deleteUserAccount } from "@/lib/delete-account";

function isUnauthorized(e: unknown) {
  return e instanceof Error && e.message === "Unauthorized";
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAppUser(req);
    await deleteUserAccount(user.id);
    return NextResponse.json({
      success: true,
      message: "Your account and personal data have been deleted.",
    });
  } catch (e) {
    if (isUnauthorized(e)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof AccountDeleteError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[app/account] DELETE:", e);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}
