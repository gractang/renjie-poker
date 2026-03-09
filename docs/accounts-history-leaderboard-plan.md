# Accounts, History, Stats, and Leaderboard

## Decision

Use Supabase for the first backend pass. The app is currently a frontend-only Vite/React SPA, so Supabase adds auth and Postgres without forcing a framework migration.

## Definitions

- A "hand" means one completed showdown.
- Only completed, server-verified hands count toward stats and leaderboard eligibility.
- Reset or abandoned games do not count toward the leaderboard-eligibility requirement.

## Phase 1: Shared Game Contract

Scope:

- Move the pure game rules into a shared module that both the client and backend can use.
- Return stable hand categories from the evaluator in addition to the existing display labels.
- Add a pure replay entry point so the backend can verify a submitted turn log.

Acceptance criteria:

- The UI still plays the same game locally.
- A completed hand can be reconstructed from a deck order plus a sequence of selections.
- Hand summaries include category and display name.

## Phase 2: Auth and Profile

Scope:

- Add Supabase Auth with Google OAuth and email/password.
- Add a profile surface with display name and leaderboard preferences.
- Keep guest play available, but only signed-in users get cross-device persistence.

Acceptance criteria:

- A user can create an account, sign in, and sign out.
- A signed-in user has a profile row on first login.
- Guests can still play without errors.

## Phase 3: Persisted Game Sessions

Scope:

- Start each saved game with a server-backed session row.
- Persist turn-level selection history and final game summary.
- Verify final submissions by replaying the selections against the stored deck order.

Acceptance criteria:

- A signed-in user can finish a hand and see it in history.
- Invalid or tampered submissions are rejected by the backend.
- History rows include outcome, final hand name, hand category, and timestamp.

## Phase 4: Player Stats

Scope:

- Add aggregated stats for completed hands.
- Track wins, losses, win rate, and player hand frequencies.
- Show both headline stats and a hand-category breakdown in the UI.

Acceptance criteria:

- Stats match the raw completed-hand history.
- Win rate is based on completed hands only.
- Hand counts can be grouped by stable categories such as `one-pair` and `straight`.

## Phase 5: Leaderboard

Scope:

- Gate leaderboard opt-in until a user has reached the configured completed-hand threshold.
- Require a public leaderboard name before opting in.
- Show rank, win rate, and hands played.

Recommendation:

- Display raw win rate.
- Rank by an adjusted score such as Wilson lower bound to reduce small-sample volatility, while still requiring the configured completed-hand threshold.

Acceptance criteria:

- Users under the configured completed-hand threshold see progress but cannot opt in.
- Users at or above the configured completed-hand threshold can opt in and opt out.
- Only opted-in users appear publicly.

## Phase 6: Hardening

Scope:

- Add RLS policies, query indexes, and replay-based verification.
- Add unit tests for replay and hand-category logic.
- Add integration coverage for auth, history, stats, and leaderboard queries.

Acceptance criteria:

- Users can only read and write their own private history.
- Public leaderboard queries only expose opted-in profile data.
- The replay contract is covered by automated tests.
