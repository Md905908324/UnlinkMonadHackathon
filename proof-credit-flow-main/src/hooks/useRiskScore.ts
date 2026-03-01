import { useMemo } from "react";

export interface RiskInputs {
  creditScore: number;
  monthlyIncome: number;
  monthlyDebtPayments: number;
  employmentTenure: number; // months
  incomeVolatility: number; // 0-100
  pastDefaults: number;
  loanAmount: number;
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
  if (monthlyIncome <= 0) return 20;
  const approxMonthlyPayment = (loanAmount * (1 + 0.12 * durationDays / 365)) / Math.max(1, durationDays / 30);
  const pti = approxMonthlyPayment / monthlyIncome;
  if (pti <= 0.10) return 100;
  if (pti <= 0.20) return 80;
  if (pti <= 0.30) return 60;
  if (pti <= 0.40) return 40;
  return 20;
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
  const defaultPenalty = pastDefaults > 0 ? 30 : 0;
  return clamp(creditNorm - defaultPenalty, 0, 100);
}

export function computeRiskScores(inputs: RiskInputs): RiskScores {
  const repayability = computeRepayability(inputs.loanAmount, inputs.durationDays, inputs.monthlyIncome);
  const incomeStability = computeIncomeStability(inputs.employmentTenure, inputs.incomeVolatility);
  const creditHistory = computeCreditHistory(inputs.creditScore, inputs.pastDefaults);
  const overall = 0.45 * repayability + 0.30 * incomeStability + 0.25 * creditHistory;
  const tier: RiskScores["tier"] = overall >= 80 ? "Low" : overall >= 60 ? "Medium" : "High";
  return { repayability, incomeStability, creditHistory, overall, tier };
}

export function computeRecommendations(riskScore: number, monthlyIncome: number, repayability?: number) {
  const recommendedAPR = clamp(6 + (100 - riskScore) * 0.15, 5, 30);
  const aprRange: [number, number] = [
    clamp(recommendedAPR - 1.0, 5, 30),
    clamp(recommendedAPR + 1.5, 5, 30),
  ];
  const rawMax = monthlyIncome * (riskScore >= 80 ? 4 : riskScore >= 60 ? 2.5 : 1.5);
  const suggestedMaxLoan = Math.round(clamp(rawMax, 500, 50000) / 100) * 100;

  const rep = repayability ?? 50;
  let suggestedDuration: string;
  if (riskScore >= 80) {
    suggestedDuration = "7 days";
  } else if (riskScore >= 60) {
    suggestedDuration = rep < 70 ? "3 days" : "5 days";
  } else {
    suggestedDuration = rep < 40 ? "12 hours" : "1 day";
  }

  return { recommendedAPR, aprRange, suggestedMaxLoan, suggestedDuration };
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
    inputs.durationDays,
  ]);
}
