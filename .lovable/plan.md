# Admin Dashboard, Staff Performance & PDF Professional Enhancement

Big scope — breaking into 4 focused phases. Nothing existing gets removed except the Range Setup section, per your request. All application submission, auth, email, SMS, invoice, updates, and docs flows stay untouched.

---

## Phase 1 — Application Number: Single Source of Truth

**Goal:** the manually entered `application_number` (e.g. `WCF0001`) is used everywhere — form, PDF header, PDF filename, email attachment, admin table, search.

Changes:
- `ApplicationPage.tsx`: pass `application_number` explicitly to the PDF edge function payload (currently the edge function may still fall back to serial). Make the field required + uppercase + pattern `WCF\d{4,}`.
- `supabase/functions/generate-application-pdf/index.ts`: accept `application_number` in the request body, render it as **"Application No: WCF0001"** in the PDF header, and use it as the storage filename `WCF0001.pdf`.
- `supabase/functions/send-application/index.ts` (and `send-membership-application`): use `application_number` as the email attachment filename.
- Prevent duplicates: add UNIQUE index migration on `applications.application_number`.

---

## Phase 2 — Admin Dashboard Redesign

**Remove:** the Range Setup section entirely (button, dialog trigger, and column). Keep the underlying `range_start/range_end/current_serial` DB fields untouched so serial generation keeps working — just hide the UI.

**New top summary cards** (replace/extend `AdminSummaryCards`):
- Total Applications
- Completed Applications (all submitted apps count as completed)
- Pending Applications (staff profiles with `status='pending'` — clarify if you want a different definition)
- Total Staff Members

**New "Staff Performance" table** below the cards:

```text
Staff Name | Completed Apps | Pending Apps | Actions
Raja       | 35             | 2            | [View]
Kumar      | 22             | 1            | [View]
```

Counts come from grouping `applications` by `staff_user_id`.

Search + sort on the existing All Applications table:
- Search: application no, applicant name, mobile, staff name, plan, date
- Sort: newest, oldest, plan, staff, status

Add loading skeletons, hover states, pagination (25/page), and keep the current color tokens.

---

## Phase 3 — Staff Detail Page

New route `/admin/staff/:staffUserId` (guarded by admin role):
- Header: staff name, email, phone, district, completed count
- Filters: search by app number / applicant name / mobile
- Table columns: App No, Applicant Name, Mobile, Plan, Date, Status, [View PDF] [Download PDF]
- Toolbar buttons: **Export Excel** (xlsx via SheetJS), **Export PDF** (jsPDF autotable), **Print Report** (window.print with print CSS)

---

## Phase 4 — Application PDF Redesign (2-page premium layout)

Rewrite the layout inside `generate-application-pdf/index.ts` using jsPDF. Keep image handling, seal fetch, Tamil font embedding, and the 2-page constraint.

**Page 1**
```text
┌──────────────────────────────────────────────┐
│ [LOGO]  William Carey Funeral Services Pvt.  │
│         Address • Phone • Email • Website    │
├──────────────────────────────────────────────┤
│ Application No: WCF0001         Date: ...    │
├──────────────────────────────────────────────┤
│ APPLICANT DETAILS                            │
│ Member Name         │ Aadhaar Number         │
│ Father/Husband      │ Mobile Number          │
│ Gender              │ Payment Method         │
│ Age                 │ Area                   │
│ Occupation          │ District               │
│ Annual Income       │ Pincode                │
├──────────────────────────────────────────────┤
│ PERMANENT ADDRESS (full width, wraps)        │
├──────────────────────────────────────────────┤
│ NOMINEE 1        │ NOMINEE 2                 │
│ Name/Rel/Gen/Age │ Name/Rel/Gen/Age          │
├──────────────────────────────────────────────┤
│ [Aadhaar Front]   [Aadhaar Back]  (bordered) │
├──────────────────────────────────────────────┤
│ Additional Message (bordered box)            │
└──────────────────────────────────────────────┘
```

**Page 2**
```text
┌──────────────────────────────────────────────┐
│ PLAN DETAILS (card)                          │
│ Plan • Amount • Benefits Worth • Activation  │
├──────────────────────────────────────────────┤
│ BENEFITS                                     │
│ ✓ Heaven Vehicle    ✓ Ice Box                │
│ ✓ Pandal + Chairs   ✓ Ritual Items           │
│ ✓ Food Arrangement                           │
├──────────────────────────────────────────────┤
│                                              │
│              [Seal + Signature]              │
│              Managing Director               │
│    William Carey Funeral Services Pvt. Ltd.  │
└──────────────────────────────────────────────┘
```

Uniform 15mm margins, section headers in brand brown on light gold band, consistent font sizes (title 14, section 11, body 10), 4mm row padding. Downloaded PDF and emailed PDF share the same edge function output — automatically identical.

---

## Technical Details

**New/updated files**
- Migration: `ALTER TABLE applications ADD CONSTRAINT applications_app_number_unique UNIQUE (application_number);`
- `src/pages/AdminDashboard.tsx` — remove Range Setup UI, add Staff Performance table, integrate search/sort/pagination
- `src/components/admin/AdminSummaryCards.tsx` — extend with new metrics
- `src/components/admin/StaffPerformanceTable.tsx` — new
- `src/pages/StaffDetailPage.tsx` — new
- `src/App.tsx` — add `/admin/staff/:id` route
- `supabase/functions/generate-application-pdf/index.ts` — full layout rewrite, accept `application_number`
- `supabase/functions/send-application/index.ts` — filename uses `application_number`
- `src/pages/ApplicationPage.tsx` — send `application_number` through the pipeline

**Left alone**
- Auth, signup, invoice generator, updates/docs pages, benefits page, plans page, WhatsApp button, header/footer, i18n dictionary structure, submission edge function orchestration, serial generation function (still used internally for `serial_number`).

**Packages to add**
- `xlsx` for Excel export
- `jspdf-autotable` for the PDF export in the staff detail page (jspdf already installed)

Approve and I'll ship Phase 1 first (application-number consistency + PDF filename), then Phase 2/3 (dashboard + staff detail), then Phase 4 (PDF redesign) — each phase in a single batch of parallel edits.
