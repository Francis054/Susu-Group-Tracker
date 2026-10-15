import { describe, it, expect } from 'vitest';
import { SusuGroup } from '../src/module/susuGroup.js';
import { ghsToPesewas } from '../src/types.js';

describe('SusuGroup — Milestone 4: Group Creation & Member Registration', () => {
  it('should initialize a susu group with valid parameters', () => {
    const weeklyAmount = ghsToPesewas(50); // 5000 pesewas
    const group = new SusuGroup('Osu Savings Club', weeklyAmount);

    expect(group.name).toBe('Osu Savings Club');
    expect(group.weeklyContribution).toBe(5000);
    expect(group.currentWeek).toBe(1);
    expect(group.getMembers()).toHaveLength(0);
  });

  it('should reject invalid group names', () => {
    expect(() => new SusuGroup('', 5000)).toThrow('Group name cannot be empty.');
    expect(() => new SusuGroup('   ', 5000)).toThrow('Group name cannot be empty.');
  });

  it('should reject invalid or non-integer weekly contributions', () => {
    expect(() => new SusuGroup('Club', 0)).toThrow(
      'Weekly contribution must be a positive integer in pesewas.'
    );
    expect(() => new SusuGroup('Club', -100)).toThrow(
      'Weekly contribution must be a positive integer in pesewas.'
    );
    expect(() => new SusuGroup('Club', 50.5)).toThrow(
      'Weekly contribution must be a positive integer in pesewas.'
    );
  });

  it('should register members in strictly preserved joining order', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(100));

    const ama = group.registerMember('Ama');
    const kofi = group.registerMember('Kofi');
    const esi = group.registerMember('Esi');

    expect(ama).toEqual({ id: 'mem_1', name: 'Ama', joinOrder: 1 });
    expect(kofi).toEqual({ id: 'mem_2', name: 'Kofi', joinOrder: 2 });
    expect(esi).toEqual({ id: 'mem_3', name: 'Esi', joinOrder: 3 });

    const members = group.getMembers();
    expect(members).toHaveLength(3);
    expect(members[0].name).toBe('Ama');
    expect(members[1].name).toBe('Kofi');
    expect(members[2].name).toBe('Esi');
  });

  it('should reject duplicate member registration regardless of case', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(100));
    group.registerMember('Ama');

    expect(() => group.registerMember('Ama')).toThrow(
      'Member with name "Ama" is already registered.'
    );
    expect(() => group.registerMember('ama')).toThrow(
      'Member with name "ama" is already registered.'
    );
  });

  it('should reject empty or whitespace member names', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(100));

    expect(() => group.registerMember('')).toThrow('Member name cannot be empty.');
    expect(() => group.registerMember('   ')).toThrow('Member name cannot be empty.');
  });

  it('should look up members by id and by name', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(100));
    group.registerMember('Ama');
    group.registerMember('Kofi');

    expect(group.getMemberById('mem_1')?.name).toBe('Ama');
    expect(group.getMemberByName('kofi')?.id).toBe('mem_2');
    expect(group.getMemberByName('Unknown')).toBeUndefined();
  });
});

describe('SusuGroup — Milestone 5: Contribution Tracking & Partial Payments', () => {
  it('should record a full weekly payment in a single transaction', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50)); // 5000 pesewas
    const ama = group.registerMember('Ama');

    const tx = group.recordPayment(ama.id, 5000);

    expect(tx.memberId).toBe('mem_1');
    expect(tx.weekNumber).toBe(1);
    expect(tx.amountPesewas).toBe(5000);
    expect(group.getMemberPaidAmountThisWeek('mem_1')).toBe(5000);
    expect(group.getMemberBalanceThisWeek('mem_1')).toBe(0);
  });

  it('should support multiple partial payments totaling the weekly obligation', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50)); // 5000 pesewas
    group.registerMember('Kofi');

    // Kofi makes first partial payment of 2000 pesewas (GH₵20)
    const tx1 = group.recordPayment('Kofi', 2000);
    expect(tx1.amountPesewas).toBe(2000);
    expect(group.getMemberPaidAmountThisWeek('mem_1')).toBe(2000);
    expect(group.getMemberBalanceThisWeek('mem_1')).toBe(3000);

    // Kofi makes second partial payment of 3000 pesewas (GH₵30)
    const tx2 = group.recordPayment('Kofi', 3000);
    expect(tx2.amountPesewas).toBe(3000);
    expect(group.getMemberPaidAmountThisWeek('mem_1')).toBe(5000);
    expect(group.getMemberBalanceThisWeek('mem_1')).toBe(0);

    const txs = group.getTransactions(1);
    expect(txs).toHaveLength(2);
  });

  it('should reject payments from unknown members', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50));
    group.registerMember('Ama');

    expect(() => group.recordPayment('Stranger', 5000)).toThrow(
      'Unknown member: "Stranger". Only registered members can make contributions.'
    );
  });

  it('should reject zero or negative payment amounts', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50));
    group.registerMember('Ama');

    expect(() => group.recordPayment('Ama', 0)).toThrow(
      'Payment amount must be a positive integer in pesewas.'
    );
    expect(() => group.recordPayment('Ama', -500)).toThrow(
      'Payment amount must be a positive integer in pesewas.'
    );
    expect(() => group.recordPayment('Ama', 10.5)).toThrow(
      'Payment amount must be a positive integer in pesewas.'
    );
  });

  it('should reject payments that exceed the remaining weekly balance', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50)); // 5000 pesewas
    group.registerMember('Ama');

    expect(() => group.recordPayment('Ama', 6000)).toThrow(
      'Payment of 6000 pesewas exceeds remaining balance of 5000 pesewas for week 1.'
    );

    group.recordPayment('Ama', 4000);
    expect(() => group.recordPayment('Ama', 2000)).toThrow(
      'Payment of 2000 pesewas exceeds remaining balance of 1000 pesewas for week 1.'
    );
  });

  it('should lock member registration once contributions begin', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50));
    group.registerMember('Ama');

    group.recordPayment('Ama', 2000);

    expect(() => group.registerMember('Kofi')).toThrow(
      'Members can only be added before the first week starts.'
    );
  });
});

