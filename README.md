# Job Tracking

A personal job tracking app for software developer roles. Log recruiter emails and calls, track status (Responded, Interviewing, Interviewed, etc.), and keep recruiter and company details in one place.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn-style UI components
- **Prisma** ORM with **PostgreSQL** (Neon free tier recommended)
- **Vercel** for free hosting

## Features

- Unified list of recruiter emails and calls
- Status dropdown: New, Responded, Meeting Scheduled, Interviewing, Interviewed, Offer, Rejected, No Response, Withdrawn
- Fields: recruiter name, email, company, role title, contact date, notes
- Search and filter by status, contact type, company/recruiter/role
- Sortable table (desktop) and card layout (mobile)
- Full CRUD with persistent Postgres storage

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Set up a free Postgres database

Create a free project at [Neon](https://neon.tech) (or use Vercel Postgres in the Vercel dashboard).

Copy `.env.example` to `.env` and set your connection string:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@direct-host/dbname?sslmode=require"
```

### 3. Run migrations

```bash
npm run db:migrate
```

Optional: seed sample data:

```bash
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client, apply production migrations, and build |
| `npm run start` | Start production server |
| `npm run test` | Run Vitest tests |
| `npm run db:migrate` | Apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Insert sample opportunities |

## Deploy to Vercel (Free)

1. Push this repo to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Add a database:
   - **Storage** tab → **Create Database** → **Postgres** (Neon), or
   - Connect an existing Neon project and add `DATABASE_URL` and `DATABASE_URL_UNPOOLED` under **Settings → Environment Variables**.
4. Vercel will run `prisma generate`, `prisma migrate deploy`, and `next build` via the `build` script.
5. Redeploy if needed. Your app will persist data in Postgres across sessions.

### Free tier notes

- **Vercel Hobby**: fine for personal use; serverless functions may cold-start after idle time.
- **Neon free**: ~0.5 GB storage; projects may suspend when idle and wake on the first request.

## API

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/opportunities` | List opportunities (`?status=`, `?contactType=`, `?search=`) |
| `POST` | `/api/opportunities` | Create opportunity |
| `GET` | `/api/opportunities/[id]` | Get one opportunity |
| `PATCH` | `/api/opportunities/[id]` | Update opportunity |
| `DELETE` | `/api/opportunities/[id]` | Delete opportunity |

## Project structure

```
src/
  app/                    # Next.js routes and API
  components/             # UI components
  lib/                    # DB client, validation, constants
prisma/
  schema.prisma           # Data model
  migrations/             # SQL migrations
tests/                    # Vitest tests
```
