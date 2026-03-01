-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onChainId" TEXT,
    "borrowerUnlink" TEXT NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "maxRate" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Loan" ("amount", "borrowerUnlink", "createdAt", "creditScore", "deadline", "duration", "id", "maxRate", "onChainId", "status") SELECT "amount", "borrowerUnlink", "createdAt", "creditScore", "deadline", "duration", "id", "maxRate", "onChainId", "status" FROM "Loan";
DROP TABLE "Loan";
ALTER TABLE "new_Loan" RENAME TO "Loan";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
