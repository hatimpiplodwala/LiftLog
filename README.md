<div align="center">

# LiftLog

**A fast, mobile-first workout tracker for lifters who want to train, not fiddle with an app.**

Log sets the moment you tap. Track every personal record automatically. Watch your progress build over time — dark, focused, and out of your way.

React · TypeScript · Vite · Tailwind · Supabase · TanStack Query

</div>

---

## Why LiftLog

Most workout apps make you stop and think: open a menu, pick from a dropdown, confirm a dialog. LiftLog is built around the opposite idea — the gym is a bad place to be tapping through screens. Every set saves the instant you log it, the next set pre-fills from your last, and personal records light up on their own. The whole app is one quiet dark surface in emerald and black, designed thumb-first for a phone propped against a water bottle between sets.

It's a single-page app backed entirely by Supabase, with no custom server to run — authorization lives in the database itself.

## Highlights

### Logging that keeps up with you
Sets save on tap — no save button, no modal. Each new set pre-fills from the previous one (or from the same exercise in your last session), so a working set is usually one tap away. One table handles **strength** (weight × reps), **bodyweight** (reps), and **cardio** (duration), so the logging UI adapts to whatever you're doing.

### Records and progress, automatic
Every all-time max is detected as you train and flagged inline with a PR badge. The progress screen turns your history into four views: **weekly/monthly volume**, **per-exercise trends**, **muscle-group split**, and **body-weight over time** — each lazy-loaded so the page stays light.

### Built to keep you consistent
The dashboard shows a **workout heatmap calendar** and your current **streak**. **Repeat last workout** seeds a fresh session from your previous one. Save any session as a **template**, attach **notes** on how it felt, and publish a session to a **public read-only link** to share with a coach or friend.

### Details that matter
- **kg / lbs** toggle — weights are stored canonically in kilograms and converted only for display, so the data never drifts.
- A glanceable **rest timer** that counts up between sets, one tap to dismiss.
- Respects `prefers-reduced-motion` — every animation is neutralized globally for users who ask for it.

## How it's built

LiftLog is intentionally a thin, fast client over a well-secured database.

- **No backend to operate.** The SPA talks directly to Supabase with the anon key. All authorization is enforced server-side through **Row Level Security** — users can only ever read and write their own rows.
- **Sharing without a hole in security.** Public workout links are served by a `security definer` RPC (`get_shared_workout`) that returns exactly one shared workout, so anonymous viewers never get table-level read access.
- **A schema that fits the domain.** `workout_sets` is polymorphic: `reps`, `weight_kg`, and `duration_secs` are all nullable, so a single table cleanly models strength, bodyweight, and cardio without separate types.
- **Tuned for the queries it actually runs.** Composite indexes match the real access paths (e.g. a user's workouts by date, a workout's sets by completion time), and RLS policies are written to evaluate auth once per statement rather than per row.
- **Light on the wire.** Recharts and every route are code-split, and data fetching is centralized in TanStack Query hooks with surgical cache invalidation.
- **Trusted where it counts.** The pure logic — unit conversion, duration formatting, PR detection, streak calculation — is covered by a Vitest unit suite.

### Stack

| Area | Choice |
| --- | --- |
| UI | React 18 + TypeScript (strict), Vite |
| Styling | Tailwind CSS (HSL CSS-variable tokens, dark-only black + emerald), Radix UI primitives, `class-variance-authority` |
| Data | TanStack Query (React Query) |
| Backend | Supabase — Postgres, Auth, Row Level Security, share RPC |
| Routing | React Router |
| Charts | Recharts (code-split) |
| Dates | date-fns |
| Tests | Vitest |

### Project structure

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

## Running it locally

**Prerequisites:** Node.js 18+ and a [Supabase](https://supabase.com) project.

```bash
# 1. Install
npm install

# 2. Configure — create .env.local in the project root:
#    VITE_SUPABASE_URL=https://your-project.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-anon-key
#    (both from your Supabase project's API settings)

# 3. Set up the database — apply supabase/migrations/ in order (001 → 007)
#    via the Supabase SQL Editor, or with the CLI:
supabase db push

# 4. Run
npm run dev        # http://localhost:5173
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest unit suite once |
| `npm run test:watch` | Run Vitest in watch mode |
