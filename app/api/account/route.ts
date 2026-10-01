import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AccountDeleteError, deleteUserAccount } from "@/lib/delete-account";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteUserAccount(session.user.id);
    return NextResponse.json({
      success: true,
      message: "Your account and personal data have been deleted.",
    });
  } catch (e) {
    if (e instanceof AccountDeleteError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[account] DELETE:", e);
    return NextResponse.json({ error: "Could not delete account" }, { status: 500 });
  }
}
