# NexLoot — Security & Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every Critical/High/Medium/Low finding from the `nghiaca12` code review — security holes, definite runtime bugs, config rot, and React defects — without changing product behavior.

**Architecture:** Next.js 15 App Router + Supabase (SSR) + Firebase. Fixes are additive/defensive: introduce shared server-side auth guards, replace client-trusted identity with session identity, use existing atomic Supabase RPCs, add error boundaries, and correct config.

**Tech Stack:** Next.js 15.4.10 · React 19 · TypeScript (strict) · Tailwind v4 · Supabase (`@supabase/ssr`) · Zustand · React Query · `gh` CLI.

**Spec:** This plan implements the review report for branch `nghiaca12` (the 4 sub-agent findings). Schema/RPC truth comes from `src/types/supabase.ts`. No test framework exists in the repo; verification gates are `npx tsc --noEmit`, `npm run lint`, `npm run build`, and a dev-server browser smoke test.

## Global Constraints

- Do NOT change public behavior/flows; only correctness, security, and cleanup.
- No new runtime dependency except as explicitly listed (Tailwind config fix, optional).
- Never trust a client-supplied `userId`; always resolve identity from the session via `supabase.auth.getUser()`.
- Keep Vietnamese user-facing error strings; keep existing code/comment language style.
- Every mutation that targets an owned row must filter by the session `user_id` (defense in depth, regardless of RLS).
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `GEMINI_API_KEY`, `PRODUCT_IMAGES_BUCKET`.
- Commit after each task with a Conventional Commit message.

## Review Focus (inputs the spec implies but tests don't cover)

1. Anonymous caller hitting any server action / API route → must get 401/403, never a write.
2. Authenticated user passing another user's `id` → must not read or mutate the other user's rows.
3. `?next=` / `localStorage.redirectAfterLogin` with an external URL → must not redirect off-site.
4. `/api/cron/generate-questions` called without `CRON_SECRET` → must return 401 and call neither Gemini nor the DB.
5. Missing env var at module load (e.g. `SUPABASE_URL=""`) → must fail inside the handler, not crash the build.

---

### Task 0: Local environment for running/verifying

**Files:**
- Create: `.env.local` (gitignored)

**Interfaces:**
- Produces: runtime env for `npm run dev`/`npm run build`.

- [ ] **Step 1:** Create `.env.local` with values supplied by the user:

```
NEXT_PUBLIC_SUPABASE_URL=https://kzfmunxbdfdfxumerulj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from user>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PRODUCT_IMAGES_BUCKET=product-images
# SUPABASE_SERVICE_ROLE_KEY / CRON_SECRET / GEMINI_API_KEY optional locally
```

- [ ] **Step 2: Verify** `git status` shows `.env.local` untracked/ignored (`.env*` in `.gitignore`). Run `npm install` and `npm run dev`; confirm the site boots.

---

### Task 1: Shared server auth/role guards

**Files:**
- Create: `src/lib/auth/guards.ts`

**Interfaces:**
- Produces:
  - `getSessionUser(): Promise<User | null>` — wraps `createClient()` + `auth.getUser()`.
  - `requireUser(): Promise<User>` — throws `AuthError("UNAUTHENTICATED")` if null.
  - `getCommunityRole(supabase, communityId, userId): Promise<string | null>`.
  - `requireCommunityStaff(communityId): Promise<{ supabase, user, role }>` — role ∈ {owner, admin, mod}.
  - `isSafeInternalPath(path: string): boolean` — returns true only for a same-origin relative path (`startsWith("/")`, not `//`, no `:` before first `/`).

- [ ] **Step 1:** Implement the module using `createClient` from `@/lib/supabase/server` and `SupabaseClient` type from `@supabase/supabase-js` for the role helper.
- [ ] **Step 2:** `isSafeInternalPath` unit cases: `/profile` → true, `//evil.com` → false, `https://evil.com` → false, `/a/b` → true.
- [ ] **Step 3: Verify** `npx tsc --noEmit` passes.
- [ ] **Step 4: Commit** `feat(auth): add shared server auth and role guards`.

---

### Task 2: Lock down `/api/listing`

**Files:**
- Modify: `src/app/api/listing/route.ts`

**Interfaces:**
- Consumes: `requireUser` (Task 1).

