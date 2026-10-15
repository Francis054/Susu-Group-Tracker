import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { SusuGroup } from '../module/susuGroup.js';
import {
  formatGhs,
  formatMemberList,
  formatPayoutHistory,
  formatWeeklyStatus,
  parseGhsToPesewas,
} from './formatter.js';

export async function runCli(): Promise<void> {
  const rl = readline.createInterface({ input, output });

  console.log('==================================================');
  console.log('       WELCOME TO SUSU GROUP TRACKER (GHANA)      ');
  console.log('==================================================\n');

  let group: SusuGroup | null = null;

  try {
    // Group Setup
    while (!group) {
      const name = await rl.question('Enter group name: ');
      const amountInput = await rl.question('Enter weekly contribution amount in GH₵ (e.g., 50): ');

      try {
        const weeklyPesewas = parseGhsToPesewas(amountInput);
        group = new SusuGroup(name, weeklyPesewas);
        console.log(
          `\nGroup "${group.name}" initialized with weekly contribution of ${formatGhs(weeklyPesewas)} per member.\n`
        );
      } catch (err) {
        console.log(`Error: ${(err as Error).message}\n`);
      }
    }

    // Interactive Menu Loop
    let running = true;
    while (running) {
      console.log('\n--- MAIN MENU ---');
      console.log('1. Register a Member');
      console.log('2. Record Weekly Contribution');
      console.log('3. View Current Week Status & Balances');
      console.log('4. Close Current Week (Disburse Pot)');
      console.log('5. View Payout History');
      console.log('6. Exit');

      const choice = (await rl.question('\nSelect an option (1-6): ')).trim();

      switch (choice) {
        case '1': {
          if (group.isCycleStarted) {
            console.log('Notice: Member registration is closed because week 1 contributions have started.');
            break;
          }
          const memberName = await rl.question('Enter member name: ');
          try {
            const member = group.registerMember(memberName);
            console.log(`Member registered: ${member.name} (Join Order: ${member.joinOrder})`);
          } catch (err) {
            console.log(`Error: ${(err as Error).message}`);
          }
          break;
        }

        case '2': {
          const members = group.getMembers();
          if (members.length === 0) {
            console.log('No members registered yet. Please register members first.');
            break;
          }

          console.log('\n' + formatMemberList(members));
          const idOrName = await rl.question('\nEnter member name or ID: ');
          const amountStr = await rl.question('Enter payment amount in GH₵ (e.g., 20 or 50): ');

          try {
            const pesewas = parseGhsToPesewas(amountStr);
            const tx = group.recordPayment(idOrName, pesewas);
            const member = group.getMemberById(tx.memberId);
            const remaining = group.getMemberBalanceThisWeek(tx.memberId);

            console.log(
              `Payment recorded: ${formatGhs(tx.amountPesewas)} for ${member?.name}. Remaining balance for Week ${tx.weekNumber}: ${formatGhs(remaining)}.`
            );
          } catch (err) {
            console.log(`Error: ${(err as Error).message}`);
          }
          break;
        }

        case '3': {
          const records = group.getWeeklyContributionRecords();
          const members = group.getMembers();
          console.log('\n' + formatWeeklyStatus(group.currentWeek, group.weeklyContribution, members, records));
          break;
        }

        case '4': {
          try {
            const payout = group.closeWeek();
            console.log('\n==================================================');
            console.log(`SUCCESS: Week ${payout.weekNumber} closed!`);
            console.log(`Pot of ${formatGhs(payout.payoutAmountPesewas)} disbursed to: ${payout.recipientName}`);
            console.log(`Next active week is now Week ${group.currentWeek}.`);
            console.log('==================================================');

            if (group.isCycleCompleted) {
              console.log('\n*** CONGRATULATIONS: All members in this group have received their payout! ***');
            }
          } catch (err) {
            console.log(`\nCannot close week: ${(err as Error).message}`);
          }
          break;
        }

        case '5': {
          const history = group.getPayoutHistory();
          console.log('\n' + formatPayoutHistory(history));
          break;
        }

        case '6': {
          console.log('\nThank you for using Susu Group Tracker. Goodbye!\n');
          running = false;
          break;
        }

        default: {
          console.log('Invalid option. Please enter a number between 1 and 6.');
          break;
        }
      }
    }
  } finally {
    rl.close();
  }
}
