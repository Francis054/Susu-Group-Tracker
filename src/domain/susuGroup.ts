import { Member, Pesewas } from '../types.js';

export class SusuGroup {
  private readonly groupName: string;
  private readonly weeklyContributionPesewas: Pesewas;
  private readonly membersList: Member[] = [];
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
}