- [ ] **Step 1:** Replace the broken import `@/lib/supabase/serverClient` with `createClient` from `@/lib/supabase/server`.
- [ ] **Step 2:** Authenticate via `requireUser()`; return 401 JSON if it throws.
- [ ] **Step 3:** Validate body with a Zod schema whitelisting only writable columns (`title, description, price, category, images, community_id, tag_id`), and set `user_id = user.id` server-side; drop `...body` spread.
- [ ] **Step 4:** Wrap in try/catch; return `{error}` with 400 (bad body) / 500 (db).
- [ ] **Step 5: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 6: Commit** `fix(api): authenticate and validate /api/listing`.

---

### Task 3: Fix `/api/upload`

**Files:**
- Modify: `src/app/api/upload/route.ts`

**Interfaces:**
- Consumes: `requireUser` (Task 1); env `PRODUCT_IMAGES_BUCKET`.

- [ ] **Step 1:** Replace deprecated `createServerActionClient(@supabase/auth-helpers-nextjs)` with `createClient` from `@/lib/supabase/server`.
- [ ] **Step 2:** Derive `userId` from `requireUser()`, ignore any client `user_id`.
- [ ] **Step 3:** Validate: file present, `file.type` in an image allowlist, `file.size <= 5MB`; reject otherwise with 400.
- [ ] **Step 4:** Use bucket `process.env.PRODUCT_IMAGES_BUCKET ?? "product-images"`; sanitize extension; return public URL.
- [ ] **Step 5: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 6: Commit** `fix(api): secure and repair file upload`.

---

### Task 4: Lock down cron route

**Files:**
- Modify: `src/app/api/cron/generate-questions/route.ts`

**Interfaces:**
- Consumes: `createAdminClient` from `@/lib/supabase/server`; env `CRON_SECRET`.

- [ ] **Step 1:** Move `createClient`/`GenAI` init **inside** the handler so a missing env var can't crash module load.
- [ ] **Step 2:** At handler start, require `Authorization: Bearer ${CRON_SECRET}` (env) → 401 otherwise.
- [ ] **Step 3:** Use `createAdminClient()` (service role) explicitly; drop the anon-key fallback.
- [ ] **Step 4:** Guard `questions`/`delete_old_questions` usage behind a check; if the table/RPC is absent, return a clear 500 message (do not silently proceed).
- [ ] **Step 5: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 6: Commit** `fix(api): require CRON_SECRET on question generator`.

---

### Task 5: Authenticate `/api/gemini`

**Files:**
- Modify: `src/app/api/gemini/route.ts`

**Interfaces:**
- Consumes: `requireUser` (Task 1).

- [ ] **Step 1:** Reject unauthenticated callers with 401.
- [ ] **Step 2:** Correct the model id to a valid one and cap `prompt.length` (e.g. ≤ 4000) → 400 if exceeded.
- [ ] **Step 3: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 4: Commit** `fix(api): authenticate /api/gemini and bound input`.

---

### Task 6: Fix community join/leave & delete authorization

**Files:**
- Modify: `src/app/actions/ComunnitiesActions/JoinLeave.ts`

**Interfaces:**
- Consumes: `requireUser`, `getCommunityRole` (Task 1); RPCs `join_community_tx`, `leave_community_tx` (from `types/supabase.ts`).

- [ ] **Step 1:** `toggleCommunityMembership(communityId, isMember)` — drop the `userId` param; resolve user server-side; call `join_community_tx`/`leave_community_tx` (fallback to insert/delete scoped to `user.id`).
- [ ] **Step 2:** `deleteCommunityAction(communityId)` — require role ∈ {owner, admin}.
- [ ] **Step 3:** Update all call sites to the new signature (grep `toggleCommunityMembership(`).
- [ ] **Step 4: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 5: Commit** `fix(actions): authorize community membership changes`.

---

### Task 7: Fix `ComunitiesActions/post.ts`

**Files:**
- Modify: `src/app/actions/ComunnitiesActions/post.ts`

**Interfaces:**
- Consumes: `requireUser`, `requireCommunityStaff` (Task 1).

- [ ] **Step 1:** `reserveProductIdAction(communityId)` — resolve user server-side; require membership; insert `user_id = user.id`.
- [ ] **Step 2:** `finalizeProductAction({productId, ...})` — require session user and update with `.eq("id", productId).eq("user_id", user.id)`.
- [ ] **Step 3:** Update call sites to the new signature.
- [ ] **Step 4: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 5: Commit** `fix(actions): require session identity for community posts`.

