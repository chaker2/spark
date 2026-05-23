## SPARK — Advanced Features Plan

Big batch of work across 12 areas. To keep this shippable I'll split into 3 phases. Tell me which to start with ("all phases", "phase 1", or pick specific items).

---

### Phase 1 — Gameplay & Data (highest impact)

**1. New question type: `written` (Concept / Definition / Equation)**
- Add `written` to question type enum + a new `expected_answer` text column on `questions`.
- Teacher UI: single text field for the correct answer (no choices).
- Student UI: text input with submit button.
- Smart matching in `submit_answer` RPC:
  - Normalize (lowercase, strip accents incl. Arabic tashkeel, collapse whitespace, strip punctuation).
  - Compute Levenshtein-based similarity ratio.
  - Score tiers: ≥0.95 → full points, ≥0.80 → 70%, ≥0.60 → 40%, else 0.
  - Time bonus preserved.
- Works across AR / FR / EN.

**2. Puzzle fixes**
- Replace fragile button-reorder with `@dnd-kit` (touch sensors enabled) + working ↑/↓ fallback buttons.
- Teacher can now reorder the *correct* answer sequence in the editor (currently fixed by entry order).
- Add subtle reorder animations.

**3. Visible live game code (teacher room)**
- Remove the dark overlay covering the code; render the 5-digit code as a large animated glass card always visible.

**4. End-of-question stats screen**
- New phase between "question ended" and "next question":
  - Leaderboard (top 5) + answer distribution bar chart + correct/incorrect counts.
  - Correct answer is hidden until the timer naturally expires (server-tracked).
- Teacher clicks "Next" to advance.

**5. Arabic label fix**
- `categories.ts`: `Social Studies` AR → `الاجتماعيات` everywhere.

---

### Phase 2 — Account & UX

**6. Profile management page (`/profile`)**
- View/edit display name, email, password, avatar (emoji picker).
- Uniqueness check for display_name via new RPC.
- Email change goes through Supabase auth.updateUser (email verification).

**7. Password show/hide toggle** on login/signup forms (Eye icon, accessible).

**8. Full i18n sweep**
- Audit every component for hardcoded FR strings, move all UI labels to `i18n.ts` (AR/FR/EN).
- Excludes user-created quiz content.
- Includes admin panel, gameplay UI, errors, tooltips, loading states.

**9. Contextual feedback system**
- Centralize toast messages in `src/lib/notify.ts` with typed keys (`auth.invalid_password`, `room.not_found`, `network.lost`, etc.).
- All 20 listed scenarios mapped + translated.
- Sonner toasts with color/icon per type (success/error/warning/info/loading).
- Network-lost detection via `navigator.onLine` listeners.

---

### Phase 3 — Visuals & Polish

**10. Category-themed backgrounds**
- New `CategoryBackground` component: subtle SVG/CSS pattern per category (Arabic letters, math symbols, atoms, geometric Islamic, maps, molecules, literature flourishes, academic serifs).
- Applied to gameplay screens and category headers, kept low-opacity for readability.

**11. Question rendering polish**
- Image questions: `object-contain` with max-h, rounded, soft shadow, srcset-friendly.
- Cleaner cards, better spacing, larger fullscreen typography.

**12. General UI polish**
- Smoother button hover/press, transitions, better contrast pass, refined typography hierarchy.

---

### Technical details

- DB migration: `ALTER TYPE` not used (column is text); add `expected_answer text` to `questions`; update `submit_answer` to handle `written` type using a new `text_similarity(a, b)` SQL function (pl/pgSQL Levenshtein + normalization).
- Realtime: keep current polling for scoreboard; add `phase` column on `rooms` (`question_live` / `question_stats` / `between`) so all clients stay in sync.
- `@dnd-kit/core`, `@dnd-kit/sortable` already planned (re-add if missing).
- No new external API keys required. All smart matching is in-DB.

### Out of scope (explicit)
- AI-based semantic similarity (would need an LLM call per answer — heavy and slow; deterministic similarity is fast and works offline). Can be added later behind a flag.
- Voice answers, handwriting, image OCR.
- Sound effects (per earlier scope decision).

---

Reply **"all phases"** to ship everything, or **"phase 1"** / **"phase 2"** etc. to scope down.