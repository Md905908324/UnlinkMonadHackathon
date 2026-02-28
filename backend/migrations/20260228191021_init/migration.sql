-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "lenderUnlink" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAmount" TEXT NOT NULL DEFAULT '0',
    "paymentRelay" TEXT,
    CONSTRAINT "Bid_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Bid" ("amount", "id", "lenderUnlink", "loanId", "rate", "status", "submittedAt") SELECT "amount", "id", "lenderUnlink", "loanId", "rate", "status", "submittedAt" FROM "Bid";
DROP TABLE "Bid";
ALTER TABLE "new_Bid" RENAME TO "Bid";
CREATE INDEX "Bid_loanId_rate_idx" ON "Bid"("loanId", "rate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
