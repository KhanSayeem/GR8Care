import { apiFetch } from './client';

export type FundingCategoryKey = 'core' | 'capacity' | 'capital';

export interface FundingCategorySummary {
  category: FundingCategoryKey;
  label: string;
  allocation: number;
  spentToDate: number;
  remaining: number;
  percentageUsed: number;
  overBudget: boolean;
}

export interface FundingSummary {
  planId: string;
  planNumber: string;
  status: string;
  currency: string;
  categories: FundingCategorySummary[];
  totals: {
    allocation: number;
    spentToDate: number;
    remaining: number;
  };
  budgetAlerts: FundingCategorySummary[];
}

export interface FundingSummaryResponse {
  mode: 'fundingSummary';
  boundary: string;
  summary: FundingSummary;
}

export interface FundingTransaction {
  id: string;
  category: FundingCategoryKey;
  label: string;
  amount: number;
  serviceDate: string;
  providerName?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundingTransactionsResponse {
  mode: 'fundingTransactions';
  boundary: string;
  plan: {
    id: string;
    planNumber: string;
    currency: string;
  };
  transactions: FundingTransaction[];
}

export async function getFundingSummary() {
  return apiFetch('/funding/summary') as Promise<FundingSummaryResponse>;
}

export async function getFundingTransactions({ category, limit = 10 }: { category?: FundingCategoryKey; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (limit) params.set('limit', String(limit));

  const query = params.toString();
  return apiFetch(`/funding/transactions${query ? `?${query}` : ''}`) as Promise<FundingTransactionsResponse>;
}
