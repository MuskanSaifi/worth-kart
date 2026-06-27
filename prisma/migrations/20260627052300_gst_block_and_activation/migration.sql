-- CreateTable
CREATE TABLE "SellerActivationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerActivationRequest_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SellerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT,
    "gstNumber" TEXT,
    "gstVerified" BOOLEAN NOT NULL DEFAULT false,
    "gstLegalName" TEXT,
    "gstFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "gstBlockedAt" DATETIME,
    "gstBlockReason" TEXT,
    "panNumber" TEXT,
    "bankAccount" TEXT,
    "bankIfsc" TEXT,
    "pickupAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rating" REAL NOT NULL DEFAULT 0,
    "totalSales" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SellerProfile" ("bankAccount", "bankIfsc", "businessName", "businessType", "city", "createdAt", "gstLegalName", "gstNumber", "gstVerified", "id", "panNumber", "pickupAddress", "pincode", "rating", "state", "status", "totalSales", "updatedAt", "userId") SELECT "bankAccount", "bankIfsc", "businessName", "businessType", "city", "createdAt", "gstLegalName", "gstNumber", "gstVerified", "id", "panNumber", "pickupAddress", "pincode", "rating", "state", "status", "totalSales", "updatedAt", "userId" FROM "SellerProfile";
DROP TABLE "SellerProfile";
ALTER TABLE "new_SellerProfile" RENAME TO "SellerProfile";
CREATE UNIQUE INDEX "SellerProfile_userId_key" ON "SellerProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
