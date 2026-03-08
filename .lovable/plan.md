
## Goals (what will change)
1) **Interactive Admin Dashboard cards**: clicking Revenue / Orders / Customers navigates to the correct detailed page.
2) **Orders + Customers “A to Z” management**: add an **Actions** column with View/Edit + Delete (with strict confirmation) and improved search/filter.
3) **Vercel data not loading**: add in-app diagnostics to confirm environment variables are present and add a “health check” panel for public data visibility (RLS + connectivity).
4) **Phone input reliability (1‑Click modal + checkout)**: ensure the **country dropdown actually controls the dial code**, and the **Order button stays disabled until the number is valid**.
5) **Professional Product Create/Edit modal (Daraz/Amazon style)**:
   - Drag‑drop **3–5 image uploads** stored in Storage
   - **Variant rows** editor (simple rows)
   - **Rich text description** (reuse the Blog WYSIWYG)
   - Additional “A‑to‑Z” product fields (SKU, inventory, SEO, brand, weight/dimensions)

---

## Clarifications locked-in from your answers
- **Customer delete behavior**: Full data deletion (delete profile + auth user + related records) with very strong confirmation.
- **Variants**: “Simple variant rows” first.
- **Dashboard navigation**: Use **separate routes** (e.g., `/ar/orders`, `/ar/customers`) instead of switching a local tab only.

---

## Implementation Plan

### A) Convert Admin panel to real routes (so cards can navigate)
1. Create an **Admin Layout** component that renders:
   - Sidebar (same UI as now)
   - `<Outlet />` for content
2. Update routing so these routes exist:
   - `/ar/dashboard`
   - `/ar/orders`
   - `/ar/customers`
   - `/ar/products`
   - (others can remain as-is or be migrated gradually)
3. Update `AdminDashboard` summary cards:
   - Make “Orders” card link to `/ar/orders`
   - Make “Customers” card link to `/ar/customers`
   - Optionally make “Revenue” link to `/ar/orders?sort=total` (or a BI route)

**Files involved**
- `src/App.tsx`
- `src/pages/Admin.tsx` (refactor into layout + routes)
- `src/components/admin/AdminDashboard.tsx` (click handlers)

---

### B) Orders management: add Actions column + delete + better search
1. Change Orders view from “expand row only” to:
   - Table rows with **Actions** column:
     - **View/Edit** (opens a drawer/modal showing existing edit controls)
     - **Delete** (confirmation dialog)
2. Implement **server-side deletion** (so it’s safe and consistent):
   - Add new admin-only action to an existing backend function (recommended: `order-processor`) such as:
     - `action: "admin_delete_order"`, with `order_id`
   - It deletes related rows in the correct order (order items, transactions, alerts, supplier orders, etc.), then deletes the order
3. Enhance search:
   - Ensure search matches `order_number`, `shipping_name`, `shipping_phone`, and `id` (UUID)

**Files involved**
- `src/components/admin/OrderManagement.tsx`
- `supabase/functions/order-processor/index.ts`

---

### C) Customers management: Actions column + full deletion + edit modal
1. Add **Actions** column:
   - **View/Edit**: modal to update profile fields (`full_name`, `phone`, `address`, `city`, `country`)
   - **Delete**: extremely strict confirmation (type-to-confirm + warning)
2. Implement **full deletion** via backend function (not client-side):
   - Create/extend an admin-only backend function (either new `admin-tools` or add to `order-processor`) that:
     - Deletes/cleans up: `addresses`, `affiliates`, `affiliate_commissions`, customer orders + related rows, tickets/messages if desired, etc.
     - Deletes profile row
     - Deletes auth user via admin API (service role)
3. Improve search:
   - Match `full_name`, `phone`, `city`, and `id` (UUID)

**Files involved**
- `src/components/admin/CustomerManagement.tsx`
- `supabase/functions/order-processor/index.ts` (or new `supabase/functions/admin-tools/index.ts`)

---

### D) Fix phone country-code auto-prefix + validation (1‑Click modal + checkout)
**Problem likely**: `react-phone-input-2` fires `onChange` even while typing; current code updates `form.country` every keystroke, which can desync or override the Country dropdown behavior.

1. In `QuickOrderModal`:
   - Make **CountrySelector authoritative**:
     - When CountrySelector changes → update `PhoneInput.country` and normalize to the correct dial prefix
   - Only update `form.country` from the PhoneInput **when the PhoneInput’s country actually changes** (use a `useRef` to track previous iso2)
   - Ensure the field value always includes the correct dial prefix:
     - Bangladesh selected → always starts with `+880`
2. Keep strict validation:
   - Continue using `libphonenumber-js` validation (`isValidPhoneForCountry`)
   - Disable Order button unless phone is valid for selected country