---

### Task 8: Fix `menupost.createProductAction`

**Files:**
- Modify: `src/app/actions/menupost.ts`

**Interfaces:**
- Consumes: `requireUser` (Task 1).

- [ ] **Step 1:** Remove `userId` from the input type; resolve via `requireUser()`; check membership with `user.id`; insert `user_id = user.id`.
- [ ] **Step 2:** Update call sites.
- [ ] **Step 3: Verify** `npx tsc --noEmit` + `npm run lint`.
- [ ] **Step 4: Commit** `fix(actions): derive author identity server-side in createProductAction`.

---

### Task 9: Close IDOR on update/delete by id

**Files:**
- Modify: `src/app/actions/updateProductAction.ts:51-60`, `src/app/actions/Comment/UpdateComment.ts:14-21`, `src/app/actions/Comment/DeleteComment.ts:16-20`

- [ ] **Step 1:** `updateProductAction` — add `.eq("user_id", user.id)` (remove the comment advising it).
- [ ] **Step 2:** `updateComment` / `deleteComment` — call `getUser()`, return early if null, add `.eq("user_id", user.id)`.
- [ ] **Step 3: Verify** `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `fix(actions): scope comment/product updates to owner`.

---

### Task 10: Fix open redirects

**Files:**
- Modify: `src/components/auth/hooks/useAuth.ts:65-69`, `src/app/auth/callback/page.tsx:39-43`

**Interfaces:**
- Consumes: `isSafeInternalPath` (Task 1).

- [ ] **Step 1:** Validate `next` / `redirectAfterLogin` with `isSafeInternalPath`; fall back to `/`.
- [ ] **Step 2: Verify** `npx tsc --noEmit`.
- [ ] **Step 3: Commit** `fix(auth): prevent open redirect after login`.

---

### Task 11: Correct out-of-stock field

**Files:**
- Modify: `src/lib/mapper/productMapper.ts:172`, `src/app/category/[id]/page.tsx:101`

**Interfaces:**
- Produces: product objects carrying `is_out_of_stock` (matches `UniversalCard/types/type.ts:59`).

- [ ] **Step 1:** Rename emitted key `isOutOfStock` → `is_out_of_stock` in both sites.
- [ ] **Step 2:** Remove the `as Product` cast if it no longer hides a mismatch (keep only if TS genuinely needs it).
- [ ] **Step 3: Verify** `npx tsc --noEmit`; grep confirms no `isOutOfStock` consumers remain.
- [ ] **Step 4: Commit** `fix(mapper): emit is_out_of_stock to match Product type`.

---

### Task 12: Atomic likes

**Files:**
- Modify: `src/app/actions/LikeActions.ts`

**Interfaces:**
- Consumes: RPC `increment_upvotes(pid)`, `decrement_upvotes(pid)`, `product_likes` unique(product_id,user_id).

- [ ] **Step 1:** Replace select-then-insert with `upsert` on `product_likes` (onConflict `product_id,user_id`) for like, delete for unlike; call the increment/decrement RPC to keep counters correct.
- [ ] **Step 2:** Handle the unique-violation race by treating it as already-liked.
- [ ] **Step 3: Verify** `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `fix(actions): make product likes atomic`.

---

### Task 13: Error boundaries & route-level fallbacks

**Files:**
- Create: `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx`, `src/app/loading.tsx`

- [ ] **Step 1:** Add a client `error.tsx` with a retry button; `global-error.tsx` with its own `<html>`; a `not-found.tsx`; a simple `loading.tsx`.
- [ ] **Step 2: Verify** `npm run build` succeeds and a thrown route shows the error boundary (browser smoke test).
- [ ] **Step 3: Commit** `feat(app): add error, not-found, loading boundaries`.

---

### Task 14: Fix broken category import

**Files:**
- Modify: `src/app/category/[id]/page.tsx:1`

- [ ] **Step 1:** `@/utils/supabase/server` → `@/lib/supabase/server`.
- [ ] **Step 2: Verify** `npx tsc --noEmit`.
- [ ] **Step 3: Commit** `fix(category): correct supabase server import path`.

---

### Task 15: Re-enable type checking in build

