# Tasks

A personal, single-user task and project manager. Next.js 14 (App Router) + TypeScript, Tailwind + shadcn/ui, Supabase (Postgres, RLS), dnd-kit, date-fns, Zod.

## Setup

### 1. Create the Supabase project
1. Go to <https://supabase.com/dashboard> and create a new project.
2. Open **Project Settings → API** and copy the **Project URL** (bare, without `/rest/v1`) and the **service_role** key.
3. Open **Project Settings → Database → Connection string** (Transaction pooler) and copy it for `DB_URL`.

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`DB_URL` (the Postgres connection string, used only by the migration and type scripts) goes in `.env`.

**Security model:** there is no login. Every table has RLS enabled with no policies, so the public anon key can read and write nothing. The app talks to Supabase only from the server using `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. Never prefix it with `NEXT_PUBLIC_`, never commit it, and note that anyone who can reach your deployed site can use the app.

Never commit `.env` or `.env.local` (both are git-ignored).

### 3. Run migrations
```bash
npm run db:migrate   # applies supabase/migrations/*.sql once each
npm run db:types     # regenerates types/database.ts (needs Docker running)
```

### 4. Run locally
```bash
npm install
npm run dev
```
Open <http://localhost:3000>.

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | Strict TypeScript check |
| `npm run lint` | ESLint (`no-explicit-any` is an error) |
| `npm test` | Vitest unit tests |
| `npm run db:migrate` / `db:types` | Database scripts (see above) |

## Structure
```
app/                  routes (App Router)
components/           UI (components/ui = shadcn)
lib/supabase/         browser, server and middleware clients
lib/queries/          data fetching
lib/actions/          mutations (Server Actions)
lib/validators/       Zod schemas
types/                shared and generated types
supabase/migrations/  SQL migrations
```

## Features
- **Board (/)**: three columns with drag and drop (mouse, touch and keyboard), quick-add per column, stats strip, filters (project, priority, tag) and search.
- **Deadlines (/deadlines)**: open tasks grouped into Overdue, Today, Next 7 days, Later and No deadline, plus a month calendar.
- **Projects (/projects, /projects/[id])**: progress, milestones with their own progress, a Gantt-style timeline, archive and delete.
- **Review (/review)**: completed this week, slipped past deadline, and due next week.
- **Task dialog**: all fields, notes, tags (create inline) and subtasks.

### Keyboard shortcuts
| Key | Action |
| --- | --- |
| `n` | New task (from any page) |
| `/` | Focus search (from any page) |
| `Esc` in search | Clear and leave the search box |
| `Space`, arrows, `Space` on a card's drag handle | Pick up, move and drop a card with the keyboard |

Shortcuts are ignored while you type in a field or have a dialog open.

## Tests
`npm test` runs Vitest unit tests for the logic that matters most: progress, deadline grouping, `completed_at` and card positions, board filters, the weekly review and the project timeline.

## Deploying to Vercel
1. Push the repo to GitHub, GitLab or Bitbucket and import it at <https://vercel.com/new>. The Next.js preset needs no build settings (Node 18.17 or newer).
2. Add these **Environment Variables** (Production and Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`: the bare project URL, for example `https://abcd.supabase.co` (no `/rest/v1`).
   - `SUPABASE_SERVICE_ROLE_KEY`: the service_role key. Do **not** prefix it with `NEXT_PUBLIC_`.
3. `DB_URL` is **not** needed on Vercel. Run `npm run db:migrate` from your machine against the same Supabase project before the first deploy.
4. Deploy. There are no auth redirect URLs to configure.

### Protect the deployment
The app has no login, and the service-role key gives the server full database access. Anyone who can open your deployed URL can read and change your tasks. Put something in front of it, for example Vercel Deployment Protection (password or Vercel Authentication, depending on your plan) or an access proxy such as Cloudflare Access.
### Rotating keys
If the service-role key ever leaks, rotate it in Supabase (Project Settings, API), update the Vercel variable and redeploy.