3. Mirror the same approach in checkout if any mismatch exists (checkout uses `InternationalPhoneInput` already, so mainly ensure country-sync is consistent).

**Files involved**
- `src/components/QuickOrderModal.tsx`
- `src/lib/phoneUtils.ts` (minor helpers if needed)
- `src/pages/Checkout.tsx` (only if sync improvements are needed)

---

### E) Vercel “empty categories/products” fix: add diagnostics + confirm RLS visibility
Because code cannot “push env vars to Vercel” automatically, we will:
1. Add a small runtime **Environment Diagnostics** utility:
   - Checks `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
   - If missing, show a clear admin + optional public warning (only in production build)
2. Add a **Public Data Health Check** section in Admin:
   - Calls `api.health()` (via gateway) + `api.categories.list()` + `api.products.list({limit:1})`
   - Shows whether:
     - Backend reachable
     - Public data readable (RLS OK)
     - Typical errors (Failed to fetch / CORS / missing env)
3. Confirm RLS:
   - Ensure `products` and `categories` have “Anyone can read …” policies (they do in current schema)
   - If any mismatch is found in your live DB, we’ll add a migration/policy fix in the project DB

**Files involved**
- `src/lib/env.ts` (new)
- `src/pages/Index.tsx` (optional: show “data offline” placeholder instead of empty UI)
- `src/components/admin/APIHealthDashboard.tsx` (extend) or create `src/components/admin/DataHealthPanel.tsx`

---

### F) Product Create/Edit modal revamp (professional)
#### F1) Storage-based multi-image uploader (3–5 images)
1. Create a **public** bucket for product images (e.g., `product-images`) and store **paths** in `products.images` array.
2. UI:
   - Drag/drop area (multiple files)
   - Preview grid with:
     - Reorder (drag handles)
     - Remove
     - Upload progress per image
3. Save logic:
   - Upload new files → store returned public URLs (or storage paths, then resolve URL)
   - Set `products.image_url` to the first gallery image
   - Store full gallery in `products.images`

#### F2) Variant rows editor (simple)
1. Add a “Variants” section in the modal:
   - Rows: `variant_label`, `size`, `color`, `sku`, `price_delta`, `stock_quantity`, `is_active`, `sort_order`
2. Save:
   - Upsert into `product_variants` for that product
   - Delete variants removed in UI (soft delete by `is_active=false` preferred)

#### F3) Rich text description (WYSIWYG)
1. Extract the Blog `RichTextEditor` into a reusable component, e.g.:
   - `src/components/editor/RichTextEditor.tsx`
2. Use it in Product modal for `products.description`
3. Update storefront rendering:
   - Product detail currently renders description as plain text
   - Render as sanitized HTML (DOMPurify) so formatting shows properly

#### F4) Add missing product fields (schema + UI)
1. Add fields to `products` table (migration):
   - `brand` (text)
   - `meta_title` (text)
   - `meta_description` (text)
   - `length_cm`, `width_cm`, `height_cm` (numeric)
2. Add UI fields grouped like Amazon:
   - “Basics” (Title, Category, Brand)
   - “Pricing” (Price, Compare-at)
   - “Inventory” (SKU, Stock)
   - “Shipping” (Weight, Dimensions)
   - “SEO” (Meta Title/Description)
   - “Description” (Rich text)
   - “Images” (Gallery uploader)
   - “Variants” (rows)

**Files involved**
- `src/components/admin/ProductManagement.tsx` (replace current add/edit UI with modal/drawer)
- `src/components/editor/RichTextEditor.tsx` (new)
- `src/pages/ProductDetail.tsx` (render sanitized rich HTML + optional gallery)
- `supabase/migrations/*` (schema changes + storage bucket creation + policies)

---

## Technical details (important)
- **Deletion must be server-side** (backend function) to avoid partial deletes and to allow deleting auth users securely.
- **Never store API keys or sensitive data in the browser**; admin-only actions remain protected.
- **Product rich text** will be sanitized before display (DOMPurify) to prevent XSS.
- **Storage buckets**
  - `blog-images` exists; add `product-images` (public) for storefront images.

---

## Testing checklist (end-to-end)
1. Admin:
   - Click dashboard cards → routes open correct pages
2. Orders:
   - Search by order # and phone
   - View/Edit updates status
   - Delete order removes it and related items
3. Customers:
   - Search by name/phone/id
   - Edit profile saves
   - Delete customer fully removes access + data
4. Product modal:
   - Drag-drop 3–5 images, reorder, save, verify storefront shows images
   - Add variants, verify product page + stock/price behavior
   - Rich text description renders formatted on product page
5. Vercel:
   - Data Health panel shows env vars present + public data readable
   - Homepage categories/products populated

