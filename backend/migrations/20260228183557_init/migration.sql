-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "onChainId" INTEGER NOT NULL,
    "borrowerUnlink" TEXT NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "amount" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "maxRate" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "loanId" TEXT NOT NULL,
    "lenderUnlink" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "rate" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Bid_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CreditProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unlinkAddress" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "declaredIncome" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Loan_onChainId_key" ON "Loan"("onChainId");

-- CreateIndex
CREATE INDEX "Bid_loanId_rate_idx" ON "Bid"("loanId", "rate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditProfile_unlinkAddress_key" ON "CreditProfile"("unlinkAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CreditProfile_walletAddress_key" ON "CreditProfile"("walletAddress");
