import { runCli } from './cli/index.js';

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
export { runCli } from './cli/index.js';

export function getApplicationName(): string {
  return 'Susu Manager';
}

// Auto-run CLI if file is executed directly
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  runCli().catch((err) => {
    console.error('Fatal CLI Error:', err);
    process.exit(1);
  });
}
