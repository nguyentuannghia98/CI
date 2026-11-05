# Nexloot Portal — Nền dữ liệu & Chuẩn hoá (Plan A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng nền dữ liệu cho tin đa nguồn (gom từ Facebook + tự đăng) và bộ hàm chuẩn hoá kiểu Việt (giá, khu vực, tiêu đề) + gộp trùng — có test.

**Architecture:** Tái dùng bảng `products` làm tin đa nguồn (thêm cột `source`/`price`/`location`/…). Bot ghi raw vào bảng `listings_staging`; một job phía server đọc staging → chuẩn hoá bằng các hàm thuần trong `src/lib/listings/` → upsert vào `products` theo `source_url`. Toàn bộ logic chuẩn hoá là hàm thuần, test độc lập với DB.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Supabase (Postgres), Vitest (thêm mới) cho unit test.

**Spec:** `docs/superpowers/specs/2026-10-17-nexloot-repositioning-design.md`

## Global Constraints

- Chỉ dùng npm (có `package-lock.json`); không đổi sang pnpm/yarn.
- TypeScript `strict: true`; alias `@/*` → `./src/*`.
- Gates phải xanh sau mỗi task: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Tin gom **chỉ lưu tối thiểu**: `title` + `price` + `source_url` + nhóm nguồn; **không** lấy/ảnh nội dung Facebook (dùng placeholder ở UI — thuộc Plan B).
- Giá lưu dạng **số nguyên VND** (không phần thập phân); không có giá → `null` (UI hiển thị "Thương lượng").
- Không thêm phụ thuộc nặng; chỉ thêm `vitest` (+ `@vitejs/plugin-react`/`jsdom` **không cần** — test thuần Node).
- Tên cột tình trạng dùng `item_condition` (tránh từ khoá `condition` của Postgres).

## Review Focus

Những đầu vào mà spec không nói rõ nhưng sẽ cắn người dùng thật — mỗi dòng có test ghim vào task sở hữu:

1. **Giá viết kiểu Việt** ("3tr5", "3.5tr", "3500k", "3tr", "1tỷ2", "12 triệu", "3.500.000", "3,5 triệu") → ra đúng số; rác/âm/0 → `null`. (Task 3)
2. **Bài không có giá** ("thương lượng", "inbox giá", "giá liên hệ", rỗng) → `null`, không vỡ filter/UI. (Task 3)
3. **Khu vực viết tắt/biến thể** ("Q7", "q.7", "Quận 7", "HCM", "TP.HCM", "Sài Gòn", "HN", "Hà Nội") → chuẩn hoá nhất quán; lạ → `null`. (Task 4)
4. **Tiêu đề dính emoji/Unicode tiếng Việt/khoảng trắng lạ** → `normalizeTitle` không làm vỡ `dedupKey` hay search. (Task 5)
5. **Cào lại cùng `source_url`** → upsert, **không** tạo bản ghi trùng. (Task 2 unique index + Task 5 `dedupKey`)

---

### Task 1: Thêm Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Test: `src/lib/listings/smoke.test.ts`

**Interfaces:**
- Consumes: —
- Produces: lệnh `npm test` chạy `vitest run`; các test `*.test.ts` cạnh mã nguồn.

- [ ] **Step 1: Cài vitest**

Run: `npm install -D vitest@^3`
Expected: `package.json` devDependencies có `vitest`.

- [ ] **Step 2: Thêm script test**

Trong `package.json` → `scripts`, thêm dòng:

```json
"test": "vitest run"
```

- [ ] **Step 3: Tạo cấu hình vitest**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Viết test khói (phải PASS)**

```ts
// src/lib/listings/smoke.test.ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 5: Chạy test + gates**

Run: `npm test`
Expected: 1 passed.
Run: `npx tsc --noEmit && npm run lint`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/listings/smoke.test.ts
git commit -m "test: thêm vitest cho logic thuần"
```

---

### Task 2: Migration — cột đa nguồn cho `products` + bảng `listings_staging`

**Files:**
- Create: `supabase/migrations/2026-10-17_listings_foundation.sql`

**Interfaces:**
- Consumes: —
- Produces: các cột `products.source ('user'|'fb')`, `price numeric`, `currency text`, `location text`, `item_condition text`, `category text`, `source_url text` (unique, nullable), `seller_contact text`, `posted_at timestamptz`; `products.user_id` cho phép `null`; bảng `public.listings_staging(source_url unique, raw_title, raw_price, source_group, fetched_at, processed_at)`.

- [ ] **Step 1: Viết SQL**

