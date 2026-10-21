# Ninety

**A habit tracker built around a percentage, not a streak.**

**Live demo: [ninety-habits.netlify.app](https://ninety-habits.netlify.app/)**

This app is not about perfection. At least 90% is the goal. 100% is great too, but it is not required. Ninety is an alternative to perfection streaks, built to help mitigate the abstinence violation effect, where a single slip spirals into giving up entirely.

Most habit apps punish you the moment a streak breaks. Ninety assumes real life is noisy. It tracks adherence as a percentage, and when you slip it shows exactly how many clean days it takes to get back above the line.

> Status: work in progress. The adherence engine, Supabase data layer, and UI are built. The engine and row mapping are unit tested.

## The idea

- **At least 90% is the goal.** Real life has illness, travel, and accidents, so a habit in the 90 to 100% range still counts as a strong habit.
- **Two lines on the dial.** Around 70% is the floor. Below it, you are still actively working on the habit. At 90% or above, it is the habit.
- **Lapsed is a signal, not a verdict.** Under 70% means your brain's wiring around the habit has weakened and it is worth reassessing how serious you are about it. That might mean chaining a complementary habit onto it for encouragement, or cutting out something that competes for the same time and willpower, to pull it back above 70%. Lapsed never means you have to give the habit up.
- **A slip is data, not a reset.** The number dips and climbs back. No "day one again" cliff.
- **Recovery math up front.** After a slip the app tells you how many clean days get you back above 90%, so a bad week becomes a plan.
- **Streaks are optional.** They are tracked but can be hidden. The percentage is the focus.
- **Use your own discretion.** These numbers are a recommended read, not a rule.
- **Honest about who it is for.** Ninety suits habits where about 90% is realistic. Habits tied to a serious history, such as a medical condition or a clinical-level substance dependency, call for full abstinence, and the app says so.

## Features

- Adherence percentage over active days, with bands: habit (90+), building (70 to 90), lapsed (under 70)
- Days-to-recover and slack-days calculations: how many clean days get you back to 90%, and how many slips you can still absorb
- Current and longest streak, with a toggle to hide streaks
- Overall adherence pooled across active habits
- Archive and restart that keep history. Time spent archived never counts against the percentage
- Early warning when archiving a habit under 14 days old
- 14-day cooldown on resets, so "forgive and restart" cannot become a daily escape hatch
- Forgive-and-restart with a short reflection
- Backdate a habit’s start date at creation or later. Days since then count as done, and you can correct any day individually.
- Per-habit calendar to review and edit your history. Edited days are marked “M”.
- Alignment prompt for habits that keep getting skipped
- Replacement-habit pairing when you quit something
- Email and password accounts with per-user data (Supabase, row-level security)
- Light and dark theme, mobile-first layout

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
4. Copy `.env.example` to `.env.local` and fill in your project URL (ending at `.supabase.co`) and public (anon or publishable) key from the API settings. Never put the `service_role` key in the front end.
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
src/components/   rings, habit cards, add-habit sheet, tracker view
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

- Per-habit slip rules (for example zero drinks versus one or two)
- AI quote and advice message after a missed day, tuned to the habit's age and your real numbers
- Fuzzy duplicate detection and suggested habit pairings
- Export and import of your data

## Privacy

Habit data can be personal. Each account's rows are locked to their owner with row-level security, and the app collects only an email address.
