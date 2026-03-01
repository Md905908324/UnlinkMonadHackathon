import { useMemo } from "react";

export interface RiskInputs {
  creditScore: number;
  monthlyIncome: number;
  monthlyDebtPayments: number;
  employmentTenure: number; // months
  incomeVolatility: number; // 0-100
  pastDefaults: number;
  loanAmount: number;
  collateralAmount: number;
  durationDays: number;
}

export interface RiskScores {
  repayability: number;
  incomeStability: number;
  creditHistory: number;
  overall: number;
  tier: "Low" | "Medium" | "High";
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function computeMaxLoanCap(monthlyIncome: number, durationDays: number): number {
  const safeIncome = Math.max(0, monthlyIncome);
  const safeDays = Math.max(0, durationDays);
  return safeIncome * 0.8 * (safeDays / 30);
}

export const DURATION_PRESETS = [
  { label: "6 hours", days: 0.25 },
  { label: "12 hours", days: 0.5 },
  { label: "1 day", days: 1 },
  { label: "3 days", days: 3 },
  { label: "5 days", days: 5 },
  { label: "7 days", days: 7 },
  { label: "1 week", days: 7 },
  { label: "Until Clear", days: 7 },
] as const;

function computeRepayability(loanAmount: number, durationDays: number, monthlyIncome: number): number {
  if (monthlyIncome <= 0) return 5;
  const normalizedLoanLoad = (loanAmount / monthlyIncome) / Math.max(0.25, durationDays / 30);
  return clamp(100 - normalizedLoanLoad * 8, 0, 100);
}

function computeRepayabilityDynamic(
  loanAmount: number,
  collateralAmount: number,
  durationDays: number,
  monthlyIncome: number,
  monthlyDebtPayments: number
): number {
  if (monthlyIncome <= 0) return 5;

  const disposableIncome = Math.max(monthlyIncome - monthlyDebtPayments, 0);
  const debtToIncome = clamp(monthlyDebtPayments / monthlyIncome, 0, 1.2);
  const collateralRatio = loanAmount > 0 ? clamp(collateralAmount / loanAmount, 0, 1.5) : 0;
  const termRelief = clamp(durationDays / 30, 0.25, 2.5);

  const incomeBufferScore = clamp((disposableIncome / monthlyIncome) * 100, 0, 100);
  const existingDebtScore = clamp(100 - debtToIncome * 120, 0, 100);
  const loanLoadScore = computeRepayability(loanAmount, durationDays, monthlyIncome);
  const collateralSupportScore = clamp(collateralRatio * 100, 0, 100);
  const termScore = clamp(35 + termRelief * 25, 0, 100);

  const weighted =
    loanLoadScore * 0.34 +
    incomeBufferScore * 0.24 +
    existingDebtScore * 0.20 +
    collateralSupportScore * 0.17 +
    termScore * 0.05;

  const loanToIncome = monthlyIncome > 0 ? loanAmount / monthlyIncome : 10;
  const termPressure = clamp(30 / Math.max(durationDays, 1), 0.4, 8);
  const overextension = loanToIncome * termPressure;
  const overextensionPenalty =
    overextension <= 2.0
      ? 0
      : overextension <= 3.2
      ? (overextension - 2.0) * 12
      : 14.4 + Math.pow(overextension - 3.2, 1.35) * 14;

  return clamp(weighted - overextensionPenalty, 0, 100);
}

function computeIncomeStability(tenureMonths: number, volatility: number): number {
  let tenureScore: number;
  if (tenureMonths < 3) tenureScore = 30;
  else if (tenureMonths < 6) tenureScore = 50;
  else if (tenureMonths < 12) tenureScore = 70;
  else if (tenureMonths < 24) tenureScore = 85;
  else tenureScore = 100;

  let volatilityScore: number;
  if (volatility <= 5) volatilityScore = 100;
  else if (volatility <= 10) volatilityScore = 85;
  else if (volatility <= 20) volatilityScore = 65;
  else if (volatility <= 35) volatilityScore = 45;
  else volatilityScore = 25;

  return (tenureScore + volatilityScore) / 2;
}

function computeCreditHistory(creditScore: number, pastDefaults: number): number {
  const creditNorm = clamp(((creditScore - 300) / 550) * 100, 0, 100);
  const defaultPenalty = clamp(pastDefaults * 18, 0, 55);
  return clamp(creditNorm - defaultPenalty, 0, 100);
}

export function computeRiskScores(inputs: RiskInputs): RiskScores {
  const repayability = computeRepayabilityDynamic(
    inputs.loanAmount,
    inputs.collateralAmount,
    inputs.durationDays,
    inputs.monthlyIncome,
    inputs.monthlyDebtPayments
  );
  const incomeStability = computeIncomeStability(inputs.employmentTenure, inputs.incomeVolatility);
  const creditHistory = computeCreditHistory(inputs.creditScore, inputs.pastDefaults);
  const overall = 0.42 * repayability + 0.28 * incomeStability + 0.30 * creditHistory;
  const tier: RiskScores["tier"] = overall >= 78 ? "Low" : overall >= 58 ? "Medium" : "High";
  return { repayability, incomeStability, creditHistory, overall, tier };
}

export function computeRecommendations(inputs: {
  overallScore: number;
  repayability: number;
  monthlyIncome: number;
  monthlyDebtPayments: number;
  loanAmount: number;
  collateralAmount: number;
  durationDays: number;
}) {
  const {
    overallScore,
    repayability,
    monthlyIncome,
    monthlyDebtPayments,
    loanAmount,
    collateralAmount,
    durationDays,
  } = inputs;

  const safeLoanAmount = Math.max(0, loanAmount);
  const safeCollateral = Math.max(0, collateralAmount);
  const safeDurationDays = clamp(durationDays, 0, 365);
  const effectiveDurationDays = Math.max(1, safeDurationDays);

  const collateralRatio = safeLoanAmount > 0 ? clamp(safeCollateral / safeLoanAmount, 0, 1.5) : 0;
  const loanToIncome = monthlyIncome > 0 ? safeLoanAmount / monthlyIncome : 10;
  const durationRisk = clamp(Math.sqrt(effectiveDurationDays / 30), 0.2, 3.5);

  const recommendedAPR = clamp(
    4.5 + (100 - overallScore) * 0.09 + (100 - repayability) * 0.02 + loanToIncome * 1.25 + durationRisk * 0.85 - collateralRatio * 1.6,
    4.5,
    30
  );
  const aprRange: [number, number] = [
    clamp(recommendedAPR - 1.2, 4.5, 30),
    clamp(recommendedAPR + 1.4, 4.5, 30),
  ];

  const disposableIncome = Math.max(monthlyIncome - monthlyDebtPayments, 0);
  const maxLoanCap = computeMaxLoanCap(monthlyIncome, safeDurationDays);
  const riskMultiplier = overallScore >= 80 ? 0.95 : overallScore >= 65 ? 0.82 : overallScore >= 50 ? 0.68 : 0.5;
  const affordability = clamp((disposableIncome / Math.max(monthlyIncome, 1)) * 1.2, 0.2, 1);
  const collateralBoost = clamp(0.7 + collateralRatio * 0.3, 0.7, 1.1);
  const rawMax = maxLoanCap * riskMultiplier * affordability * collateralBoost;
  const suggestedMaxLoan = Math.round(clamp(rawMax, 0, 50000) / 100) * 100;

  let suggestedRepaymentDays: number;
  const desiredByLoad = Math.ceil(clamp(loanToIncome * 22, 7, 180));
  const collateralAdjustment = Math.round(clamp((0.65 - collateralRatio) * 55, -25, 45));
  const scoreAdjustment = Math.round(clamp((70 - overallScore) * 0.9, -20, 35));
  suggestedRepaymentDays = clamp(desiredByLoad + collateralAdjustment + scoreAdjustment, 3, 365);

  return { recommendedAPR, aprRange, suggestedMaxLoan, suggestedRepaymentDays, maxLoanCap };
}

export function computeSuggestedBidAPR(riskScore: number, durationDays: number): number {
  const recommendedAPR = clamp(6 + (100 - riskScore) * 0.15, 5, 30);
  const adjustment = durationDays <= 1 ? -0.5 : durationDays >= 7 ? 0.5 : 0;
  return clamp(recommendedAPR + adjustment, 5, 30);
}

export function useRiskScore(inputs: RiskInputs): RiskScores {
  return useMemo(() => computeRiskScores(inputs), [
    inputs.creditScore,
    inputs.monthlyIncome,
    inputs.monthlyDebtPayments,
    inputs.employmentTenure,
    inputs.incomeVolatility,
    inputs.pastDefaults,
    inputs.loanAmount,
    inputs.collateralAmount,
    inputs.durationDays,
  ]);
}