```sql
-- =====================================================================
-- 2026-10-17: Nền dữ liệu tin đa nguồn (cha nguồn: bot Facebook + tự đăng)
-- =====================================================================

alter table public.products add column if not exists source text not null default 'user';
alter table public.products add column if not exists price numeric;
alter table public.products add column if not exists currency text not null default 'VND';
alter table public.products add column if not exists location text;
alter table public.products add column if not exists item_condition text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists source_url text;
alter table public.products add column if not exists seller_contact text;
alter table public.products add column if not exists posted_at timestamptz;

do $$ begin
  alter table public.products add constraint products_source_chk check (source in ('user','fb'));
exception when duplicate_object then null; end $$;

alter table public.products alter column user_id drop not null;

create unique index if not exists products_source_url_key
  on public.products (source_url) where source_url is not null;
create index if not exists products_price_idx on public.products (price);
create index if not exists products_location_idx on public.products (location);

-- Raw từ bot; RLS bật, KHÔNG policy => chỉ service_role/ingest key truy cập được
create table if not exists public.listings_staging (
  id           uuid primary key default gen_random_uuid(),
  source_url   text not null unique,
  raw_title    text,
  raw_price    text,
  source_group text,
  fetched_at   timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.listings_staging enable row level security;
```

- [ ] **Step 2: Apply migration**

Repo không có `SUPABASE_DB_URL`. Apply qua Supabase Management API (`POST /v1/projects/{ref}/database/query`) hoặc dán vào SQL Editor. Với Management API:

Run: `curl -sS -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d "{\"query\": \"<nội dung SQL trên>\"}"`
Expected: HTTP 200.

- [ ] **Step 3: Verify cột + bảng**

Run (Management API query): `select column_name from information_schema.columns where table_name='products' and column_name in ('source','price','location','item_condition','category','source_url','seller_contact','posted_at');`
Expected: 8 dòng.
Run: `select to_regclass('public.listings_staging');`
Expected: không `null`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/2026-10-17_listings_foundation.sql
git commit -m "feat(db): cột tin đa nguồn + bảng staging cho bot"
```

---

### Task 3: `parsePriceVN` — chuẩn hoá giá kiểu Việt

**Files:**
- Create: `src/lib/listings/normalize.ts`
- Test: `src/lib/listings/normalize.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `parsePriceVN(input: string | null | undefined): number | null` — trả VND nguyên, hoặc `null` khi không có giá / rác / ≤ 0.

- [ ] **Step 1: Viết test thất bại**

```ts
import { describe, it, expect } from "vitest";
import { parsePriceVN } from "./normalize";

describe("parsePriceVN", () => {
  it.each([
    ["3tr5", 3_500_000],
    ["3tr", 3_000_000],
    ["3.5tr", 3_500_000],
    ["3500k", 3_500_000],
    ["3.500.000", 3_500_000],
    ["3,500,000", 3_500_000],
    ["150000", 150_000],
    ["1tỷ2", 1_200_000_000],
    ["12 triệu", 12_000_000],
    ["3,5 triệu", 3_500_000],
  ])("parse %s -> %i", (input, expected) => {
    expect(parsePriceVN(input)).toBe(expected);
  });

  it.each([["thương lượng"], ["inbox giá"], ["giá liên hệ"], [""], ["abc"], ["0"], ["-5tr"]])(
    "no price: %s -> null",
    (input) => { expect(parsePriceVN(input)).toBeNull(); },
  );

  it("null/undefined -> null", () => {
    expect(parsePriceVN(null)).toBeNull();
    expect(parsePriceVN(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy FAIL**

Run: `npx vitest run src/lib/listings/normalize.test.ts`
Expected: FAIL — `parsePriceVN is not a function`.

- [ ] **Step 3: Cài đặt `parsePriceVN` trong `src/lib/listings/normalize.ts`**

Xử lý: bỏ dấu phân cách nghìn `.`/`,` khi chúng đứng thành nhóm 3; nhận hậu tố `tr`/`triệu` (×1_000_000), `k`/`nghìn` (×1_000), `tỷ`/`ty` (×1_000_000_000) và dạng "1tỷ2" (`tỷ` + chữ số lẻ = ×0,1 tỷ). Chuẩn hoá về số nguyên; loại ≤ 0.

- [ ] **Step 4: Chạy test để thấy PASS**

Run: `npx vitest run src/lib/listings/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/listings/normalize.ts src/lib/listings/normalize.test.ts
git commit -m "feat(listings): parsePriceVN cho giá kiểu Việt"
```

---

### Task 4: `parseLocationVN` — chuẩn hoá khu vực

**Files:**
- Modify: `src/lib/listings/normalize.ts`
- Test: `src/lib/listings/normalize.test.ts`

**Interfaces:**
- Consumes: —
- Produces: `parseLocationVN(input: string | null | undefined): string | null` — trả nhãn chuẩn (vd `"Quận 7"`, `"TP. Hồ Chí Minh"`, `"Hà Nội"`, `"Đà Nẵng"`), hoặc `null` khi không nhận ra.

- [ ] **Step 1: Viết test thất bại**

```ts
import { parseLocationVN } from "./normalize";

