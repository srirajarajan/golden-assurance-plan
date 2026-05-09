## Scope

This is a large change set touching ~15 files plus the PDF edge function. Before I start, I need a few decisions because some items conflict with hard memory rules and existing infra.

## Conflicts that need your call

**1. "Application form ONLY IN ENGLISH"** — directly conflicts with the locked memory rule "Strict Tamil/English bilingual via global toggle" and the entire `i18n/translations.ts` system. Options:
   - **A. Honor the new request**: Strip Tamil from the application form only (labels, placeholders, validation messages all English regardless of global toggle). Other pages stay bilingual.
   - **B. Keep bilingual**: Skip item 6, keep the existing Tamil/English toggle on the form.
   - **C. Make the whole site English-only**: Remove the toggle entirely (large blast radius — Header, Footer, every page, PDF generator).

**2. "Smart Aadhaar camera with TensorFlow.js / OpenCV.js"** — Adding TF.js (~1MB+) directly conflicts with the recent performance work (load < 3s, code splitting, esbuild minify). Options:
   - **A. Lightweight version**: HTML5 `getUserMedia` + rectangular overlay guide + a simple Laplacian-variance blur check in plain canvas (no TF.js). Retake button if blur score too low. ~5KB of code, no heavy deps.
   - **B. Full TF.js / OpenCV.js**: Real edge detection + ML blur check. Adds ~2MB to bundle, slower load.
   - **C. Skip for now**: Keep current upload-with-`capture=environment`.

**3. PDF pamphlet removal** — The edge function `generate-application-pdf` currently renders a pamphlet image on page 2, and the "PDF Pamphlet Resolution" memory rule pins specific aspect-ratio handling. Removing it is straightforward; I'll also drop the upload field, storage handling, and the memory rule. Confirming this is intended.

**4. Plan amounts inconsistency** — Item 2 says Silver=₹3,000 / Gold=₹6,000 / Platinum=₹10,000 (the application-form cards). Item 5's fee table totals are ₹3,540 / ₹7,080 / ₹11,800 (with GST). The homepage (item 4) shows the base ₹3,000 / ₹6,000 / ₹10,000. I'll display base on cards and the full GST breakdown only in the Benefits-page fee table, matching what you wrote. Confirming.

## Implementation plan (assuming A/A on Q1/Q2, yes on Q3/Q4)

### Phase A — Pamphlet removal
- `ApplicationPage.tsx`: remove pamphlet upload field, preview, sequential-upload logic step, validation.
- `supabase/functions/generate-application-pdf/index.ts`: remove pamphlet section, tighten page-2 layout so it stays clean and 2-page.
- `supabase/functions/send-application/index.ts` & `send-membership-application/index.ts`: drop pamphlet from payload + email.
- Admin views: remove any pamphlet thumbnail/link.
- Update memory: remove `mem://features/pdf-pamphlet-resolution` and `mem://features/sequential-image-upload-logic` references that mention pamphlet (rewrite to 3 images: Photo, Aadhaar Front, Aadhaar Back).

### Phase B — Plan restructure
- New constant file `src/data/plans.ts` with the 3 plans (Silver/Gold/Platinum, ₹3k/₹6k/₹10k, benefit lists, activation period, worth).
- `PlansSection.tsx` (homepage): show only name + price + "Worth ₹X services" + "Apply Now" CTA. No feature list.
- New `PlanCardsDetailed.tsx` (used in ApplicationPage + Admin preview + PDF context): full feature list, activation, worth, premium gold/silver/platinum styling, hover effects.
- `ApplicationPage.tsx`: insert detailed cards above the form; existing `selected_plan` field stays wired.

### Phase C — Benefits page rewrite
- `BenefitsPage.tsx`: replace content entirely with the new long-form copy (intro, eligibility, 5 service-guarantee points with icons, required documents, administration note).
- Append a premium responsive fee table (Scheme / Doc Fee / Service Fee / GST / Total / Activation / Benefits) with Platinum highlighted.
- Add "Plan Effective from Date of Registration" note.
- Bilingual via translations (existing pattern).

### Phase D — Homepage plan section
- `HomePage.tsx`: keep `<PlansSection />` (now slim) — no breakdown.

### Phase E — English-only application form (if Q1=A)
- `ApplicationPage.tsx`: hardcode all labels/placeholders/errors in English; ignore `language` for this page only.

### Phase F — Smart Aadhaar capture (if Q2=A)
- New `src/components/SmartAadhaarCapture.tsx`: opens `<video>` via `getUserMedia({video:{facingMode:'environment'}})`, overlays a rectangular guide (CR80 aspect 1.586:1), capture button → draws to canvas → runs Laplacian-variance blur check → if score < threshold show "Image not clear. Please retake." with Retake button → on accept, returns a `File` to parent.
- Wire into `ApplicationPage.tsx` for Aadhaar Front + Back. Fallback to file input if camera blocked.
- Mobile-first styling, scanning animation (tailwind animate).

### Phase G — Cleanup
- Update memory index: drop pamphlet rules, update sequential-upload rule (3 images), add "Application form English-only" rule, add smart-capture rule.

## Out of scope
- No DB schema changes (current `applications` table is sufficient).
- No changes to auth, admin staff management, serial system.

## Please answer

1. Q1 — application-form language: **A**, **B**, or **C**?
2. Q2 — smart Aadhaar capture: **A** (lightweight, recommended), **B** (TF.js), or **C** (skip)?
3. Q3 — confirm full pamphlet removal across form + PDF + emails + memory: **yes / no**.
4. Q4 — confirm plan amounts: cards show ₹3k/₹6k/₹10k base, fee table shows full GST totals: **yes / no**.

Once you reply I'll execute everything in one pass.