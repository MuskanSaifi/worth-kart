import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedCategories } from "../../../../../prisma/category-seed";

/** One-click sync: upsert all categories from prisma/category-seed.ts */
export async function POST() {
  try {
    await requireRole("ADMIN");
    const slugToId = await seedCategories(prisma);
    const count = Object.keys(slugToId).length;
    return NextResponse.json({
      success: true,
      message: `Synced ${count} categories from seed file`,
      count,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Sync failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