describe("parseLocationVN", () => {
  it.each([
    ["Q7", "Quận 7"], ["q.7", "Quận 7"], ["Quận 7", "Quận 7"], ["quan 7", "Quận 7"],
    ["HCM", "TP. Hồ Chí Minh"], ["TP.HCM", "TP. Hồ Chí Minh"], ["TPHCM", "TP. Hồ Chí Minh"],
    ["Sài Gòn", "TP. Hồ Chí Minh"], ["HN", "Hà Nội"], ["Hà Nội", "Hà Nội"], ["Đà Nẵng", "Đà Nẵng"],
  ])("%s -> %s", (input, expected) => { expect(parseLocationVN(input)).toBe(expected); });

  it("lạ/rỗng -> null", () => {
    expect(parseLocationVN("abc xyz")).toBeNull();
    expect(parseLocationVN("")).toBeNull();
    expect(parseLocationVN(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test để thấy FAIL**

Run: `npx vitest run src/lib/listings/normalize.test.ts -t parseLocationVN`
Expected: FAIL — not a function.

- [ ] **Step 3: Cài đặt `parseLocationVN`**

Dùng bảng ánh xạ tỉnh/thành lớn + regex `q(uận)?\s*\.?\s*(\d+)` → `Quận N`. Bỏ dấu để so khớp (vd `quan 7`). Danh sách cố định (spec §11: cố định trước, admin sau).

- [ ] **Step 4: Chạy test PASS**

Run: `npx vitest run src/lib/listings/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/listings/normalize.ts src/lib/listings/normalize.test.ts
git commit -m "feat(listings): parseLocationVN cho khu vực"
```

---

### Task 5: `normalizeTitle` + `dedupKey`

**Files:**
- Modify: `src/lib/listings/normalize.ts`
- Test: `src/lib/listings/normalize.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `normalizeTitle(input: string): string` — trim, gộp khoảng trắng, giữ chữ + số (bỏ emoji/ký tự điều khiển), lowercase để so khớp.
  - `dedupKey(l: { title: string; price: number | null; sellerContact?: string | null }): string` — khoá gộp trùng ổn định (title đã chuẩn hoá + giá + liên hệ).

- [ ] **Step 1: Viết test thất bại**

```ts
import { normalizeTitle, dedupKey } from "./normalize";

describe("normalizeTitle", () => {
  it("gộp khoảng trắng + bỏ emoji + lowercase", () => {
    expect(normalizeTitle("  iPhone   13 🔥 Pro  ")).toBe("iphone 13 pro");
  });
  it("giữ dấu tiếng Việt", () => {
    expect(normalizeTitle("Xe Đạp Điện")).toBe("xe đạp điện");
  });
});

describe("dedupKey", () => {
  it("cùng tiêu đề+giá+liên hệ -> cùng key", () => {
    const a = dedupKey({ title: "iPhone 13", price: 8_000_000, sellerContact: "abc" });
    const b = dedupKey({ title: " iphone  13 ", price: 8_000_000, sellerContact: "abc" });
    expect(a).toBe(b);
  });
  it("khác giá -> khác key", () => {
    expect(dedupKey({ title: "iPhone 13", price: 8_000_000 }))
      .not.toBe(dedupKey({ title: "iPhone 13", price: 9_000_000 }));
  });
});
```

- [ ] **Step 2: Chạy test FAIL**

Run: `npx vitest run src/lib/listings/normalize.test.ts -t "normalizeTitle|dedupKey"`
Expected: FAIL.

- [ ] **Step 3: Cài đặt hai hàm**

`normalizeTitle`: `input.normalize("NFC").replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu,"").replace(/\s+/g," ").trim().toLowerCase()`. `dedupKey`: `${normalizeTitle(title)}|${price ?? ""}|${sellerContact ?? ""}`.

- [ ] **Step 4: Chạy test PASS**

Run: `npx vitest run src/lib/listings/normalize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/listings/normalize.ts src/lib/listings/normalize.test.ts
git commit -m "feat(listings): normalizeTitle + dedupKey"
```

---

## Sau Plan A (các plan kế tiếp, chưa viết)

- **Plan B — Ingest runner**: đọc `listings_staging` → `parsePriceVN`/`parseLocationVN`/`normalizeTitle`/`dedupKey` → upsert `products` theo `source_url`; verify idempotent khi cào lại.
- **Plan C — UI portal**: feed (`UniversalCard` biến thể), tìm/lọc (giá/khu vực/danh mục), chi tiết + nút "Xem trên Facebook".
- **Plan D — Dọn dẹp**: cắt `arena`/`auction`, community → nhãn nguồn.
- **Plan E (GĐ2)**: tự đăng, verify SĐT+CCCD, profile = trang bán hàng.
