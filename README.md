# LiftLog

A fast, mobile-first workout tracker. Log sets the moment you tap, track every personal record automatically, and watch your progress over time — without menus or friction. Dark, focused, and built for lifters.

## Features

- **Fast set logging** — freeform sets save on tap; the next set pre-fills from your last one. Supports strength (weight × reps), bodyweight (reps), and cardio (duration) exercises.
- **Automatic personal records** — every all-time max is detected and flagged as you train.
- **Progress charts** — weekly/monthly volume, per-exercise trends, muscle-group split, and body-weight over time.
- **Rest timer** — a glanceable count-up timer between sets, one tap to dismiss.
- **Templates & notes** — reuse your favourite splits and jot how each session felt.
- **Consistency** — a workout heatmap calendar and current streak on the dashboard.
- **Repeat last workout** — start a new session pre-seeded from your previous one.
- **Shareable workouts** — publish any session to a public read-only link.
- **kg / lbs** — switch units anytime; weights are stored canonically in kg and converted for display.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict), Vite |
| Styling | Tailwind CSS (HSL CSS-variable tokens, dark-only black + emerald), Radix UI primitives, `class-variance-authority` |
| Data | TanStack Query (React Query) |
| Backend | Supabase — Postgres, Auth, Row Level Security, and a `security definer` RPC for share links |
| Routing | React Router |
| Charts | Recharts (code-split) |
| Dates | date-fns |
| Toasts | react-hot-toast |
| Tests | Vitest |

The app is a single-page application that talks directly to Supabase using the anon key; all authorization is enforced server-side via RLS policies and the share RPC.

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Install

```bash
npm install
```

### 2. Configure environment

Create a `.env.local` file in the project root:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values come from your Supabase project's **API settings**.

### 3. Set up the database

Apply the SQL migrations in [`supabase/migrations/`](supabase/migrations/) in order (`001` → `007`). Either paste them into the Supabase **SQL Editor**, or use the Supabase CLI:

```bash
supabase db push
```

The migrations create the schema, indexes, RLS policies, the share RPC, and seed the default exercise library.

### 4. Run

```bash
npm run dev
```

The app starts at http://localhost:5173.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest unit suite once |
| `npm run test:watch` | Run Vitest in watch mode |

## Project structure

```
src/
  components/    UI primitives, layout, and workout-specific components
  contexts/      Auth context (Supabase session)
  hooks/         React Query data hooks (workouts, exercises, templates, ...)
  lib/           Supabase client + pure utilities (units, dates, streak)
  pages/         Route-level screens (Dashboard, WorkoutActive, Progress, ...)
  types/         Database row/type definitions
supabase/
  migrations/    Ordered SQL: schema, indexes, RLS, RPC, seed data
```

## Testing

Unit tests live next to the code they cover (`*.test.ts`) and run in Node via Vitest. They focus on the pure logic where bugs hurt most — unit conversion, duration formatting, PR detection, and streak calculation:

```bash
npm test
```

## Data model notes

- **Units:** weights are stored in kilograms; lbs is a display-only conversion.
- **Sets:** `workout_sets` is polymorphic — `reps`, `weight_kg`, and `duration_secs` are nullable so one table serves strength, bodyweight, and cardio exercises.
- **Sharing:** public workout links are served by a `security definer` RPC (`get_shared_workout`) so anonymous viewers can read a single shared workout without table-level access.
