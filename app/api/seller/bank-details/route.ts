import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSellerProfile } from "@/lib/seller";
import { sellerBankDetailsSchema } from "@/lib/validations";
import { verifyBankAccount, nameMatchScore } from "@/lib/bank-verify";

const MIN_NAME_MATCH = 60;

export async function PATCH(req: NextRequest) {
  try {
    const { seller } = await getSellerProfile();
    const parsed = sellerBankDetailsSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { bankAccount, bankIfsc, accountHolderName } = parsed.data;

    const verification = await verifyBankAccount({
      bankAccount,
      ifsc: bankIfsc,
      accountHolderName,
      phone: seller.user?.phone || undefined,
    });

    if (!verification.verified) {
      return NextResponse.json(
        {
          error:
            verification.error ||
            "Bank account could not be verified. Check account number and IFSC.",
        },
        { status: 400 }
      );
    }

    const holderAtBank = verification.accountHolderName || accountHolderName;
    const compareName = seller.gstLegalName || seller.businessName;
    const matchScore =
      verification.nameMatchScore ??
      nameMatchScore(holderAtBank, compareName);

    if (matchScore < MIN_NAME_MATCH) {
      return NextResponse.json(
        {
          error: `Account holder name "${holderAtBank}" does not match your business name "${compareName}". Use the same name as on your bank account.`,
          nameAtBank: holderAtBank,
          nameMatchScore: matchScore,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.sellerProfile.update({
      where: { id: seller.id },
      data: {
        bankAccount,
        bankIfsc: bankIfsc.toUpperCase(),
        bankVerified: true,
        bankAccountHolderName: holderAtBank,
        bankName: verification.bankName || null,
      },
    });

    return NextResponse.json({
      success: true,
      bankAccount: updated.bankAccount,
      bankIfsc: updated.bankIfsc,
      bankVerified: true,
      bankAccountHolderName: updated.bankAccountHolderName,
      bankName: updated.bankName,
      nameMatchScore: matchScore,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json(
      { error: msg },
      { status: msg.includes("not found") ? 404 : 500 }
    );
  }
}
