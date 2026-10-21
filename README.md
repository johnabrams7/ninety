# Ninety

**A habit tracker built around a percentage, not a streak.**

Most habit apps punish you the moment a streak breaks. Ninety assumes real life is noisy. It tracks adherence as a percentage, treats 90% or more as a true habit, and when you slip it shows exactly how many clean days it takes to get back above the line.

> Status: work in progress. The adherence engine and data layer are built and tested. The full UI is being ported from the standalone prototype.

## The idea

- **90% is the target, not 100%.** Illness, travel, and accidents happen. A habit in the 90 to 100% range is a habit. Around 70% is the floor where recovery is still realistic.
- **A slip is data, not a reset.** The number dips and climbs back. No "day one again" cliff.
- **Recovery math up front.** After a slip the app tells you how many clean days get you back above 90%, so a bad week becomes a plan.
- **Streaks are optional.** They are tracked but can be hidden. The percentage is the focus.
- **Honest about who it is for.** Ninety suits habits where about 90% is realistic. Habits tied to a medical condition or clinical-level substance dependency call for full abstinence, and the app says so.

## Features

Built into the engine and tests:

- Adherence percentage over active days, with bands: habit (90+), building (70 to 90), lapsed (under 70)
- Days-to-recover calculation, checked against a brute-force simulation
- Current and longest streak
- Overall adherence pooled across habits
- Archive and restart that keep history. Time spent archived never counts against the percentage
- Early warning when archiving a habit under 14 days old
- 14-day cooldown on resets, so "forgive and restart" cannot become a daily escape hatch

In the data layer and prototype:

- Email and password accounts with per-user data (Supabase, row-level security)
- Forgive-and-restart with a short reflection
- Alignment prompt for habits that keep getting skipped
- Replacement-habit pairing when you quit something

## Tech

| Area | Choice |
| --- | --- |
| Front end | React, TypeScript, Vite |
| Logic | Pure TypeScript engine with no UI or database dependency |
| Tests | Vitest |
| Backend | Supabase (Postgres, email auth, row-level security) |

The engine takes plain habit objects and returns numbers, so it can be tested without a browser or a database and moved to any storage.

## Getting started

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard open SQL Editor, paste `supabase/schema.sql`, and run it.
3. Under Authentication, make sure the Email provider is on. While developing, you can turn off "Confirm email".
4. Copy `.env.example` to `.env.local` and fill in your project URL and public (anon or publishable) key from the API settings. Never put the `service_role` key in the front end.
5. Install and run:

```bash
npm install
npm run dev
```

Run the tests, which need no Supabase connection:

```bash
npm test
```

## Project layout

```
src/engine/       adherence logic: percentage, recovery, streaks, archive, reset
src/data/         Supabase client, queries, and row-to-engine mapping
src/auth/         email and password sign-in, session hook
supabase/         schema.sql with tables and row-level security
prototype/        standalone visual prototype (open ninety.html in a browser)
```

## How the math works

For a habit with `hits` good days out of `total` evaluated days, the days needed to get back to a target percentage `p` is the smallest `n` where `(hits + n) / (total + n) >= p / 100`. Solved in integer arithmetic:

```
n = ceil((p * total - 100 * hits) / (100 - p))
```

Only days inside active periods are evaluated. Past days you did not log count as misses. Today counts only once you have logged it, so a day is not a miss before it is over.

## Roadmap

- Port the colorful prototype UI to React on top of the data layer
- Per-habit slip rules (for example zero drinks versus one or two)
- Overall score that excludes archived habits
- AI quote and advice message after a missed day, tuned to the habit's age and your real numbers
- Fuzzy duplicate detection and suggested habit pairings
- Export and import of your data

## Privacy

Habit data can be personal. Each account's rows are locked to their owner with row-level security, and the app collects only an email address.
