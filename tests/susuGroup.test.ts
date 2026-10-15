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

    // Attempting to pay 6000 pesewas (GH₵60) when requirement is 5000
    expect(() => group.recordPayment('Ama', 6000)).toThrow(
      'Payment of 6000 pesewas exceeds remaining balance of 5000 pesewas for week 1.'
    );

    // Pay 4000 first, then attempt to pay 2000 when only 1000 is owed
    group.recordPayment('Ama', 4000);
    expect(() => group.recordPayment('Ama', 2000)).toThrow(
      'Payment of 2000 pesewas exceeds remaining balance of 1000 pesewas for week 1.'
    );
  });

  it('should lock member registration once contributions begin', () => {
    const group = new SusuGroup('Osu Club', ghsToPesewas(50));
    group.registerMember('Ama');

    // Once Ama pays, cycle begins
    group.recordPayment('Ama', 2000);

    expect(() => group.registerMember('Kofi')).toThrow(
      'Members can only be added before the first week starts.'
    );
  });
});