**Files:**
- Modify: `next.config.ts:5-7`

- [ ] **Step 1:** Remove `typescript.ignoreBuildErrors`.
- [ ] **Step 2:** Run `npx tsc --noEmit`; fix every error (bulk are likely in the files already touched; do not add `any` — prefer precise types or narrow casts).
- [ ] **Step 3: Verify** `npm run build` passes.
- [ ] **Step 4: Commit** `build: enforce type checking in next build`.
- [ ] **Note:** If error count is large (> 50) and spread across untouched features, stop and report before mass-editing unrelated code.

---

### Task 16: Tailwind v4 config wiring

**Files:**
- Modify: `src/app/globals.css`, `tailwind.config.ts`

- [ ] **Step 1:** Migrate `theme.extend` (colors surface/card/main, fonts, radii) into CSS `@theme` in `globals.css`, or add `@config "../../tailwind.config.ts"` after `@import "tailwindcss"`.
- [ ] **Step 2:** Ensure fonts actually used are loaded (self-host/`next/font`); drop the render-blocking `@import` mismatch.
- [ ] **Step 3: Verify** `npm run dev` renders colors/fonts correctly (browser).
- [ ] **Step 4: Commit** `fix(styles): wire Tailwind v4 theme config`.

---

### Task 17: Security headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1:** Add `async headers()` returning CSP-lite, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and HSTS for non-localhost.
- [ ] **Step 2: Verify** `npm run dev`; `gh`-free check: curl headers.
- [ ] **Step 3: Commit** `fix(config): add security headers`.

---

### Task 18: Small config correctness

**Files:**
- Modify: `tsconfig.json:16`, `src/app/layout.tsx:24`

- [ ] **Step 1:** `forceConsistentCasingInFileNames: true`.
- [ ] **Step 2:** `<html lang="vi">`.
- [ ] **Step 3: Verify** `npm run build`.
- [ ] **Step 4: Commit** `chore: tighten tsconfig and set lang=vi`.

---

### Task 19: MiniChat realtime channel churn

**Files:**
- Modify: `src/components/MiniChat/MiniChatBox/hooks/useMessages.ts:15,80`
- Delete: `src/components/MiniChat/MiniChatBox/hooks/useRealtimeMessages.ts` (unused duplicate)

- [ ] **Step 1:** `useMemo` the `queryKey`; change realtime effect deps to `[currentUserId, partnerId]`.
- [ ] **Step 2:** Confirm `useRealtimeMessages` has zero imports (grep) before deleting.
- [ ] **Step 3: Verify** `npx tsc --noEmit`; dev smoke test chat opens without re-subscribe loop.
- [ ] **Step 4: Commit** `fix(chat): stable realtime subscription, drop dead hook`.

---

### Task 20: Arena timers & test mode

**Files:**
- Modify: `src/app/arena/page.tsx:25,341-346`

