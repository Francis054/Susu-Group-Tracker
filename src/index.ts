export type {
  Pesewas,
  PaymentStatus,
  Member,
  WeeklyContributionRecord,
  PaymentTransaction,
  PayoutRecord,
  SusuGroup as SusuGroupState,
} from './types.js';
export { ghsToPesewas, formatPesewasToGhs } from './types.js';
export { SusuGroup } from './module/susuGroup.js';

export function getApplicationName(): string {
  return 'Susu Manager';
}
