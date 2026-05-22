# SPARK — Advanced Gameplay & Systems

Shipping in 3 phases. Each phase is independently usable; we stop and review between phases if you want.

## Phase 1 — Data foundations + Question Types (core)

**Database migration**
- `questions.type` → enum: `multiple_choice`, `true_false`, `puzzle`, `image`
- `questions.image_url` (text, nullable)
- `profiles.avatar` already exists; add `profiles.is_admin` (bool) + seed super-admin row
- `room_players.avatar` (text) for in-game avatar
- Storage bucket `quiz-images` (public read, owner write)

**Quiz editor (`quiz.new.tsx` / `quiz.$id.edit.tsx`)**
- Per-question "Type" selector
- **True/False**: hides choice editor, shows fixed True / False with correct toggle
- **Multiple Choice**: current 4-colored-card editor (kept as-is)
- **Image**: image upload field above question + MCQ-style answers
- **Puzzle**: ordered list of items; correct order = the order entered
- Per-question timer dropdown: 5 / 10 / 20 / 30 / 60 s

## Phase 2 — Live game polish

**Join flow (`play.$code`)**
- After name entry, avatar picker (8–12 colorful emoji/illustrated avatars)
- Avatar persisted on `room_players` and shown in waiting room + leaderboard

**Teacher waiting room (`teacher.tsx`)**
- "Clear all players" button (deletes `room_players` for room, realtime-synced)
- Per-player kick button

**In-game rendering**
- True/False → 2 big buttons
- Image → render `image_url` above question
- Puzzle → drag-and-drop reorder (dnd-kit), scored on exact match
- All existing MCQ flow preserved

## Phase 3 — Admin + Stability

**Super admin**
- Seed `chakerennabbach@gmail.com` with `is_admin=true` on profile
- RLS policies: admin can update/delete any quiz, view all rooms
- `/admin` route: tabs for Quizzes / Users / Rooms / Stats
- Gated by `profile.is_admin` (server-validated)

**Responsive + stability pass**
- Mobile-first audit on `play.$code`, `teacher`, `games`, `quiz.new`
- Loading skeletons + error boundaries on data routes
- Fix React #418 hydration error currently in console

## Technical notes

- Drag-and-drop: `@dnd-kit/core` + `@dnd-kit/sortable` (already TanStack-friendly, no Node deps)
- Image upload: direct to Supabase Storage from browser client, public URL stored on question
- Admin check: server function reading `profiles.is_admin` via `requireSupabaseAuth` — never trust client
- Password for admin account must be set by you via the Login page "create account" once seeded (we can't set passwords from SQL safely); alternatively I can wire a one-time secure setup using the service role

## Out of scope (flag if you want them)

- Badges system (XP exists; badges would be a new table + UI)
- Sound effects library (would need licensed assets)
- "Auto room" / matchmaking beyond current code-join

---

Reply **"go phase 1"** (or "all phases") and I'll start.
