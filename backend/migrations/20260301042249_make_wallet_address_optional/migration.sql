-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CreditProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unlinkAddress" TEXT NOT NULL,
    "walletAddress" TEXT,
    "creditScore" INTEGER NOT NULL,
    "declaredIncome" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_CreditProfile" ("createdAt", "creditScore", "declaredIncome", "id", "unlinkAddress", "walletAddress") SELECT "createdAt", "creditScore", "declaredIncome", "id", "unlinkAddress", "walletAddress" FROM "CreditProfile";
DROP TABLE "CreditProfile";
ALTER TABLE "new_CreditProfile" RENAME TO "CreditProfile";
CREATE UNIQUE INDEX "CreditProfile_unlinkAddress_key" ON "CreditProfile"("unlinkAddress");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
