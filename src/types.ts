// Money is represented as integer pesewas (GH₵1.00 = 100 pesewas).
export type Pesewas = number;

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Member {
  readonly id: string;
  readonly name: string;
  readonly joinOrder: number;
}

export interface WeeklyContributionRecord {
  readonly memberId: string;
  readonly weekNumber: number;
  readonly amountPaidPesewas: Pesewas;
  readonly status: PaymentStatus;
}

export interface PaymentTransaction {
  readonly id: string;
  readonly memberId: string;
  readonly weekNumber: number;
  readonly amountPesewas: Pesewas;
  readonly paidAt: Date;
}

export interface PayoutRecord {
  readonly weekNumber: number;
  readonly recipientMemberId: string;
  readonly recipientName: string;
  readonly payoutAmountPesewas: Pesewas;
  readonly disbursedAt: Date;
}

export interface SusuGroup {
  readonly id: string;
  readonly name: string;
  readonly weeklyContributionPesewas: Pesewas;
  readonly currentWeek: number;
  readonly members: readonly Member[];
  readonly isCycleCompleted: boolean;
}

export function ghsToPesewas(ghs: number): Pesewas {
  return Math.round(ghs * 100);
}

export function formatPesewasToGhs(amountPesewas: Pesewas): string {
  return `GH₵${(amountPesewas / 100).toFixed(2)}`;
}
