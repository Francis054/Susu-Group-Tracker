import {
  Member,
  PayoutRecord,
  Pesewas,
  WeeklyContributionRecord,
} from '../types.js';

export function formatGhs(pesewas: Pesewas): string {
  const cedis = (pesewas / 100).toFixed(2);
  return `GH₵${cedis}`;
}

export function parseGhsToPesewas(input: string): Pesewas {
  const trimmed = input.trim().replace(/^GH₵|^GHS/i, '').trim();
  const amount = Number(trimmed);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Please enter a valid positive number for the amount.');
  }
  return Math.round(amount * 100);
}

export function formatMemberList(members: readonly Member[]): string {
  if (members.length === 0) {
    return 'No members registered yet.';
  }

  const lines = ['--- Registered Members (in Joining Order) ---'];
  for (const m of members) {
    lines.push(`  ${m.joinOrder}. ${m.name} (ID: ${m.id})`);
  }
  return lines.join('\n');
}

export function formatWeeklyStatus(
  weekNumber: number,
  weeklyTargetPesewas: Pesewas,
  members: readonly Member[],
  records: readonly WeeklyContributionRecord[]
): string {
  const lines = [
    `=== Week ${weekNumber} Status ===`,
    `Weekly Target per Member: ${formatGhs(weeklyTargetPesewas)}`,
    '',
  ];

  if (members.length === 0) {
    lines.push('No members registered in the group.');
    return lines.join('\n');
  }

  lines.push('Order | Member Name | Contributed | Remaining | Status');
  lines.push('------------------------------------------------------');

  for (const member of members) {
    const record = records.find((r) => r.memberId === member.id);
    const paid = record ? record.amountPaidPesewas : 0;
    const balance = Math.max(0, weeklyTargetPesewas - paid);
    const status = record ? record.status : 'UNPAID';

    const line = [
      String(member.joinOrder).padEnd(5),
      member.name.padEnd(12),
      formatGhs(paid).padEnd(12),
      formatGhs(balance).padEnd(10),
      status,
    ].join(' | ');

    lines.push(line);
  }

  return lines.join('\n');
}

export function formatPayoutHistory(payouts: readonly PayoutRecord[]): string {
  if (payouts.length === 0) {
    return 'No payouts recorded yet. Complete and close a week to record payouts.';
  }

  const lines = ['=== Payout History ==='];
  lines.push('Week | Recipient | Amount Disbursed | Date Disbursed');
  lines.push('----------------------------------------------------');

  for (const p of payouts) {
    const dateStr = p.disbursedAt instanceof Date ? p.disbursedAt.toLocaleDateString() : 'N/A';
    lines.push(
      `Week ${p.weekNumber} | ${p.recipientName} | ${formatGhs(p.payoutAmountPesewas)} | ${dateStr}`
    );
  }

  return lines.join('\n');
}