describe('SusuGroup — Milestones 6 & 7: Week Closure, Balances & Payout Rotation', () => {
  it('should accurately calculate payment statuses and weekly records', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(100)); // 10000 pesewas
    const ama = group.registerMember('Ama');
    const kofi = group.registerMember('Kofi');
    const esi = group.registerMember('Esi');

    group.recordPayment(ama.id, 10000); // Fully paid
    group.recordPayment(kofi.id, 4000); // Partial

    expect(group.getMemberStatus(ama.id)).toBe('PAID');
    expect(group.getMemberStatus(kofi.id)).toBe('PARTIAL');
    expect(group.getMemberStatus(esi.id)).toBe('UNPAID');

    const records = group.getWeeklyContributionRecords();
    expect(records).toHaveLength(3);
    expect(records.find((r) => r.memberId === ama.id)?.status).toBe('PAID');
    expect(records.find((r) => r.memberId === kofi.id)?.status).toBe('PARTIAL');
    expect(records.find((r) => r.memberId === esi.id)?.status).toBe('UNPAID');
  });

  it('should prevent week closure if members have outstanding balances', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(100)); // 10000 pesewas
    group.registerMember('Ama');
    group.registerMember('Kofi');
    group.registerMember('Esi');

    group.recordPayment('Ama', 10000);
    group.recordPayment('Kofi', 5000); // Owes 5000
    // Esi owes 10000

    expect(() => group.closeWeek()).toThrow(
      'Cannot close week 1. Outstanding balances: Kofi owes 5000 pesewas, Esi owes 10000 pesewas.'
    );
    expect(group.currentWeek).toBe(1);
    expect(group.getPayoutHistory()).toHaveLength(0);
  });

  it('should reject week closure for an empty group', () => {
    const group = new SusuGroup('Empty Group', 5000);
    expect(() => group.closeWeek()).toThrow(
      'Cannot close week for a group with no registered members.'
    );
  });

  it('should successfully close week, pay entire pot to recipient in join order, and advance week', () => {
    const group = new SusuGroup('Unity Group', ghsToPesewas(50)); // 5000 pesewas each
    const ama = group.registerMember('Ama');
    const kofi = group.registerMember('Kofi');
    const esi = group.registerMember('Esi');

    // Week 1: Ama, Kofi, Esi all pay 5000
    group.recordPayment('Ama', 5000);
    group.recordPayment('Kofi', 5000);
    group.recordPayment('Esi', 5000);

    // Week 1 closure -> Pot = 3 * 5000 = 15000 pesewas (GH₵150)
    // First in joining order is Ama
    const payout1 = group.closeWeek();

    expect(payout1.weekNumber).toBe(1);
    expect(payout1.recipientMemberId).toBe(ama.id);
    expect(payout1.recipientName).toBe('Ama');
    expect(payout1.payoutAmountPesewas).toBe(15000);
    expect(group.currentWeek).toBe(2);

    // Week 2: all contribute again
    group.recordPayment('Ama', 5000);
    group.recordPayment('Kofi', 5000);
    group.recordPayment('Esi', 5000);

    // Week 2 closure -> Second in joining order is Kofi
    const payout2 = group.closeWeek();

    expect(payout2.weekNumber).toBe(2);
    expect(payout2.recipientMemberId).toBe(kofi.id);
    expect(payout2.recipientName).toBe('Kofi');
    expect(payout2.payoutAmountPesewas).toBe(15000);
    expect(group.currentWeek).toBe(3);

    // Week 3: all contribute again
    group.recordPayment('Ama', 5000);
    group.recordPayment('Kofi', 5000);
    group.recordPayment('Esi', 5000);

    // Week 3 closure -> Third in joining order is Esi
    const payout3 = group.closeWeek();

    expect(payout3.weekNumber).toBe(3);
    expect(payout3.recipientMemberId).toBe(esi.id);
    expect(payout3.recipientName).toBe('Esi');
    expect(payout3.payoutAmountPesewas).toBe(15000);

    // Cycle is now complete: all 3 members received payout
    expect(group.isCycleCompleted).toBe(true);

    const history = group.getPayoutHistory();
    expect(history).toHaveLength(3);
    expect(history[0].recipientName).toBe('Ama');
    expect(history[1].recipientName).toBe('Kofi');
    expect(history[2].recipientName).toBe('Esi');
  });
});
