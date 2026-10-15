import {
  Member,
  PaymentStatus,
  PaymentTransaction,
  PayoutRecord,
  Pesewas,
  WeeklyContributionRecord,
} from '../types.js';

export interface OutstandingBalanceReport {
  readonly member: Member;
  readonly balancePesewas: Pesewas;
}

export class SusuGroup {
  private readonly groupName: string;
  private readonly weeklyContributionPesewas: Pesewas;
  private readonly membersList: Member[] = [];
  private readonly transactions: PaymentTransaction[] = [];
  private readonly payoutHistoryList: PayoutRecord[] = [];
  private currentWeekNumber: number = 1;
  private cycleStarted: boolean = false;

  constructor(groupName: string, weeklyContributionPesewas: Pesewas) {
    const trimmedName = groupName?.trim();
    if (!trimmedName) {
      throw new Error('Group name cannot be empty.');
    }

    if (!Number.isInteger(weeklyContributionPesewas) || weeklyContributionPesewas <= 0) {
      throw new Error('Weekly contribution must be a positive integer in pesewas.');
    }

    this.groupName = trimmedName;
    this.weeklyContributionPesewas = weeklyContributionPesewas;
  }

  get name(): string {
    return this.groupName;
  }

  get weeklyContribution(): Pesewas {
    return this.weeklyContributionPesewas;
  }

  get currentWeek(): number {
    return this.currentWeekNumber;
  }

  get isCycleStarted(): boolean {
    return this.cycleStarted;
  }

  get isCycleCompleted(): boolean {
    return (
      this.membersList.length > 0 &&
      this.payoutHistoryList.length >= this.membersList.length
    );
  }

  registerMember(name: string): Member {
    if (this.cycleStarted) {
      throw new Error('Members can only be added before the first week starts.');
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new Error('Member name cannot be empty.');
    }

    const isDuplicate = this.membersList.some(
      (m) => m.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error(`Member with name "${trimmedName}" is already registered.`);
    }

    const joinOrder = this.membersList.length + 1;
    const newMember: Member = {
      id: `mem_${joinOrder}`,
      name: trimmedName,
      joinOrder,
    };

    this.membersList.push(newMember);
    return newMember;
  }

  getMembers(): readonly Member[] {
    return [...this.membersList];
  }

  getMemberById(id: string): Member | undefined {
    return this.membersList.find((m) => m.id === id);
  }

  getMemberByName(name: string): Member | undefined {
    const trimmed = name?.trim().toLowerCase();
    return this.membersList.find((m) => m.name.toLowerCase() === trimmed);
  }

  recordPayment(memberIdentifier: string, amountPesewas: Pesewas): PaymentTransaction {
    const member = this.getMemberById(memberIdentifier) || this.getMemberByName(memberIdentifier);
    if (!member) {
      throw new Error(
        `Unknown member: "${memberIdentifier}". Only registered members can make contributions.`
      );
    }

    if (!Number.isInteger(amountPesewas) || amountPesewas <= 0) {
      throw new Error('Payment amount must be a positive integer in pesewas.');
    }

    const paidSoFar = this.getMemberPaidAmountThisWeek(member.id);
    const remainingBalance = this.weeklyContributionPesewas - paidSoFar;

    if (amountPesewas > remainingBalance) {
      throw new Error(
        `Payment of ${amountPesewas} pesewas exceeds remaining balance of ${remainingBalance} pesewas for week ${this.currentWeekNumber}.`
      );
    }

    this.cycleStarted = true;

    const transaction: PaymentTransaction = {
      id: `tx_${this.transactions.length + 1}`,
      memberId: member.id,
      weekNumber: this.currentWeekNumber,
      amountPesewas,
      paidAt: new Date(),
    };

    this.transactions.push(transaction);
    return transaction;
  }

  getMemberPaidAmountThisWeek(memberId: string): Pesewas {
    return this.transactions
      .filter((tx) => tx.memberId === memberId && tx.weekNumber === this.currentWeekNumber)
      .reduce((sum, tx) => sum + tx.amountPesewas, 0);
  }

  getMemberBalanceThisWeek(memberId: string): Pesewas {
    const paid = this.getMemberPaidAmountThisWeek(memberId);
    return this.weeklyContributionPesewas - paid;
  }

  getMemberStatus(memberId: string): PaymentStatus {
    const paid = this.getMemberPaidAmountThisWeek(memberId);
    if (paid === 0) {
      return 'UNPAID';
    }
    if (paid >= this.weeklyContributionPesewas) {
      return 'PAID';
    }
    return 'PARTIAL';
  }

  getWeeklyContributionRecords(): readonly WeeklyContributionRecord[] {
    return this.membersList.map((member) => ({
      memberId: member.id,
      weekNumber: this.currentWeekNumber,
      amountPaidPesewas: this.getMemberPaidAmountThisWeek(member.id),
      status: this.getMemberStatus(member.id),
    }));
  }

  getOutstandingBalances(): readonly OutstandingBalanceReport[] {
    const outstanding: OutstandingBalanceReport[] = [];
    for (const member of this.membersList) {
      const balance = this.getMemberBalanceThisWeek(member.id);
      if (balance > 0) {
        outstanding.push({
          member,
          balancePesewas: balance,
        });
      }
    }
    return outstanding;
  }

  closeWeek(): PayoutRecord {
    if (this.membersList.length === 0) {
      throw new Error('Cannot close week for a group with no registered members.');
    }

    const outstanding = this.getOutstandingBalances();
    if (outstanding.length > 0) {
      const details = outstanding
        .map((o) => `${o.member.name} owes ${o.balancePesewas} pesewas`)
        .join(', ');
      throw new Error(
        `Cannot close week ${this.currentWeekNumber}. Outstanding balances: ${details}.`
      );
    }

    // Determine recipient based on joining order (0-indexed rotation)
    const recipientIndex = (this.currentWeekNumber - 1) % this.membersList.length;
    const recipient = this.membersList[recipientIndex];

    const totalPotPesewas = this.membersList.length * this.weeklyContributionPesewas;

    const payout: PayoutRecord = {
      weekNumber: this.currentWeekNumber,
      recipientMemberId: recipient.id,
      recipientName: recipient.name,
      payoutAmountPesewas: totalPotPesewas,
      disbursedAt: new Date(),
    };

    this.payoutHistoryList.push(payout);
    this.currentWeekNumber += 1;

    return payout;
  }

  getPayoutHistory(): readonly PayoutRecord[] {
    return [...this.payoutHistoryList];
  }

  getTransactions(weekNumber?: number): readonly PaymentTransaction[] {
    if (weekNumber !== undefined) {
      return this.transactions.filter((tx) => tx.weekNumber === weekNumber);
    }
    return [...this.transactions];
  }
}
