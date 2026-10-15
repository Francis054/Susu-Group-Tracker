# Susu Manager — Architectural Notes & Technical Tradeoffs

This document records the architectural decisions, design tradeoffs, challenges encountered, and future expansion paths for the **Susu Manager** project.

---

## 1. Architectural Decisions

### 1.1 Integer Pesewas Monetary Representation
* **Decision**: All financial amounts (contributions, balances, pots, and payouts) are calculated and stored internally as **integer pesewas** (`1 GHS = 100 pesewas`).
* **Rationale**: IEEE 754 floating-point arithmetic introduces well-documented precision anomalies (e.g., `0.1 + 0.2 = 0.30000000000000004`). In a savings association where members contribute fractional cedis, precision errors can cause cumulative imbalances. Storing whole pesewas guarantees exact arithmetic operations across all transactions.
* **Conversion Layer**: User-facing conversions occur solely in `src/cli/formatter.ts` and `src/types.ts` (`ghsToPesewas` and `formatPesewasToGhs`), isolating the presentation format from the calculation engine.

### 1.2 Separation of Concerns
* **Decision**: The core domain engine (`src/module/susuGroup.ts`) has **zero awareness** of the terminal, standard I/O, or console formatting.
* **Rationale**: Decoupling the domain logic ensures that all business rules (such as week closure preconditions and duplicate name rejections) can be thoroughly tested via automated Vitest unit tests without needing mock CLI streams. In the future, this exact same module can be imported by an Express HTTP server or a desktop GUI without changing a single line of business logic.

### 1.3 Minimalist Dependency Footprint
* **Decision**: Zero runtime third-party dependencies. Development dependencies are strictly limited to `typescript`, `@types/node`, `vitest`, and `tsx`.
* **Rationale**: Using Node.js standard libraries (`node:readline/promises`) avoids bloated `node_modules` trees, minimizes security vulnerabilities, and keeps the project lightweight and beginner-friendly.

---

## 2. Technical Tradeoffs

### 2.1 In-Memory Storage vs. Persistent Database
* **Chosen Approach**: In-memory array storage.
* **Tradeoff**: Application state is volatile and resets upon exiting the process.
* **Why**: The project requirements explicitly specified a command-line application managing a single group per instance. Avoiding external database drivers (e.g., PostgreSQL, SQLite) eliminates configuration friction, environment dependencies, and database migrations, making the project easily runnable on any developer's computer.

### 2.2 Built-in Readline vs. Interactive CLI Libraries (e.g., Inquirer / Prompts)
* **Chosen Approach**: Native `node:readline/promises`.
* **Tradeoff**: Menus use text-based numbered options rather than cursor-driven interactive arrow selections.
* **Why**: Retains 100% standard library compliance, eliminating dependency churn while delivering a reliable, robust terminal experience across Windows, macOS, and Linux.

---

## 3. Challenges Encountered & Resolutions

1. **Atomic Payment Validation**:
   - *Challenge*: Supporting multiple partial payments while preventing accidental overpayments.
   - *Resolution*: Implemented a two-step validation pattern in `recordPayment`. The remaining balance is computed first; if `amountPesewas > remainingBalance`, an error is thrown before modifying the transactions array, keeping the state completely atomic.
2. **TypeScript Module Ambiguity**:
   - *Challenge*: Naming the interface `SusuGroup` in `src/types.ts` and the domain class `SusuGroup` in `src/module/susuGroup.ts` caused a re-export conflict when using wildcard exports.
   - *Resolution*: Explicitly typed re-exports were configured in `src/index.ts` (`SusuGroup as SusuGroupState` for the interface and `SusuGroup` for the class), satisfying strict TypeScript compiler rules.

---

## 4. Future Expansion Roadmap

If this application were expanded into a production fintech system, the recommended next steps would be:

1. **Persistent Data Storage**:
   - Introduce an ORM/query builder (e.g., Prisma or Drizzle) paired with PostgreSQL or SQLite to persist members, transactions, and closed week histories across restarts.
2. **REST API & Web Interface**:
   - Wrap the domain module in a Fastify/Express API and build a modern web dashboard.
3. **Mobile Money (MoMo) Integration**:
   - Integrate with Ghanaian payment gateways (such as Paystack, Hubtel, or Flutterwave) to allow members to contribute directly via MTN Mobile Money, Telecel Cash, or AT Money.
4. **Multi-Cycle & Rolling Group Support**:
   - Allow groups to automatically initiate Cycle 2 upon completing Cycle 1, allowing members to adjust weekly contribution amounts or re-order payout rotations.
