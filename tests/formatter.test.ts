import { describe, it, expect } from 'vitest';
import {
  formatGhs,
  formatMemberList,
  formatPayoutHistory,
  formatWeeklyStatus,
  parseGhsToPesewas,
} from '../src/cli/formatter.js';
import { Member, PayoutRecord, WeeklyContributionRecord } from '../src/types.js';

describe('Formatter Utilities', () => {
  it('should format integer pesewas into GH₵ strings', () => {
    expect(formatGhs(5000)).toBe('GH₵50.00');
    expect(formatGhs(150)).toBe('GH₵1.50');
    expect(formatGhs(0)).toBe('GH₵0.00');
    expect(formatGhs(100000)).toBe('GH₵1000.00');
  });

  it('should parse user cedis input into integer pesewas', () => {
    expect(parseGhsToPesewas('50')).toBe(5000);
    expect(parseGhsToPesewas('GH₵50.00')).toBe(5000);
    expect(parseGhsToPesewas('GHS 25.50')).toBe(2550);
    expect(parseGhsToPesewas('100.75')).toBe(10075);
  });

  it('should reject invalid or negative currency strings', () => {
    expect(() => parseGhsToPesewas('abc')).toThrow('Please enter a valid positive number');
    expect(() => parseGhsToPesewas('0')).toThrow('Please enter a valid positive number');
    expect(() => parseGhsToPesewas('-50')).toThrow('Please enter a valid positive number');
  });

  it('should format member lists in joining order', () => {
    const members: Member[] = [
      { id: 'mem_1', name: 'Ama', joinOrder: 1 },
      { id: 'mem_2', name: 'Kofi', joinOrder: 2 },
    ];

    const output = formatMemberList(members);
    expect(output).toContain('1. Ama (ID: mem_1)');
    expect(output).toContain('2. Kofi (ID: mem_2)');
  });

  it('should format weekly status table with payment statuses', () => {
    const members: Member[] = [
      { id: 'mem_1', name: 'Ama', joinOrder: 1 },
      { id: 'mem_2', name: 'Kofi', joinOrder: 2 },
    ];

    const records: WeeklyContributionRecord[] = [
      { memberId: 'mem_1', weekNumber: 1, amountPaidPesewas: 5000, status: 'PAID' },
      { memberId: 'mem_2', weekNumber: 1, amountPaidPesewas: 2000, status: 'PARTIAL' },
    ];

    const table = formatWeeklyStatus(1, 5000, members, records);
    expect(table).toContain('Week 1 Status');
    expect(table).toContain('Ama');
    expect(table).toContain('PAID');
    expect(table).toContain('Kofi');
    expect(table).toContain('PARTIAL');
  });

  it('should format payout history list', () => {
    const payouts: PayoutRecord[] = [
      {
        weekNumber: 1,
        recipientMemberId: 'mem_1',
        recipientName: 'Ama',
        payoutAmountPesewas: 15000,
        disbursedAt: new Date('2026-10-15'),
      },
    ];

    const output = formatPayoutHistory(payouts);
    expect(output).toContain('=== Payout History ===');
    expect(output).toContain('Week 1');
    expect(output).toContain('Ama');
    expect(output).toContain('GH₵150.00');
  });
});