- [ ] **Step 1:** Gate `TEST_MODE` behind `process.env.NEXT_PUBLIC_ARENA_TEST === "true"`.
- [ ] **Step 2:** Store pending `setTimeout` in a ref; clear on unmount and on room exit.
- [ ] **Step 3: Verify** `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `fix(arena): gate test mode and clear timers`.

---

### Task 21: UniversalCard component-in-render

**Files:**
- Modify: `src/components/UniversalCard/UniversalCard.tsx:47,346`

- [ ] **Step 1:** Hoist `MenuButton` (and `menuVariants`) to module scope.
- [ ] **Step 2:** Precompute confetti positions (no `Math.random()` in render).
- [ ] **Step 3: Verify** `npx tsc --noEmit`; card menu no longer remounts.
- [ ] **Step 4: Commit** `fix(ui): hoist card menu component`.

---

### Task 22: Avatar blob URL leak

**Files:**
- Modify: `src/components/profileavatar/ProfileAvatar.tsx:154-162`

- [ ] **Step 1:** Revoke the object URL in the mutation's `finally` (and/or a cleanup effect), not in a returned-discarded closure.
- [ ] **Step 2: Verify** `npx tsc --noEmit`.
- [ ] **Step 3: Commit** `fix(profile): revoke avatar preview object URL`.

---

### Task 23: Header auth staleness & stray timers

**Files:**
- Modify: `src/components/HeaderBar/HeaderBar.tsx:59-60`, `src/components/UserMenu/UserMenu.tsx:33-56`

- [ ] **Step 1:** Move the navigation `setTimeout` into a ref cleared on unmount.
- [ ] **Step 2:** Subscribe to `onAuthStateChange` (or read from the shared `AuthStore`) instead of one-off `getUser()`+fetch per instance.
- [ ] **Step 3: Verify** `npx tsc --noEmit`; login/logout updates header without reload.
- [ ] **Step 4: Commit** `fix(header): stable auth subscription and timers`.

---

### Task 24: Component cleanups

**Files:**
- Modify: `src/components/UniversalCard/ProductDetailModal.tsx:317-322`, `src/components/profile/ProfileView.tsx:140-156`, `src/components/userratings/UserRating.tsx:77-82`
- Delete one of: `src/components/ThemeToggle.tsx` | `src/components/UserMenu/ThemeToggle.tsx`

- [ ] **Step 1:** Remove debug `console.log` effect.
- [ ] **Step 2:** Remove the duplicated "show all reviews" logic (keep the parent-owned slice).
- [ ] **Step 3:** Delete the duplicate ThemeToggle (grep imports first).
- [ ] **Step 4: Verify** `npx tsc --noEmit`.
- [ ] **Step 5: Commit** `chore(ui): remove debug logs and duplicate components`.

---

### Task 25: Remove dead deps & orphan files

**Files:**
- Modify: `package.json`
- Delete: `supabase.ts` (repo root, orphan)

- [ ] **Step 1:** Confirm each of `easymde`, `react-simplemde-editor`, `react-slick`, `slick-carousel`, `swiper`, `react-dropzone`, `uuid`, `formidable`, `firebase-admin`, `@types/react-slick`, `@types/uuid` has no import (grep). Remove only the confirmed-unused.
- [ ] **Step 2:** Delete root `supabase.ts` after confirming nothing imports it.
- [ ] **Step 3: Verify** `npm install` + `npm run build`.
- [ ] **Step 4: Commit** `chore: drop unused dependencies and orphan types`.

---

### Task 26: Standardize session identity

**Files:**
- Modify: `src/hooks/useUserContext.ts:11`, `src/lib/Zustard/AuthStore.ts:46`

- [ ] **Step 1:** Replace `getSession()` with `getUser()` where identity gates behavior.
- [ ] **Step 2:** Surface query errors instead of ignoring them (`useUserContext.ts:14-25`, `useCommunityData.ts:81-84`).
- [ ] **Step 3: Verify** `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `fix(hooks): use verified user identity, surface errors`.

---

### Task 27: Accessibility quick wins

**Files:**
- Modify: `src/components/communities/Components/ModModeToggle.tsx:77`, icon-only buttons in UniversalCard/MessagesPanel/NewsPanel, `src/components/layouts/LiveFeedback.tsx:51`

- [ ] **Step 1:** `<div onClick>` → `<button>` with keyboard support; add `aria-label` to icon-only buttons.
- [ ] **Step 2:** Unique/ref-counted LiveFeedback channel name.
- [ ] **Step 3: Verify** `npm run lint`.
- [ ] **Step 4: Commit** `fix(a11y): labels, buttons, unique channels`.

---

### Task 28: Final verification

- [ ] **Step 1:** `npx tsc --noEmit` → no errors.
- [ ] **Step 2:** `npm run lint` → no errors.
- [ ] **Step 3:** `npm run build` → success.
- [ ] **Step 4:** `npm run dev` + browser smoke test: `/`, `/home`, a product modal, category page, chat, arena, login/logout.
- [ ] **Step 5:** Produce a short verification report (commands + observed results). Do not claim success without pasted output.

---

## Self-Review

- **Spec coverage:** Every Critical/High/Medium/Low finding maps to a task (security → 1-10; correctness → 11-14; config → 15-18; React → 19-24; cleanup → 25-27). Items requiring Supabase verification (RLS policies, real bucket name, `questions` table) are flagged in Task 3/4 and the final report; not silently assumed.
- **Step scan:** Each step names the file and the change; no "handle edge cases".
- **Type consistency:** `is_out_of_stock` used consistently; guard names (`requireUser`, `getCommunityRole`, `isSafeInternalPath`) match across tasks.
- **Proportion:** Plan tracks the review; no program transcript.
