# Ledgerly

A responsive account manager starter for separate business workbooks, customers and suppliers, dated ledger entries, batch workflows, and transaction attachments.

## Stack

- Next.js 16 App Router, React, TypeScript, and Tailwind CSS
- PostgreSQL with Prisma ORM 7 and the `pg` driver adapter
- Neon Object Storage (S3-compatible) through the AWS SDK v3
- Neon Managed Better Auth with protected account routes
- Web app manifest is included for installable mobile and tablet use

## Start locally

1. Install Node.js 22 or newer and PostgreSQL.
2. Copy `.env.example` to `.env` and fill in the database, Object Storage, Neon Auth URL, and JWKS URL values for the same Neon branch. Set `NEON_AUTH_COOKIE_SECRET` to a private random value with at least 32 characters. Keep `.env` local; it contains credentials.
3. Install dependencies with `npm install`.
4. Generate the Prisma client and apply the first migration:

   ```sh
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the development server with `npm run dev`, then open `/auth/sign-up` to create the first account or `/auth/sign-in` to sign in.

Sign-up, sign-in, sign-out, and protection for the dashboard and party ledger routes use Neon Managed Better Auth. Party, transaction, and workspace data are stored in PostgreSQL. The S3 helper stores object keys and creates short-lived signed download URLs; signed URLs are not saved in PostgreSQL.

## Bulk data transfer

Open **Import / export** from the Parties page. Imports are applied only to the selected workspace. Supported source files are `.xlsx` workbooks with `Parties` and `Transactions` sheets and SQLite `.db` files with party/account and transaction/ledger tables. The importer recognizes `party_name`, `recorded_balance`, separate `credit` and `debit` columns, and common account/transaction ID and date field names. Preview the rows before importing. Files without a party type use the selected fallback type. When only a recorded balance is available, choose whether it represents the opening balance or the current balance after imported transactions.

To import a SQLite `.db` file, run the app with Node.js 22.12 or newer. The database is opened read-only. Imports skip malformed transaction rows with warnings and stop if party names already exist in the selected workspace. Transaction documents are not imported from source files. Exports contain `Summary`, `Parties`, `Transactions`, and `Documents` sheets; the Documents sheet includes metadata and object keys, not the stored file contents.

## Data model

Each workbook belongs to an owner and holds its own parties. A party has a customer or supplier type and a signed opening ledger balance (debit positive, credit negative). Transactions reference a party by ID, store a `DATE` and an exact decimal amount, and carry a debit/credit entry type. Calendar day/month/year are derived from the transaction date. Insert and update timestamps are stored as `createdAt` and `updatedAt`. Transaction documents store the Neon Object Storage bucket, object key, and file metadata. Enforce the five-file cap in the authorized transaction upload flow.

The balance shown to a user should be calculated from the opening balance and ledger entries, not duplicated as a manually edited current-balance field. Display labels can interpret the natural balance using party type.

## Deploying

- `npm install` runs `prisma generate` automatically (the generated client is not committed), so hosted builds work without extra steps.
- Apply database migrations on release with `npm run db:deploy` (uses `prisma7.config.ts` and `DATABASE_URL`). Use `npm run db:migrate` for local development.
- Set every variable from `.env.example` in the hosting provider, with `NEON_AUTH_COOKIE_SECRET` generated per environment.
- Run on Node.js 22.12 or newer (the SQLite import uses `node:sqlite`).
- Party names are unique per workspace. The `party_name_unique` migration renames any existing duplicates as `Name (2)`, `Name (3)` before adding the constraint.

## Git workflow

The GitHub remote is `origin`. Development work goes on `dev`; `release` is reserved for production-ready snapshots. The project currently has a `main` branch on GitHub.


