# Susu Manager — Rotating Savings Group Tracker

**Susu Manager** is a Node.js and TypeScript command-line application that manages a single rotating savings and credit association (*Susu* group) in Ghana.

Every member of the group contributes an identical, fixed amount in Ghana Cedis (GH₵) each week. Once every member has paid in full, the entire weekly accumulated pot is disbursed to one member in strictly preserved joining order.

---

## Key Features

1. **Group Setup**: Initialize one Susu group with a fixed weekly contribution amount.
2. **Member Registration**: Register members with unique names or identifiers before week 1 starts, locking their joining order.
3. **Contribution Tracking & Partial Payments**: Members can pay their weekly obligation in a single payment or across multiple partial installments.
4. **Strict Input & Arrears Validation**: Automatically rejects unknown members, zero/negative payments, and payments exceeding remaining weekly balances.
5. **Conditional Week Closure**: Prevents a week from closing if any member owes money, providing a transparent breakdown of delinquent balances.
6. **Automatic Pot Payout Rotation**: Upon successful closure, the complete weekly pot (`memberCount * weeklyContribution`) is disbursed to the next eligible member in joining sequence.
7. **Audit & Payout History**: Maintains an immutable log of all past payouts and contribution statuses.
8. **Integer Pesewas Monetary Accuracy**: Represents all money internally in integer pesewas (`GH₵1.00 = 100 pesewas`), completely eliminating floating-point rounding errors.

---

## Domain Example: Ama, Kofi, and Esi

Suppose a group is created with a weekly obligation of **GH₵50.00** (`5000` pesewas):

1. **Registration**:
   - **Ama** joins 1st &rarr; Assigned `joinOrder: 1` (Scheduled for Week 1 Payout)
   - **Kofi** joins 2nd &rarr; Assigned `joinOrder: 2` (Scheduled for Week 2 Payout)
   - **Esi** joins 3rd &rarr; Assigned `joinOrder: 3` (Scheduled for Week 3 Payout)
2. **Week 1 Contributions**:
   - Ama contributes GH₵50.00 in full &rarr; Status: `PAID`
   - Kofi makes a partial payment of GH₵20.00 &rarr; Status: `PARTIAL` (owes GH₵30.00)
   - Esi has not contributed yet &rarr; Status: `UNPAID` (owes GH₵50.00)
   - *Attempting to close the week now will fail, reporting that Kofi owes GH₵30.00 and Esi owes GH₵50.00.*
3. **Week 1 Closure**:
   - Kofi pays the remaining GH₵30.00 and Esi pays GH₵50.00.
   - Now that all members are fully paid, Week 1 is closed.
   - **The pot of GH₵150.00 is disbursed to Ama**.
   - The application automatically advances to **Week 2**, ready for Kofi's rotation.

---

## Architecture & Separation of Concerns

The project adheres to clean code principles:
* **`src/types.ts`**: Pure data contracts, types, and pesewas conversion helpers.
* **`src/module/susuGroup.ts`**: Core business domain logic encapsulating state transitions, balance queries, closure validation, and payout rotation. Completely decoupled from terminal I/O.
* **`src/cli/formatter.ts`**: Currency and tabular presentation formatters.
* **`src/cli/index.ts`**: Interactive terminal menu using standard Node.js `node:readline/promises`.
* **`tests/`**: Automated test suite powered by Vitest.

---

## Installation & Usage

### Prerequisites
* **Node.js**: `v20.0.0` or higher (verified on `v24.15.0`)
* **npm**: `v10.0.0` or higher (verified on `11.12.1`)
* **Git**: `2.30.0` or higher

### Setup
```bash
# Clone the repository
git clone https://github.com/Francis054/Susu-Group-Tracker.git
cd Susu-Group-Tracker

# Install dependencies
npm install
```

### Available Scripts
* **Run Tests**:
  ```bash
  npm test
  ```
* **Run Type-Checker**:
  ```bash
  npm run typecheck
  ```
* **Build Project**:
  ```bash
  npm run build
  ```
* **Start Application (Production)**:
  ```bash
  npm start
  ```
* **Start Application (Development)**:
  ```bash
  npm run dev
  ```
