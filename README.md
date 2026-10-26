# Ledgerly

A responsive account manager starter for separate business workbooks, customers and suppliers, dated ledger entries, batch workflows, and transaction attachments.

## Stack

- Next.js 16 App Router, React, TypeScript, and Tailwind CSS
- PostgreSQL with Prisma ORM 7 and the `pg` driver adapter
- Neon Object Storage (S3-compatible) through the AWS SDK v3; document upload routes await authentication and authorization
- Web app manifest is included for installable mobile and tablet use

## Start locally

1. Install Node.js 22 or newer and PostgreSQL.
2. Copy `.env.example` to `.env` and fill in the database and Object Storage values shown for the same Neon branch. Keep `.env` local; it contains credentials.
3. Install dependencies with `npm install`.
4. Generate the Prisma client and apply the first migration:

   ```sh
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the development server with `npm run dev`.

The dashboard is a visual starter and currently shows sample data. Database tables and the Prisma client are ready for the next implementation steps. Authentication, CRUD flows, batch import/export, and upload routes are not wired yet. Do not expose document upload routes until their middleware verifies that the signed-in user owns the workbook and transaction. The S3 helper stores object keys and creates short-lived signed download URLs; signed URLs are not saved in PostgreSQL.

## Data model

Each workbook belongs to an owner and holds its own parties. A party has a customer or supplier type and a signed opening ledger balance (debit positive, credit negative). Transactions reference a party by ID, store a `DATE` and an exact decimal amount, and carry a debit/credit entry type. Calendar day/month/year are derived from the transaction date. Insert and update timestamps are stored as `createdAt` and `updatedAt`. Transaction documents store the Neon Object Storage bucket, object key, and file metadata. Enforce the five-file cap in the authorized transaction upload flow.

The balance shown to a user should be calculated from the opening balance and ledger entries, not duplicated as a manually edited current-balance field. Display labels can interpret the natural balance using party type.

## Git workflow

The GitHub remote is `origin`. Development work goes on `dev`; `release` is reserved for production-ready snapshots. The project currently has a `main` branch on GitHub.


