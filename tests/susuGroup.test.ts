import { describe, it, expect } from 'vitest';
import { SusuGroup } from '../src/domain/susuGroup.js';
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
