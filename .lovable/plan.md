# Final Corrections & Enhancements Plan

This is a large multi-part change. I'll group it into 6 phases. Before I start, I need one asset and a couple of decisions confirmed.

---

## Blockers I need from you

1. **Uploaded seal & signature image (Item 10):** I don't see any new file attached to this message. Please upload the official seal/signature image (PNG with transparent background preferred). Without it I cannot replace the existing one.
2. **Application number uniqueness:** Should `WCF0001` be globally unique across all staff? I'll enforce a UNIQUE constraint and reject duplicates at submit time (recommended). Confirm if you want different behavior.
3. **DOB / Area / District / Pincode / Allocated Officer (Item 5):** These will be stored as new columns on the `applications` table and shown in the PDF + admin. Confirm OK.

I'll proceed with the rest below assuming "yes" on (2) and (3); the seal swap will wait for the upload.

---

## Phase 1 — Invoice (Items 1, 2, print colors)

`src/pages/InvoiceGeneratorPage.tsx`:
- Remove Tamil company name from header.
- Single-line address: `RR Complex, Kannankurichi Main Road, Chinnathirupathi, Salem - 636008`.
- Keep 3-column header (Logo | Name+Address centered | Contact right) with 📞 🌐 ✉.
- Remove the "computer-generated invoice…" footer line.
- Inject a strong `@media print` block (with `* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important }`, white body bg, container reset). Apply same colors via `html2canvas` (already `backgroundColor: '#fff'`, `scale: 2`).
- Verify Chrome/Edge/Firefox print preview match on-screen.

## Phase 2 — Benefits page (Items 3, 4)

`src/pages/BenefitsPage.tsx` + `src/i18n/translations.ts`:
- Add a `benefits` translation block (EN + TA) covering: title, intro paragraph, 4 bullet items, 5 guarantee cards (title + desc), notes card, "Required Documents" heading + 3 doc labels/qty, Administration block.
- Drive every visible string through `useLanguage()` / `t.benefits.*`.
- **Remove** the entire "Service Scheme Fee Details" section (heading, intro line, the `<Card>` with the table, and the "Plan Effective from…" caption).

## Phase 3 — Application form (Items 5, 6, 8)

DB migration on `applications`:
- Add columns: `application_number text UNIQUE NOT NULL`, `dob date`, `area text`, `district text`, `pincode text`, `allocated_officer text`.
- Index on `application_number` and on `created_by` (for staff tracking).

`src/pages/ApplicationPage.tsx`:
- New prominent "Application Number" field at top, required, pattern `^WCF\d{4,}$`, manual entry, with duplicate check on submit.
- New rows: (Name | Mobile), (DOB | Area), (District | Pincode), (Allocated Officer).
- Keep all existing fields/behavior below.

PDF email/download (`supabase/functions/generate-application-pdf` + `send-application`):
- Filename = `${application_number}.pdf` everywhere (download, email attachment, response headers).
- Include DOB/Area/District/Pincode/Allocated Officer in the rendered PDF.

## Phase 4 — Staff tracking (Item 7)

`src/pages/AdminDashboard.tsx`:
- New "Completed Applications by Staff" section.
- Group applications by `created_by` → list each staff with count + clickable app numbers.
- Click a staff → drawer/dialog with table: Application No, Applicant Name, Mobile, Date, Status, "View Application" (opens existing PDF/signed URL flow).

## Phase 5 — PDF polish + seal (Items 9, 10)

- Tighten margins/spacing/font sizes in `generate-application-pdf` for clean A4, equal column widths in tables, consistent header.
- Once you upload the seal/signature, I'll: upload it to the existing public `pdf-assets` bucket (replacing the current one), keep aspect ratio, place in Authorized Signatory slot — same image used for download, email, print.
- Ensure email attachment and download stream identical bytes (same generation path).

## Phase 6 — Performance & security (Items 11, 12)

Most of this is already in place (lazy routes, Terser, manual chunks, React Query cache, RLS, server-side PDF, signed URLs, validated inputs). I will:
- Add `loading="lazy"` + `decoding="async"` to non-critical `<img>` tags.
- Add `<link rel="preconnect">` for Supabase origin in `index.html`.
- Zod-validate the new application fields server-side in the edge function.
- Audit RLS on new columns (no change needed — same row policies apply).
- Re-run `bun run build` and check for warnings.

No DB roles/policies change beyond the column additions.

---

## Deliverable order

1. You upload the seal image + confirm (2)/(3) above.
2. I run the SQL migration (applications columns).
3. I ship Phases 1, 2, 4, 6 immediately (no blockers).
4. I ship Phases 3 & 5 (need migration applied + seal uploaded).

Reply with the seal image and a 👍 on the two questions and I'll start.