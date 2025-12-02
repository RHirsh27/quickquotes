# Product Master Plan

## 1. PRODUCT IDENTITY

**App Name:** Quotd

**Core Value:** Mobile-first, rapid quoting and invoicing for trade businesses (Plumbing, HVAC, Electrical).

**Business Model:** Hybrid SaaS (Subscriptions) + Fintech (1% Transaction Fee).

**Tech Stack:** Next.js 14 (App Router), Supabase (Auth/DB/RLS), Stripe (Connect + Billing), Tailwind CSS.

---

## 2. PRICING STRATEGY (Single Source of Truth)

*Reference: `src/config/pricing.ts`*

The app must enforce a strict 3-Tier + Overage model:

1. **SOLO ($29/mo):** 1 User limit.

2. **CREW ($99/mo):** 5 User limit.

3. **TEAM ($199/mo):** 10 User limit.

   * **Overage:** $25/mo per additional seat (via Stripe Usage Records).

   * **Logic:** If user > 10, trigger `EXTRA_SEAT_PRICE_ID`.

---

## 3. FEATURE SPECIFICATIONS

### A. Authentication & Onboarding

- **Auth:** Email/Password Signup via Supabase.

- **Email Verification:** Users land on `/verify-email` and must verify before accessing Dashboard.

- **Trigger:** `handle_new_user` SQL trigger automatically creates a `public.users` row and default `service_presets`.

- **Team Backfill:** Every new user is automatically assigned a `team_id` (Team of 1) via SQL trigger/function.

### B. Dashboard & Role-Based Access (RBAC)

- **Owner View:** Sees Total Revenue, Monthly Volume, and Team Settings.

- **Member View:**

  - **HIDDEN:** Total Revenue/Volume cards.

  - **VISIBLE:** "My Performance" card only.

  - **RESTRICTED:** Cannot access `/settings/team` or `/settings/billing`.

- **Visuals:** Dashboard must use the "Pro" UI (Shadows, Rounded-XL, Lucide Icons).

### C. Team Management

- **Invite Flow:** Owners can invite members by email via `/settings/team`.

- **Gatekeeping:** Server Action `inviteMember` must check the subscription limit (1/5/10) before allowing the insert.

- **Overage Logic:** If `TEAM` plan user invites the 11th member, trigger the Stripe "Add Seat" flow.

### D. The Quote Engine

- **Presets:**

  - **Owners:** Can Create/Edit/Delete presets (Shared Price Book).

  - **Members:** Read-Only access. Can use presets in quotes but cannot modify the master list.

- **Quote Builder:**

  - Customer Selection (Create New or Select Existing).

  - Line Item logic (Calculates Subtotal + Tax Rate = Total).

  - **PDF Generation:** Client-side PDF generation using `@react-pdf/renderer` including Company Header, Customer Info, and Footer Notes.

### E. Fintech & Payments

- **Stripe Connect:** Users must onboard via `/settings/payments` to receive payouts.

- **Homeowner Payment:** Public route `/pay/[invoiceId]`.

- **Application Fee:**

  - Reference: `src/app/api/stripe/create-payment/route.ts`

  - **Logic:** Must use `APPLICATION_FEE_PERCENT = 0.01` (1%).

  - **Flow:** Homeowner pays $100 -> Stripe takes fees -> Platform takes $1 -> User gets remainder.

### F. Security (RLS)

- **Isolation:** All major tables (`customers`, `quotes`, `invoices`) must use `team_id` for RLS.

- **Policies:**

  - "Members can view team data."

  - "Owners can edit/delete team data."

  - "Public can view invoices (Select True)" for payment pages.

---

## 4. BRANDING

**Official App Name:** Quotd

**Tagline:** Instant Estimates

**Metadata Title:** Quotd | Instant Estimates for Trades

**Description:** Professional quoting tool for trade jobs

---

## 5. IMPLEMENTATION NOTES

- All pricing logic must reference `src/config/pricing.ts` as the single source of truth.

- Application fee percentage is centralized in `APPLICATION_FEE_PERCENT` constant.

- Team-based RLS policies ensure data isolation between teams.

- Role-based access control (RBAC) enforces owner vs member permissions.

