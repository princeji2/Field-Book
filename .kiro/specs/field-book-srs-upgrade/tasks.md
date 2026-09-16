# Implementation Plan: Field Book SRS v2.0

## Overview

The deliverable is a document: **Field Book SRS v2.0**, a 38–42 page Markdown master at `docs/srs/field-book-srs-v2.0.md` with image assets under `docs/srs/assets/` (Requirement 13.4, design C1). Two corrective forward migrations are also specified by the design and are created only after the user's dated confirmation is recorded (Requirements 18.10, 19.11, design C7.3).

Authoring order follows design component **C8**, which sequences sections by fact dependency rather than by document order: §8 first, then §4/§5, §3, §14, §13/§17, §11/§12, §9 (which triggers the capture run), §10, §15, §6/§7, §16/§18/§19, and finally §21/§20/front matter/Appendix RC. A single numbering pass allocates artifact sequence numbers after the body is complete (design C1, *Numbered_Artifact identifier allocation*). Gates G1–G9 close the work.

Two conventions apply throughout:

- Tasks marked `*` are optional and are executed only under the condition stated in the task.
- Tasks marked **BLOCKED** are not started until the user's explicit, dated confirmation is recorded by task 19.1. Every migration-creating, migration-applying, and rollback-authoring task is blocked, because all four files change live authorization (Requirements 18.10, 19.11).

`npm run dev` is a long-running process. Every capture task assumes the **user** starts the dev server manually in a terminal and confirms `http://localhost:5173` is serving; the agent never blocks on it (design C4.1).

---

## Tasks

- [ ] 1. Scaffold the output directory, assets, and document skeleton

  - [ ] 1.1 Create the output directories and copy the two Available_Screenshots
    - Create `docs/srs/` and `docs/srs/assets/`. `docs/` already exists and holds only `MIGRATION_GUIDE.md`
    - **Copy, do not move**, `fieldbook-homepage.png` → `docs/srs/assets/screenshot-A01-landing-1440.png` and `fieldbook-login-mobile-390.png` → `docs/srs/assets/screenshot-A02-login-mobile-390.png`, per the design's filename grammar `screenshot-<row-id>-<slug>-<width>.png` with the hyphen removed from the row id (`Available-1` → `A01`)
    - Leave both originals at the repository root untouched so no existing reference breaks
    - Verify the intrinsic pixel width of each copy matches the width token in its filename (Property 12 reads the PNG header, not the claim)
    - _Design: C1 asset layout and filename scheme_
    - _Requirements: 13.1, 13.2, 13.3, 9.3_

  - [ ] 1.2 Write the master file skeleton with the 21 verbatim section headings
    - Create `docs/srs/field-book-srs-v2.0.md` with a single `#` title, the four front-matter blocks as `##` placeholders (title page, revision history, table of contents, reading conventions), the 21 numbered sections as `## <n>. <Title>` with `<n>` and `<Title>` copied **verbatim** from the Appendix B table, and `## Appendix RC` after section 21
    - Apply the design's heading discipline: `#` once, `##` for front matter / the 21 sections / each appendix, `###` for numbered subsections, `####` for requirement, policy, use-case and test-case blocks, and no `#####` at all
    - Do not author body content in this task; the verbatim heading sequence is what makes the Appendix B heading-order check possible
    - _Design: C1 document architecture_
    - _Requirements: 7.1, 7.5, 13.1, 13.4_

  - [ ] 1.3 Pin and record the Repository revision used for every listing and citation
    - Run `git rev-parse --short HEAD` and record the **actual** value, not an assumed one. The design states `3cc14af`; re-confirm at execution time and record whatever is actual
    - Write the pinned revision into the reading-conventions block and into the listing-inventory placeholder, so all 22 listings and every Evidence_Citation resolve against one revision
    - If the actual revision differs from `3cc14af`, note the substitution in the listing inventory so the design and the delivered document do not disagree silently
    - _Design: C5 pinned revision_
    - _Requirements: 10.4, 1.8_

  - [ ] 1.4 Record the page-count measurement procedure in the front matter
    - State in the front matter the five fixed render settings: A4 page size, 2 cm margins, 11 pt body, 1.15 line spacing, Mermaid figures at natural size capped to the text width
    - State that per-section page counts are measured between section headings from the same render, and that these five settings are frozen for the life of the document
    - This must land **before §6 and §7 are authored**, because Requirement 7.9 forbids changing layout settings later to bring the count inside the 38–42 band
    - _Design: C8 page-count measurement_
    - _Requirements: 7.2, 7.3, 7.8, 7.9_

- [ ] 2. Correct the route-count claims in the spec documents

  This is a **factual correction to the spec, not a scope change.** `src/app/routes/index.tsx` declares 33 leaf route paths excluding the catch-all `*`, of which two are parameterised variants rendering the same component as a sibling path, giving 31 distinct screens. Three layout paths (`/student`, `/organizer`, `/admin`) render `RoleGuard` and no screen. `requirements.md` Requirement 11.6 and Appendix A2.19 both state 25. 33 is the verified fact; the count 25 is not borne out by the route table.

  - [ ] 2.1 Replace the count `25` with the enumerated leaf-path set in both claims
    - In `requirements.md` Requirement 11 criterion 6, replace "one of the 25 route paths declared in `src/app/routes/index.tsx`" with a reference to the enumerated leaf-path set declared in that file, excluding the catch-all, so RTM screen resolution binds to the enumeration rather than to a count
    - In `requirements.md` Appendix A2.19, replace "Twenty-five routes" with the enumerated count of 33 leaf paths excluding the catch-all and 31 distinct screens, retaining the existing observations about `/pricing`, `/campuses`, `/auth/callback`, `/auth/reset-callback` and the landing-page catch-all
    - Change no other criterion and no other appendix row
    - _Design: C1 §9 content plan; C6 screen-to-route resolution_
    - _Requirements: 11.6, 1.1, 1.2_

  - [ ] 2.2 Add RC-13 to Appendix F of `requirements.md`
    - Add one row: identifier `RC-13`, statement recording the route-count discrepancy between the enumerated 33 leaf paths and the previously stated 25, reason the repository settles the enumeration but not the origin of the count, confirming party `User`, status `Open`
    - `RC-13` is the first identifier allocated above the twelve already fixed in Appendix F, consistent with the design's decision to preserve register continuity
    - _Design: Data Models — RC_Register numbering decision_
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 3. Put the design's open decisions to the user

  - [ ] 3.1 Present the five open decisions and record the answers with their dates
    - **RC-14** — may an organizer set `status` to `live` or `completed`? The chosen single-policy form of Migration A forbids it and also prevents an organizer editing an event that has left `draft`. This answer gates Migration A's final form (task 20.1 versus the optional variant 20.2)
    - **RC-15** — does a second admin exist? Migration B's `approvals_update_admin` correction makes an admin-owned event's approval resolvable only by a different admin, so on a single-admin deployment the flow is blocked. This gates whether that part of Migration B is operable
    - **RC-16** — do the seed's three demo organizer auth users and the demo admin reviewer exist in the database used for screenshot capture? `20260819110000_seed_demo_data.sql` hard-codes those four UUIDs behind real foreign keys into `profiles` → `auth.users`
    - **`Listing 15.22`** — `certificate-service/pom.xml` (the design's default, kept under the Java tier heading because it declares that tier) or a seventh Java source under `certificate-service/src/main/java/` such as `config/SupabaseConfig.java`, with the version facts moving entirely into `Table 17.2`
    - **RC_Register numbering** — the design preserves `RC-01`…`RC-12` continuity from Appendix F and allocates `RC-13` upward in first-occurrence order, which deviates from Requirement 3.2's strict first-occurrence rule. Confirm the deviation or request the mechanical renumber
    - Record each answer and its date in the Author_Process log. Downstream tasks reference these answers; none of them assumes one
    - _Design: Open Items; C5 departure 1; C7.1; C7.2; Data Models — RC_Register numbering decision_
    - _Requirements: 3.6, 14.11, 18.5, 19.4_

  - [ ] 3.2 Create the RC-13 … RC-16 placeholder rows in the master's Appendix RC
    - Add rows for `RC-13` (route count, §9.1), `RC-14` (organizer status range, §14.6), `RC-15` (second admin, §14.7) and `RC-16` (demo auth users in the capture database, §9.7) with the seven columns Requirement 3.3 mandates
    - Add the register header note stating the numbering deviation: rows `RC-01`–`RC-12` are numbered by their Appendix F allocation, `RC-13` onward by first inline occurrence
    - Leave `RC-17` unallocated; it is created only if a Legacy_Requirement_ID's wording proves unrecoverable in task 12.1, and it is the last number allocated so nothing is skipped
    - Where task 3.1 returned a decision, set the status to `Confirmed` or `Refuted` with the date and remove the inline marker obligation for that entry
    - _Design: Data Models — new entries anticipated_
    - _Requirements: 3.2, 3.3, 3.5, 3.6_

- [ ] 4. Author the fact-base sections — §8, §4, §5, §3, §14

  - [ ] 4.1 Author §8 Database Requirements
    - Write subsections 8.1–8.16 exactly as the design's per-section content plan fixes them: 8.1 overview and migration order, 8.2–8.12 the eleven tables in the design's order, 8.13 functions and triggers, 8.14 views, 8.15 storage buckets, 8.16 the row-level security policy catalogue
    - Transcribe the column, type, nullability, default and constraint facts already enumerated in the design for each of the eleven tables. State the specific absences the design names: `member_since` rather than `created_at` on `profiles`; the four-value `events.status` enumeration with no `pending_review` and no `cancelled`; no `attendance_id`, no `sha256_hash` and no `pdf_storage_path` on `certificates`; the quoted `"current_role"` column; `platform_activity.category` as free text with no CHECK
    - State that `audit_log` is append-only *solely* because no UPDATE policy and no DELETE policy exist, and that no constraint, trigger or privilege revocation enforces it
    - Carry `Table 8.1`–`Table 8.14`. Cross-reference the eight SQL listings in §15 rather than duplicating SQL text here
    - _Design: C1 §8 content plan_
    - _Requirements: 2.2, 5.8, 16.1, 16.5, 6.11_

  - [ ] 4.2 Author §4 System Architecture
    - Write 4.1 tier decomposition, 4.2 interfaces and data-flow direction, 4.3 trust boundaries, 4.4 data-access paths, 4.5 deployment topology
    - Use the design's three-tier table as the basis: `src/`, the Supabase platform defined by `supabase/migrations/`, and `certificate-service/`, each with responsibilities and exposed interfaces
    - State the two trust boundaries: browser/Supabase where RLS is the control, and certificate-service/Supabase where no control exists. State the three RPC data-access paths and why each exists
    - Carry `Table 4.1` with direction and evidence per interface. Place the first occurrence of `RC-07` here, stating both declared production origins and that they disagree
    - _Design: C1 §4 content plan_
    - _Requirements: 4.6, 4.7, 5.6, 16.2, 3.1_

  - [ ] 4.3 Author §5 Module Descriptions
    - Write 5.1 frontend route modules, 5.2 frontend service layer, 5.3 certificate-service packages, 5.4 database objects as modules, using the design's enumerated module lists
    - Give each module subsection responsibility, inputs, outputs, dependencies, repository path and an Implementation_Status value
    - Record the `src/lib/approvals.ts` documentation discrepancy: its doc comment on `submitEventApproval` claims the policies forbid an organizer setting any status other than `draft`, which is true of `events_insert_organizer` and false of `events_update_own_organizer`. Classify the module `Implemented` because its behaviour is correct, and cross-reference §14.6 for the inaccurate comment
    - Carry `Table 5.1`–`Table 5.4`
    - _Design: C1 §5 content plan_
    - _Requirements: 5.7, 17.3, 17.4, 17.5_

  - [ ] 4.4 Author §3 User Roles and Permissions
    - Write 3.1 role definitions, 3.2 permission grid, 3.3 guard behaviour, 3.4 role acquisition and change
    - Build `Table 3.2` with exactly three rows — student, organizer, admin — and one column per permission-bearing capability from the design's enumerated column list, every granted cell carrying evidence
    - Write the two honesty cells exactly as the design fixes them: `set event status to published` reads `Reachable — defect, see §14.6` for organizer and is not marked granted; `resolve role-change request` about oneself reads `Not prevented — defect, see §14.7`
    - In 3.4 state plainly that the repository provides no path from an empty database to a first admin and that the first admin must be provisioned outside the application. This earns a limitations row in task 13.2
    - Document guard behaviour: `RoleGuard` over `/student`, `/organizer` (`allow="org"`) and `/admin`; `AuthRouteGuard` over `/profile`; the catch-all `*` rendering the landing page rather than a not-found page
    - _Design: C1 §3 content plan; C4.2 bootstrap problem_
    - _Requirements: 5.3, 16.6, 16.7, 6.11_

  - [ ] 4.5 Author §14 Security Requirements
    - Write 14.1–14.9 per the design's content plan. Quote the nine `events` policies in full in 14.3 because §14.6 turns on their exact text; summarise the remaining policies by name, operation and `using`/`with check` expression
    - 14.4 states the key privilege boundary and that `POST /api/certificates/generate` validates no caller identity, session or role while holding the service-role key
    - 14.6 states the event publication gate defect: `events_update_own_organizer` declared `using (organizer_id = auth.uid()) with check (organizer_id = auth.uid())` with no `status` restriction; enforcement before correction is application code in `src/lib/approvals.ts`; enforcement after correction is a row-level security policy; the corrective filename is `20260908120000_events_status_publication_gate.sql`; classification `Partially Implemented`
    - 14.7 states the self-approval defect and the Requirement 19.4 assessment of `approvals_update_admin`, including that `events_insert_admin` lets an admin own an event, so an admin can resolve its own event's approval. State the `reject_role_change_request` asymmetry and why it is deliberate
    - Record the **documentation defect** separately from the behavioural one: the `src/lib/approvals.ts` comment and the `role_change_requests_update_admin` comment in `20260817120000_role_change_requests.sql` both promise guarantees their implementations do not deliver. A comment is not evidence
    - Add no qualifier that reduces a weakness's stated severity without an Evidence_Citation substantiating it
    - Carry `Table 14.1`–`Table 14.3`. Place first occurrences of `RC-14` and `RC-15`
    - _Design: C1 §14 content plan; C7.1; C7.2_
    - _Requirements: 5.14, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.10, 17.13, 18.3, 18.6, 18.7, 19.3, 19.4, 19.7, 19.8_

- [ ] 5. Checkpoint — fact-base sections verified
  - Run gate G1 (evidence check) and gate G3 (status agreement, per-section scope) over §3, §4, §5, §8 and §14. Ensure all checks pass, ask the user if questions arise.

- [ ] 6. Author the transcription and workflow sections — §13, §17, §11, §12

  - [ ] 6.1 Author §13 Validation and Error Handling
    - Write 13.1 client-side validation, 13.2 database-enforced constraints, 13.3 HTTP error contract, 13.4 retained versus discarded input
    - Per rule state the validated input, accepted values, observable rejection behaviour, whether the submitted data is retained or discarded, and the enforcing layer
    - Transcribe the four mappings from `ValidationExceptionHandler`: 400 validation failure with a `fields` object, 404 template not found, 502 Supabase integration failure logged at error, 422 certificate cannot be generated logged at warn; success 200 with `certificateUrl`. State the concrete 422 trigger — a template whose `background_image_url` is null or blank, raised in `CertificateController.generate`
    - Carry `Table 13.1` and `Table 13.2`. State no password-reset duration anywhere
    - _Design: C1 §13 content plan_
    - _Requirements: 2.3, 5.13, 6.11_

  - [ ] 6.2 Author §17 Hardware and Software Requirements
    - State minimum client hardware for camera capture and the supported-browser basis. Transcribe versions from `package.json`, `certificate-service/pom.xml` and `certificate-service/Dockerfile`
    - State `spring-boot-starter-parent` 4.1.0 explicitly as the correction to SRS_v1's "Spring Boot 3", with `java.version` 17 and PDFBox 3.0.8
    - Transcribe the `Dockerfile` content into `Table 17.2` rather than as a listing, per the design's resolution of the Appendix E `E3.7` pairing. If task 3.1 chose the alternative for `Listing 15.22`, move the whole version fact set here
    - Carry `Table 17.1` and `Table 17.2`
    - _Design: C1 §17 content plan; C5 departure 1_
    - _Requirements: 5.17, 2.2_

  - [ ] 6.3 Author §11 Detailed Workflows
    - Write 11.1–11.8, one subsection per mandated workflow, each stating initiating actor, trigger, ordered steps, terminal outcome, failure paths and Implementation_Status
    - Use the design's content anchors verbatim as the fact base, including: the `on_auth_user_created` trigger on `auth.users`; the four-value status gate on attendance; the `23505` duplicate mapping; the two-write non-atomicity in `approveEventApproval` that can leave a published event with a pending approval; the 60-second client timeout with one retry
    - 11.7 certificate verification is `Planned`: future or conditional voice only, `src/app/routes/index.tsx` cited as the artifact demonstrating the absence, cross-referenced to §18 and §19, and none of the eight banned implemented-voice verbs applied to it
    - Carry `Table 11.1`, the workflow index with Implementation_Status. Place the first occurrence of `RC-05`
    - _Design: C1 §11 content plan_
    - _Requirements: 5.11, 5.22, 5.26, 17.3, 17.10, 17.12_

  - [ ] 6.4 Author §12 Detailed Use Cases
    - Write `UC-1` … `UC-24` exactly as the design's fixed set enumerates them, each with identifier, primary actor, preconditions, main flow, alternate flows and postconditions
    - The set is the same index that `Figure 10.5` renders, so any change here must be mirrored in task 9.2
    - Carry `Table 12.1`, the use-case index
    - _Design: C1 §12 content plan; C3 figure 10.5_
    - _Requirements: 5.12, 6.11_

- [ ] 7. Screenshot capture run

  The dev server is long-running: the **user** starts `npm run dev` manually and confirms `http://localhost:5173` is serving before any capture task runs. The agent drives the browser with Playwright, never the server. Default viewport 1440 px; rows marked mobile at 390 px. Output is lossless PNG written directly into `docs/srs/assets/` under the design's filename grammar. Exactly one Appendix D row per navigation.

  - [ ] 7.1 Provision the three Documentation_Accounts and bootstrap the first admin — local only
    - Create `docs-student@…`, `docs-organizer@…`, `docs-admin@…`. Their credentials never enter SRS_v2; every captured screen shows only their data, which is what satisfies PII exclusion without post-hoc redaction
    - Bootstrap the first admin out of band, **against the local Supabase instance only, never against a production or shared database**: as the database owner or under the service-role key, run `update public.profiles set role = 'admin' where email = '<docs-admin address>';`. This is the only step that runs outside RLS. The alternative is seeding through the Auth Admin API and applying the same update
    - Then promote the organizer account through the real product path — the account submits a role-change request, the admin resolves it via `approve_role_change_request` — which produces genuine data for D-26 rather than seeded data
    - Leave one additional role-change request pending, and one rejected, so D-26 shows all three statuses
    - This procedure is recorded in the Author_Process log and is **not** stated in SRS_v2 as a system capability; §3.4 states the absence of an in-application path instead
    - _Design: C4.2_
    - _Requirements: 9.6, 9.7_

  - [ ] 7.2 Verify the seed-data preconditions, including the foreign-key caveat
    - `supabase/migrations/20260819110000_seed_demo_data.sql` is idempotent — its guards are `where not exists (…)` — and supplies five events (four `draft`, one `published`: *Environmental Policy Symposium*, code `ENV-POL-2026-DEMO`, capacity 100, date 2026-09-14), five approvals (three pending, one approved, one rejected) and ten `platform_activity` rows
    - **Caveat to verify before capture:** the seed hard-codes three organizer profile UUIDs and one admin reviewer UUID created through the Auth Admin API *before* the migration ran. `events.organizer_id` and `approvals.reviewed_by` are real foreign keys into `profiles`, which references `auth.users`. Where those four auth users do not exist, the seed's inserts **fail on the foreign key rather than being skipped**
    - Confirm the four auth users exist. If they do not, either recreate them with the same UUIDs through the Auth Admin API or record `RC-16` as `Open` and mark the affected D-16 … D-28 rows accordingly
    - Confirm the per-screen preconditions in the design's C4.3 table before each session group runs
    - The seed's organizer names are fictional seed values, not real people, and need no redaction; record that judgement
    - _Design: C4.3_
    - _Requirements: 9.2, 9.5, 9.6_

  - [ ] 7.3 Capture the unauthenticated session group — D-01 … D-05
    - Confirm the user has started the dev server; do not start it from the agent
    - Capture `/pricing` (D-01), `/campuses` (D-02), `/signup` (D-03), `/forgot` (D-04) and `/login` at the desktop viewport (D-05), all at 1440 px, no sign-in
    - Confirm the two Available_Screenshot copies from task 1.1 are in place and their widths match their filenames
    - _Design: C4.1 capture order; C4.3_
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ] 7.4 Capture the student session group — D-06 … D-13, D-15
    - Sign in as `docs-student`. Capture `/profile` (D-06), `/student/dashboard` (D-07), `/student/explore` (D-08), `/student/explore/:eventId` against the seeded published event (D-09), `/student/events` (D-10) and `/student/scanner` (D-11)
    - D-11: grant Playwright the `camera` permission; if camera capture is unavailable, fall back to the manual-entry panel, which is the same screen
    - D-12 and D-13 are two frames of one deterministic two-step interaction: enter `ENV-POL-2026-DEMO` through the manual-code fallback to render the success state, then repeat the same action immediately so the insert violates `attendance_student_event_unique`, Postgres returns `23505` and the duplicate state renders. No image manipulation, no fabricated data
    - D-15 `/student/notifications` is populated automatically by the AFTER trigger fired during D-12
    - _Design: C4.1; C4.3_
    - _Requirements: 9.1, 9.3, 9.4, 9.6, 9.8_

  - [ ]* 7.5 Capture D-14 `/student/certificates`
    - Optional: execute only if the data precondition can be met. It needs at least one `certificates` row for the student, which needs a certificate issued through `POST /api/certificates/generate` against a template carrying a non-blank `background_image_url`, with the certificate-service reachable
    - If no such template exists locally, do **not** capture: mark the Appendix D row `Not captured`, add an RC entry naming the screen, the blocking precondition and the party who can supply it, and leave no placeholder image and no dangling reference
    - _Design: C4.3 D-14; C4.4 failure path_
    - _Requirements: 9.5, 9.9_

  - [ ] 7.6 Capture the organizer session group — D-16 … D-22
    - Sign in as the promoted `docs-organizer` account. Create one owned event as `draft` so the organizer screens have data
    - Capture `/organizer/dashboard` (D-16), `/organizer/events` (D-17), `/organizer/events/create` (D-18), `/organizer/qr` (D-19), `/organizer/attendees` (D-20), `/organizer/analytics` (D-21), `/organizer/certificates` (D-22)
    - D-20 shows residual mock data; capture as rendered and record it as the observed state feeding `TBD-4` and a limitations row. Do not edit the image to hide it
    - _Design: C4.1; C4.3_
    - _Requirements: 9.1, 9.3, 9.4, 9.8_

  - [ ] 7.7 Capture the admin session group — D-23 … D-26, D-28
    - Sign in as `docs-admin`. Capture `/admin/dashboard` (D-23), `/admin/approvals` (D-24), `/admin/users` (D-25, needs ≥3 profiles — the three Documentation_Accounts satisfy it), `/admin/role-requests` (D-26, showing the pending/approved/rejected rows produced by task 7.1) and the three screens of D-28 (`/admin/analytics`, `/admin/settings`, `/admin/notifications`)
    - _Design: C4.1; C4.3_
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ]* 7.8 Capture D-27 `/admin/templates`
    - Optional: execute only if a `certificate_templates` row can be created as admin through `/admin/templates`. The screen is capturable while empty, in which case the empty state is documented as such
    - If template creation fails, mark the row `Not captured`, add an RC entry naming the screen, the blocking precondition and the confirming party, and leave no placeholder
    - _Design: C4.3 D-27; C4.4 failure path_
    - _Requirements: 9.5, 9.9_

  - [ ] 7.9 Write the screenshot inventory rows from the capture run
    - Populate `Table RC.4` with the design's C4.4 column set: row id · screen name · route path as declared in the route table · role required · data precondition · viewport width · image file name · capture date · displaying section · captured flag · RC identifier where not captured
    - Metadata is recorded at the moment of capture so it cannot drift from the image. Restrict post-capture editing to cropping, scaling and opaque redaction — nothing else
    - Every row resolves to exactly one Screenshot artifact or exactly one RC entry
    - _Design: C4.4_
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6, 9.8, 9.9_

- [ ] 8. Author §9 User Interface Requirements

  - [ ] 8.1 Author §9.1 screen inventory and route resolution
    - State the enumerated leaf route set read from `src/app/routes/index.tsx` in full, the count 33 leaf paths excluding the catch-all, the two parameterised variants that render the same component as a sibling path, the resulting 31 distinct screens, and the three layout paths that render `RoleGuard` and no screen
    - Record the discrepancy against the previously stated 25 and carry the `RC-13` inline marker here, its first occurrence
    - State that RTM screen resolution binds to the enumerated set, not to any count
    - _Design: C1 §9 content plan_
    - _Requirements: 5.9, 11.6, 3.1_

  - [ ] 8.2 Author §9.2–§9.5 per-screen requirements and place the Screenshot artifacts
    - One block per major screen across public, student, organizer and admin groups, stating purpose and functionality
    - Place the Screenshot artifacts produced by task 7, each with a 3–25-word caption beginning with its identifier, at least two sentences and 30 words of explanatory prose within one page, and at least one verbatim body-prose reference
    - Reference every image relatively from the master (`assets/…`); no absolute path, no external URL
    - Depict no capability classified `Planned`
    - _Design: C1 §9 content plan; C1 asset layout_
    - _Requirements: 5.9, 6.4, 6.5, 6.9, 13.3, 17.16_

  - [ ] 8.3 Author §9.6 input-field validation grid and §9.7 screenshot metadata
    - Build `Table 9.2` from the real rules the design names: six-digit OTP with distinct expired-code and rate-limit handling; `capacity >= 0`; the four-value status enum; the three-value `location_type` enum; the QR payload `fieldbook:attendance:{EVENT_CODE}` with a bare-event-code fallback; the `@NotBlank` set on `CertificateRequest` (`studentName`, `eventTitle`, `templateId`, `certificateCode`) with `eventId` and `studentId` nullable
    - Build `Table 9.3` screenshot metadata as the in-section view of the inventory from task 7.9, and place the `RC-16` first occurrence in §9.7
    - Carry `Table 9.1` screen index
    - _Design: C1 §9 content plan_
    - _Requirements: 5.9, 5.13, 6.11, 9.4_

- [ ] 9. Author §10 System Diagrams

  - [ ] 9.1 Fix the label lexicon and author §10.1 diagram conventions
    - Fix the cross-figure label lexicon before any figure is drawn: `Student`, `Organizer`, `Admin`, `Field Book SPA`, `Supabase Auth`, `Supabase Postgres`, `Supabase Storage`, `Google OAuth`, `Render`, `Vercel`, `certificate-service`, and table names exactly as declared. Every element appearing in more than one figure uses identical label text in every figure and in body prose
    - State the convention for planned elements: dashed border plus the suffix ` (Planned)` in the node label, with the caption naming the element, its Implementation_Status and the visual treatment
    - _Design: C3 label lexicon_
    - _Requirements: 8.8, 17.14, 17.15_

  - [ ] 9.2 Author Figures 10.1–10.7
    - `10.1` system architecture, `10.2` context, `10.3` DFD level 0, `10.4` DFD level 1, `10.5` use case, `10.6` ER, `10.7` class, using the element and edge sets the design's C3 table fixes for each, and the C3.1 / C3.2 skeletons where given
    - `10.2` labels three actors and six external systems and carries an Evidence_Citation for each labelled external system
    - `10.4` and `10.5` are the only two figures carrying a planned element, both for certificate verification, drawn dashed with the `(Planned)` suffix
    - `10.5` and `10.6` substitute a Mermaid `flowchart` where Mermaid has no native notation; the caption states the family and the substitution. `10.6` is an `erDiagram` restricted to the tables, columns and relationships declared in the 16 migrations, with cardinality derived from FK nullability, and a caption stating that `attendance` and `registrations` share the `(student_id, event_id)` shape without referencing each other and that `certificates` carries no reference to `attendance`
    - `10.7` is a `classDiagram` restricted to types declared under `certificate-service/src/main/java/` and exported from `src/lib/`
    - _Design: C3; C3.1; C3.2_
    - _Requirements: 5.10, 8.1, 8.2, 8.3, 8.4, 8.5, 8.7, 8.10, 17.14, 17.15_

  - [ ] 9.3 Author Figures 10.8–10.13
    - `10.8`, `10.9`, `10.10` as `sequenceDiagram` from the C3.3 skeletons. The `10.10` caption must state the non-atomicity: two separate PostgREST calls with no wrapping transaction, so a failure between them leaves a published event with a pending approval
    - `10.11` and `10.12` as `flowchart` activity substitutions with the decision diamonds the design names, captions declaring the substitution
    - `10.13` deployment, restricted to hosts, services and environment-variable **names** declared in `vercel.json`, `render.yaml`, `certificate-service/Dockerfile` and `.github/workflows/`, with no variable values. Label hosts by role rather than hostname so the figure does not have to settle `RC-07`
    - _Design: C3; C3.3_
    - _Requirements: 5.10, 8.1, 8.2, 8.3, 8.6, 8.8_

  - [ ] 9.4 Verify all 13 figures render in the Markdown output and record the per-figure result
    - Render the master and record a rendered / not-rendered result for each of the 13 figures in the `RC-03` register entry, per figure, before the diagrams section is treated as complete
    - _Design: Error Handling — Mermaid figure does not render_
    - _Requirements: 13.5, 13.6_

  - [ ]* 9.5 Export any failing figure to a static image asset
    - Optional: execute only for figures that task 9.4 records as not rendered
    - Export from the same Mermaid source to `docs/srs/assets/figure-C<nn>-<slug>.svg`, reference it relatively, retain the Mermaid source in the master, and state the image format in that figure's caption
    - _Design: C1 diagram export filename grammar_
    - _Requirements: 8.9, 13.7_

- [ ] 10. Author §15 Code Listings

  - [ ] 10.1 Extract the seven React and TypeScript listings — `Listing 15.1` … `Listing 15.7`
    - Follow the C5 extraction plan per listing: file, symbol or region, elision decision and redaction tokens. Reproduce character-for-character from the pinned revision recorded in task 1.3
    - Apply the elision rule: any source over 60 lines yields 10–60 lines, each omission marked with a single `…` line, every omitted range stated as first and last line number in the caption
    - Each caption states the repository-relative path, the reproduced range and at least one SRS_v2 requirement identifier the code implements
    - _Design: C5_
    - _Requirements: 10.1, 10.4, 10.5, 10.6, 10.7, 2.4, 6.7_

  - [ ] 10.2 Extract the eight SQL listings — `Listing 15.8` … `Listing 15.15`
    - Same rules as 10.1, each drawn from a distinct file under `supabase/migrations/`, per the C5 plan's region selections including the nine `events` policies in `15.9` and `approve_role_change_request` in full in `15.13`
    - _Design: C5_
    - _Requirements: 10.2, 10.4, 10.5, 10.7, 2.4_

  - [ ] 10.3 Extract the seven Java-tier listings — `Listing 15.16` … `Listing 15.22`
    - Same rules as 10.1. `Listing 15.22` follows the decision recorded in task 3.1: `certificate-service/pom.xml` by default, or `config/SupabaseConfig.java` if the user chose strict adherence to `certificate-service/src/main/java/`
    - Group all 22 listings under the three tier headings matching Appendix E's grouping, numbered 1 through 22 with no duplicate and no gap
    - _Design: C5; C5 departure 1_
    - _Requirements: 10.3, 10.4, 10.5, 10.7, 10.8_

  - [ ] 10.4 Build the listing inventory and run the credential scan
    - Populate `Table RC.5`: number · tier · path · reproduced range · omitted ranges · redaction tokens used · requirement identifiers · revision. Record both departures from Appendix E so the change is visible
    - Scan every fenced listing body for JWT-shaped tokens, `service_role` and `sb_` key literals, Supabase project-reference hosts and deploy-hook URLs. Zero matches required. Confirm no listing cites `.env.local` at the repository root or under `certificate-service/`
    - Run this scan **before** any commit that adds a listing; a leak is unrecoverable after publication
    - _Design: C5 redaction tokens; Property 5_
    - _Requirements: 10.6, 10.9, 10.10_

- [ ] 11. Checkpoint — artifacts, citations and listings verified
  - Run gate G2 (artifact completeness) over §3–§15, gate G4 (citation resolution) document-wide so far, and gate G6 (listing integrity: 22 clean diffs against the pinned revision, zero credential literals, tier counts 7/8/7). Ensure all checks pass, ask the user if questions arise.

- [ ] 12. Author §6 and §7 — the requirement sections that depend on everything above

  - [ ] 12.1 Author §6.1–§6.4 and the Identifier_Continuity_Table
    - Write the requirement format subsection, then the 41 legacy blocks — `REQ-1`…`REQ-32`, `BR-1`…`BR-6`, `TBD-1`…`TBD-3` — each with identifier, statement, acting role, data object, Implementation_Status, evidence or absence statement
    - Build `Table RC.2` with the design's C2.1 column set. Transcribe SRS_v1 subjects from the user-supplied attachment only. Where exact wording cannot be read, record `Not recoverable`, state the subject at the granularity that is recoverable, and carry a marker naming the author team — **do not reconstruct v1 wording by inference**. Allocate `RC-17` only if this occurs
    - Cross-check the nine-subject anchor set against the attachment before treating the table as complete; any disagreement is a transcription error to resolve first
    - Where the repository contradicts a legacy clause, retain the identifier, correct only the contradicted clause, and add the revision-history row required by task 14.3
    - _Design: C2.1; C2.4_
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.9, 5.4, 17.3, 17.4, 17.5, 17.6, 17.11_

  - [ ] 12.2 Author §6.5–§6.7, the new requirement blocks
    - Write `REQ-33`…`REQ-60`, `BR-7`…`BR-16` and `TBD-4`…`TBD-8` exactly as the design's C2.2 tables allocate them, contiguous within each series with no skipped value, and no Legacy_Requirement_ID applied to a new requirement
    - `REQ-58`, `REQ-59` and `BR-15` are `Partially Implemented` while their migrations are unapplied; `REQ-60` is `Planned`. None of these three intended behaviours is stated in the implemented voice
    - Every `Planned` item is stated in future or conditional voice, excluded from the implemented set, presented in §19, and cross-referenced from its §6 block
    - _Design: C2.2; C2.3; C2.4_
    - _Requirements: 4.3, 4.4, 5.4, 17.6, 17.10, 17.11, 17.13, 18.7, 19.8_

  - [ ] 12.3 Author §6.8 the Implementation_Status_Table
    - Build `Table 6.2` with the design's columns — Requirement · Series · Subject · Implementation_Status · Rule — one row per identifier, with the rule column recording `R1`, `R2`, `R3` or `R4` so each assignment is auditable rather than asserted
    - Append the count block as rows of the same table so it remains one artifact, with a total of 84 equal to the row count
    - Apply the C2.4 outcomes explicitly: verification-subject legacy identifiers `Planned`; phantom-column and phantom-status identifiers `Planned` with the clause corrected and the capability moved to §19; the performance, availability and accessibility identifiers `Partially Implemented` under R2, not `Planned`; `REQ-49` and `REQ-55` `Partially Implemented` under R2
    - _Design: C1 Implementation_Status label placement; C2.4_
    - _Requirements: 17.1, 17.2, 17.7, 17.12, 6.11_

  - [ ] 12.4 Author §7 Non-Functional Requirements
    - Write 7.1–7.7. Build `Table 7.2` with the six carried-forward figures — FCP 1.5 s, QR decode < 250 ms, check-in < 2 s, PDF generation < 8 s, availability 99.0 %, WCAG 2.1 AA — each with the figure as published in SRS_v1, the status `Unmeasured`, the measurement method and the RC identifier
    - Performance methods state the observed quantity, at least 10 observations, the reported statistic and the environment. The availability method states the observation window, sampling interval, unavailable-sample definition and the arithmetic
    - State that the repository contains no benchmark artifact, no accessibility tooling and no availability series, and that `.github/workflows/keep-alive.yml` issues a health request every 10 minutes and retains no result
    - State that full accessibility conformance validation requires manual testing with assistive technologies and expert accessibility review, and that neither was performed. Restate any SRS_v1 conformance assertion as unvalidated design intent with a marker
    - Carry `Table 7.1`. Place first occurrences of `RC-11` and `RC-12`
    - _Design: C1 §7 content plan_
    - _Requirements: 5.5, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 2.6_

- [ ] 13. Author §16, §18 and §19

  - [ ] 13.1 Author §16 Testing Requirements
    - Write 16.1 strategy, 16.2 existing gates, 16.3 test cases, 16.4 reporting note
    - 16.2 states `npm run typecheck` running `tsc -b --force` gated by `.github/workflows/frontend-typecheck.yml`, `spring-boot-starter-test` in `certificate-service`, and the absence of any frontend runner, naming vitest, jest, playwright and testing-library — each as an available or absent capability with no execution outcome
    - Build `Table 16.2` with `TC-01` … `TC-17` exactly as the design's test-case set fixes them, each with a unique identifier, a 1–2 sentence objective, at least one precondition, 2–10 numbered steps, exactly one expected result, at least one resolving requirement identifier, and the literal `Not executed` in the Execution_Status cell
    - Keep `TC-14` (current organizer self-publish behaviour, recorded as the documented defect) and `TC-15` (the intended gate after Migration A) as separate rows. Both carry `Not executed`
    - 16.4 states that the document reports test intent only, reports no execution results, and that every Execution_Status value holds as of the document version date
    - Assert no pass, fail, pass rate, defect count or coverage figure anywhere
    - _Design: Testing Strategy; C1 §16 content plan_
    - _Requirements: 5.16, 12.1, 12.2, 12.3, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

  - [ ] 13.2 Author §18 Limitations
    - Build `Table 18.1` with the design's enumerated row set, each row stating identifier, limitation, impact on system use, evidence, enforcement layer and RC identifier where one exists
    - Include every security weakness from Appendix A and Requirements 16.3–16.7, the absence of an in-application first-admin path from §3.4, the two non-atomic multi-write paths, the residual mock data, the certificate-verification absence, and the absence of accessibility tooling, a benchmark harness and an availability series as **three separate entries**
    - _Design: C1 §18 content plan_
    - _Requirements: 5.18, 15.8, 16.9, 16.10_

  - [ ] 13.3 Author §19 Future Enhancements
    - Build `Table 19.1`, one row per enhancement with rationale, covering every Appendix A.1 finding — public certificate verification, a certificate integrity hash, a database-level attendance-to-certificate link, the `pending_review` and `cancelled` lifecycle states, and the measured performance and accessibility programmes
    - Label each as not implemented in the repository. Every `Planned` identifier in §6 must cross-reference a row here
    - _Design: C1 §19 content plan_
    - _Requirements: 4.8, 4.9, 5.19, 17.11_

- [ ] 14. Author §21, §20, the front matter and Appendix RC

  - [ ] 14.1 Author §21 the Requirement Traceability Matrix
    - Build `Table 21.1` with 84 rows and the design's C6 columns: Requirement · Design section · Module · Screen · Test case · Status · Implementation_Status · Documenting section
    - Apply the fixed module-to-path mapping so no requirement resolves two ways. Resolve every screen against the enumerated leaf-path set from §9.1, or the literal `No screen`; every module to a path existing at the pinned revision, or the literal `No module`. Exact spellings: `No screen`, `No module`, capital N, no trailing period
    - `No module` implies `Unimplemented` in the status cell, `Planned` in the Implementation_Status cell, and a non-empty documenting-section cell
    - Every test-case identifier resolves to exactly one `Table 16.2` row; no cell is empty
    - _Design: C6_
    - _Requirements: 5.21, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10, 17.8, 17.9_

  - [ ] 14.2 Author §20 Conclusion
    - Prose only, introducing no factual claim absent from §1–§19, carrying no artifact and no new citation
    - Where a fact stated elsewhere is needed, cite the section number or requirement identifier rather than restating it
    - _Design: C1 §20 content plan_
    - _Requirements: 5.20, 7.4_

  - [ ] 14.3 Complete the front matter and author §1 and §2
    - §1 Introduction 1.1–1.7 and §2 Overall Description 2.1–2.6 per the design's content plans, including the objectives (≥3, numbered), the scope inclusions and the evidence-carrying exclusions, `Table 1.1` definitions, `Table 2.1` user classes and `Table 2.2` operating environment, with first occurrences of `RC-04` and `RC-06`
    - Complete the title page (title, `Version 2.0`, issue date, the three author names, the institution), the revision history table (two rows; the v2.0 row lists every Legacy_Requirement_ID whose wording was corrected in task 12.1, or states that none changed), and the reading-conventions block with the three Implementation_Status definitions verbatim
    - Complete the table of contents: one row per Appendix B row with section number, title and the start page from the render described in task 1.4
    - _Design: C1 front matter, §1, §2 content plans_
    - _Requirements: 5.1, 5.2, 5.25, 7.5, 7.6, 7.7, 17.1, 17.2, 4.5_

  - [ ] 14.4 Complete Appendix RC and the supporting registers
    - `Table RC.1` the RC_Register with all seven columns and the numbering-deviation header note; `Table RC.3` the Coverage_Checklist_Table with exactly 21 rows, one per mandated content area, each naming the satisfying section number
    - `Table RC.2` and `Table RC.4` and `Table RC.5` are carried from tasks 12.1, 7.9 and 10.4; verify they are present, keyed and complete here
    - Every register row whose status is `Open` carries at least one inline marker; every row that is `Confirmed` or `Refuted` carries none and holds its decision and date instead
    - _Design: C1 Appendix RC; Data Models_
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 5.23, 4.2, 9.1, 10.4_

- [ ] 15. Numbering pass

  - [ ] 15.1 Allocate every Numbered_Artifact sequence number in a single left-to-right pass
    - The design defers sequence allocation until the body is complete: draft text refers to artifacts by stable slug (`{{er-diagram}}`), and this pass rewrites every slug to its identifier
    - Number the four types independently within each section, each starting at 1 and incrementing by exactly 1 in order of first appearance, so a section may hold `Table 8.1`…`Table 8.14` and `Listing 8.1` without collision
    - Expected totals: 13 Figures, 51 Tables, 30 Screenshots, 22 Listings, adjusted for any row that task 7.5 or 7.8 routed to an RC entry
    - Update every body-prose reference in the same pass
    - _Design: C1 Numbered_Artifact identifier allocation_
    - _Requirements: 6.1, 6.2, 6.3, 6.9_

- [ ] 16. Run gates G1–G9

  - [ ] 16.1 G1 Evidence check — per section, then document-wide
    - Pass condition: every factual statement has been checked against the file its citation names; unsubstantiated statements are deleted or carry a marker with a register row. Includes the manual gate for quotation fidelity to the SRS_v1 attachment, which no automated check can cover
    - _Design: C8 gates; Properties deliberately not stated_
    - _Requirements: 2.9, 1.7, 2.10, 5.24_

  - [ ] 16.2 G2 Artifact completeness
    - Pass condition: every artifact has an identifier, a 3–25-word caption beginning with that identifier, at least 2 sentences and 30 words of explanatory prose within one page, and at least one verbatim body-prose reference. Anything failing is fixed or removed. Discharges Properties 2 and 3
    - _Requirements: 6.4, 6.5, 6.6, 6.9, 6.10_

  - [ ] 16.3 G3 Status agreement — per section, then document-wide
    - Pass condition: every requirement, workflow and module carries an Implementation_Status; the section value, the `Table 6.2` value and the RTM value are identical; the three per-value counts sum to the row count, which equals the RTM row count, which equals 84. Disagreements are resolved to the value the item's own evidence substantiates, not to the majority. Discharges Property 4
    - _Requirements: 17.3, 17.7, 17.8, 17.18, 17.19_

  - [ ] 16.4 G4 Citation resolution — document-wide
    - Pass condition: zero unresolved paths and zero invalid line ranges. Every citation is repository-relative with forward slashes, no drive letter, no absolute prefix, and carries a line range or symbol name where the cited file exceeds 100 lines. Discharges Property 1
    - _Requirements: 1.5, 1.6, 1.8, 6.7, 6.8, 10.10_

  - [ ] 16.5 G5 Screenshot reconciliation — after §9
    - Pass condition: every screenshot-inventory row resolves to exactly one Screenshot artifact or exactly one RC entry; the Screenshot count equals the count of rows not marked `Not captured`; every image reference is relative, resolves under `docs/srs/assets/`, and has an intrinsic pixel width equal to its row's stated viewport width; no dangling reference and no placeholder exists. Discharges Property 12
    - _Requirements: 9.3, 9.4, 9.5, 9.9, 13.2, 13.3_

  - [ ] 16.6 G6 Listing integrity — after §15
    - Pass condition: all 22 listings diff clean against the pinned revision, zero credential literals, tier counts 7/8/7, each listing from a distinct file within its tier. Discharges Property 5
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.9, 10.10, 2.4_

  - [ ] 16.7 G7 Vocabulary — document-wide
    - Pass condition: zero Reference_SRS domain terms (`expense`, `expenses`, `claim`, `claims`, `reimbursement`, `reimbursements`, `voucher`, `vouchers`, whole-word case-insensitive); zero test-outcome claims; zero maturity labels outside the three permitted values; no `Planned` capability stated in the implemented voice; the six phantom identifiers (`sha256_hash`, `pdf_storage_path`, `attendance_id`, `pending_review`, `attendances`, `audit_logs`) appear only inside the passages recording their absence; every unmeasured figure carries `Unmeasured` in the same sentence or table row. Discharges Properties 7, 10, 11 and 14
    - `claim` is the term most likely to leak through ordinary English usage, so run this scan repeatedly rather than once
    - _Requirements: 1.4, 12.9, 17.2, 17.10, 17.17, 5.26, 15.7, 2.2, 2.3_

  - [ ] 16.8 G8 Page budget — before delivery
    - Pass condition: each section's rendered length is within 80–125 % of its Appendix B allocation and the total is within 38–42 pages inclusive, measured with the five settings recorded in task 1.4
    - Remedy order if outside the band: delete duplicated content first, then add content sourced from SRS_v1 or the repository, then update the Page_Budget. **Never** adjust page size, margins, body font size or line spacing
    - _Requirements: 7.2, 7.3, 7.4, 7.8, 7.9_

  - [ ] 16.9 G9 Register closure — before delivery
    - Pass condition: every inline marker resolves to exactly one register row; every register row whose status is `Open` has at least one inline occurrence; every `Confirmed` or `Refuted` row has none. Discharges Properties 6 and 8
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 4.1, 4.3, 4.4, 11.1_

- [ ] 17. Checkpoint — document delivered
  - Confirm all nine gates pass and the master is complete. Ensure all checks pass, ask the user if questions arise.

- [ ] 18. Optional submission copy

  - [ ]* 18.1 Derive a non-Markdown submission copy from the Markdown master
    - Optional: execute only if the user asks for a `.docx` or PDF submission copy
    - Derive it from `docs/srs/field-book-srs-v2.0.md`, export every Mermaid diagram the requested format does not render to a static image asset under `docs/srs/assets/`, and leave the Markdown master and its authored diagram sources unchanged
    - _Requirements: 13.7, 13.8_

- [ ] 19. Corrective migration confirmation gate

  - [ ] 19.1 Obtain and record the user's explicit, dated confirmation for both corrective migrations
    - Both migrations are security-sensitive changes to live authorization. Present, for each: what it changes, the stated consequence, the rollback path, and the fact that verification runs against a **local** database only
    - For Migration A, present the consequence the design does not paper over: under the chosen single-policy form an organizer may set `status` only to `draft` and may update an owned event only while it is in `draft`. Confirm the `RC-14` answer from task 3.1 before choosing the final form
    - For Migration B, present the consequence that an admin who owns an event can no longer resolve that event's approval at all, so a second admin is required. Confirm the `RC-15` answer
    - Record the confirmation and its date in the Author_Process log and reproduce it in §14.6 and §14.7. **No task in 20, 21 or 22.2 starts until this record exists.** No migration is executed against any database while the confirmation is unrecorded
    - _Design: C7.3_
    - _Requirements: 18.10, 19.11_

- [ ] 20. Migration A — event publication gate — **BLOCKED pending explicit user confirmation (task 19.1)**

  - [ ] 20.1 **BLOCKED** — Create `supabase/migrations/20260908120000_events_status_publication_gate.sql`
    - Do not start until task 19.1's dated confirmation is recorded
    - Implement design (a): drop and recreate `events_update_own_organizer` `for update to authenticated using (organizer_id = auth.uid()) with check (organizer_id = auth.uid() and status = 'draft')`
    - Create a new file only. Change the text of no migration already present, including `20260816120000_rls_policies.sql`. The filename timestamp sorts after `20260907120000`
    - Header comment states the defect corrected, the requirement it discharges, and the stated consequence for organizer edits of non-draft events
    - _Design: C7.1_
    - _Requirements: 18.1, 18.2, 18.4, 18.5, 18.10_

  - [ ]* 20.2 **BLOCKED** — Create the two-policy variant of Migration A instead
    - Optional: execute **only** if the user decides an organizer may edit a non-draft event. It replaces task 20.1's single policy with `events_update_own_organizer_draft` and `events_update_own_organizer_live`
    - Note the trade the design records: the variant permits an organizer to move an owned event between `published` and `live`, which no repository code path does, so it exchanges a narrower edit restriction for a wider status permission
    - _Design: C7.1 variant_
    - _Requirements: 18.1, 18.2, 18.5, 18.10_

  - [ ] 20.3 **BLOCKED** — Create `supabase/migrations/20260908120001_events_status_publication_gate_rollback.sql`, held unapplied
    - Do not start until task 19.1's dated confirmation is recorded
    - Contains the drop-and-recreate restoring `events_update_own_organizer` to `with check (organizer_id = auth.uid())`
    - Header comment states plainly that applying it restores the defect. The file is created and held unapplied
    - _Design: C7.1 rollback_
    - _Requirements: 18.4, 18.10_

  - [ ] 20.4 **BLOCKED** — Apply Migration A to a local database and run the A-V sweep
    - Do not start until task 19.1's dated confirmation is recorded. Local database only
    - `A-V1` organizer owner sets an owned draft to `published` → rejected with a permission error
    - `A-V2` organizer owner sets `live` or `completed` → rejected
    - `A-V3` organizer owner updates `title`, `venue`, `capacity` on an owned draft → succeeds for every non-`status` column
    - `A-V4` organizer non-owner performs any update → rejected, as before
    - `A-V5` admin sets `status='published'` → succeeds under `events_update_admin`
    - `A-V6` admin runs `approveEventApproval` end to end through the app → event becomes `published`, approval becomes `approved`, activity row written. **This is the regression check that matters**
    - `A-V7` organizer creates an event and submits it for approval through the app → event inserted as `draft`, `approvals` row inserted
    - Also sweep the 16-cell role × ownership × target-status matrix (Property 15) and the column-wise organizer update sweep plus the two end-to-end flows (Property 16)
    - If any check fails: treat the migration as failed, specify a further corrective migration restoring the regressed capability, and do not record the intended behaviour as implemented
    - _Design: C7.1 verification; Properties 15, 16_
    - _Requirements: 18.8, 18.9, 18.10_

- [ ] 21. Migration B — admin self-approval guard — **BLOCKED pending explicit user confirmation (task 19.1)**

  - [ ] 21.1 **BLOCKED** — Create `supabase/migrations/20260908130000_role_change_self_approval_guard.sql`
    - Do not start until task 19.1's dated confirmation is recorded
    - `create or replace function public.approve_role_change_request` reproducing the existing body verbatim from `20260817120000_role_change_requests.sql` and inserting the self-approval guard **after the `for update` select and before the already-resolved check**, so the self-approval error takes precedence over "already resolved"
    - Raise with a SQLSTATE distinguishable from `42501`, `P0002` and `22023`. `P0001` is the design's default; `P0003` is the recorded alternative if the project prefers a code that cannot collide with an unrelated bare `raise`
    - Leave `reject_role_change_request` untouched: rejection is not privilege escalation and Requirement 19.6 requires the ability to reject any request to be preserved
    - Include the `approvals_update_admin` correction in the same migration: drop and recreate it with the `not exists` ownership exclusion in both `using` and `with check`
    - Create a new file only; change the text of no migration already present. Filename sorts after `20260907120000`
    - _Design: C7.2_
    - _Requirements: 19.1, 19.2, 19.4, 19.5, 19.6, 19.11_

  - [ ] 21.2 **BLOCKED** — Create `supabase/migrations/20260908130001_role_change_self_approval_guard_rollback.sql`, held unapplied
    - Do not start until task 19.1's dated confirmation is recorded
    - Contains a `create or replace` restoring the function without the guard and a drop-and-recreate restoring `approvals_update_admin` to `using (is_admin()) with check (is_admin())`
    - Header comment states that applying it reinstates both defects. The file is created and held unapplied
    - _Design: C7.2 rollback_
    - _Requirements: 19.5, 19.11_

  - [ ] 21.3 **BLOCKED** — Apply Migration B to a local database and run the B-V sweep
    - Do not start until task 19.1's dated confirmation is recorded. Local database only
    - `B-V1` admin approves a request whose `user_id` equals the caller → rejected with the new code; request `status` still `pending`; subject's `profiles.role` unchanged; no new `audit_log` row
    - `B-V2` admin approves a request whose `user_id` differs → approves; `profiles.role` updated to `requested_role`; `audit_log` row written
    - `B-V3` admin rejects any request, including their own → succeeds
    - `B-V4` admin selects from `role_change_requests` → returns every row
    - `B-V5` non-admin approves → rejected with `42501`, unchanged
    - `B-V6` admin approves a non-existent request id → rejected with `P0002`, unchanged
    - `B-V7` admin approves an already-resolved request → rejected with `22023`, unchanged
    - `B-V8` admin who does not own the event resolves an approval → succeeds
    - `B-V9` admin who owns the event resolves that event's approval → rejected by policy, zero rows updated, surfaced as an error by `approveEventApproval`
    - Also iterate the permitted `(current_role, requested_role)` pairs in both self-subject and cross-subject configurations, snapshotting the three state components before and after each call (Property 17), and assert the four rejection paths yield four distinct SQLSTATE values (Property 18)
    - If any check fails: treat the migration as failed, specify a further corrective migration restoring the regressed capability, and do not record the intended behaviour as implemented
    - _Design: C7.2 verification; Properties 17, 18_
    - _Requirements: 19.9, 19.10, 19.11, 19.2, 19.6_

- [ ] 22. Reconcile the document with the migration outcome

  - [ ] 22.1 Verify existing migrations are unchanged and the new files sort last
    - Run `git diff --name-status` over `supabase/migrations/`. It must report **additions only**: every file present before this work is byte-identical afterwards
    - Sort the resulting filename list and assert the four new files occupy the tail, all with timestamps after `20260907120000`. Discharges Property 19
    - _Requirements: 18.4, 19.5_

  - [ ] 22.2 **BLOCKED** — Update the document to the post-application state
    - Do not start until task 19.1's confirmation is recorded and tasks 20.4 and 21.3 have produced outcomes
    - Reproduce the confirmation record and its date in §14.6 and §14.7. Where a migration is applied and verified, restate the enforcement layer accordingly and re-derive the Implementation_Status for `REQ-58`, `REQ-59`, `REQ-60` and `BR-15` in the section block, in `Table 6.2` and in the RTM row so all three agree
    - Update `TC-15`, `TC-16` and `TC-17` Execution_Status cells only where a dated execution record exists, recording the observed outcome, the date in `YYYY-MM-DD` form and the command or workflow that produced it. Otherwise leave the literal `Not executed`
    - Where a verification check failed, keep the classification `Partially Implemented`, keep the intended behaviour out of the implemented voice, and record the further corrective migration specified by task 20.4 or 21.3
    - Re-run gates G3, G7 and G9 after the edit
    - _Design: C7.3; C8 gates_
    - _Requirements: 12.4, 17.13, 17.18, 17.19, 18.7, 18.9, 19.8, 19.10_

- [ ] 23. Final checkpoint
  - Confirm the master satisfies all nine gates after any post-migration edit, that no unresolved citation or dangling image reference remains, and that no migration ran without a recorded, dated confirmation. Ensure all checks pass, ask the user if questions arise.

---

## Notes

- Tasks marked `*` are optional: 7.5 (D-14 capture), 7.8 (D-27 capture), 9.5 (static-image export of failing Mermaid figures), 18.1 (non-Markdown submission copy), 20.2 (two-policy variant of Migration A). Each states the condition under which it runs.
- Tasks marked **BLOCKED** are gated on task 19.1's recorded, dated user confirmation: 20.1, 20.2, 20.3, 20.4, 21.1, 21.2, 21.3, 22.2. All four SQL files and both application runs fall inside this gate because they change live authorization (Requirements 18.10, 19.11).
- Task 2 is a factual correction to the spec documents, not a scope change: the route table declares 33 leaf paths excluding the catch-all, and the previously stated 25 is not borne out.
- The design carries no property-based-testing applicability: there is no pure function under test, the repository declares no frontend test runner, and every property's input space is a finite enumeration read out of the delivered artifacts. Properties 1–14 are discharged by the deterministic scans in tasks 16.1–16.9; Properties 15–19 by tasks 20.4, 21.3 and 22.1.
- Four obligations are recorded manual gates rather than checkable properties: quotation fidelity to the SRS_v1 attachment, absence of real-person PII inside a raster image, image provenance, and the per-section self-check having been performed.
- `npm run dev` is long-running. The user starts it manually; the agent never blocks on it.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0,  "tasks": ["1.1"] },
    { "id": 1,  "tasks": ["1.2"] },
    { "id": 2,  "tasks": ["1.3"] },
    { "id": 3,  "tasks": ["1.4", "2.1"] },
    { "id": 4,  "tasks": ["2.2", "3.1"] },
    { "id": 5,  "tasks": ["3.2"] },
    { "id": 6,  "tasks": ["4.1"] },
    { "id": 7,  "tasks": ["4.2"] },
    { "id": 8,  "tasks": ["4.3"] },
    { "id": 9,  "tasks": ["4.4"] },
    { "id": 10, "tasks": ["4.5"] },
    { "id": 11, "tasks": ["6.1"] },
    { "id": 12, "tasks": ["6.2"] },
    { "id": 13, "tasks": ["6.3"] },
    { "id": 14, "tasks": ["6.4"] },
    { "id": 15, "tasks": ["7.1"] },
    { "id": 16, "tasks": ["7.2"] },
    { "id": 17, "tasks": ["7.3"] },
    { "id": 18, "tasks": ["7.4"] },
    { "id": 19, "tasks": ["7.5"] },
    { "id": 20, "tasks": ["7.6"] },
    { "id": 21, "tasks": ["7.7"] },
    { "id": 22, "tasks": ["7.8"] },
    { "id": 23, "tasks": ["7.9"] },
    { "id": 24, "tasks": ["8.1"] },
    { "id": 25, "tasks": ["8.2"] },
    { "id": 26, "tasks": ["8.3"] },
    { "id": 27, "tasks": ["9.1"] },
    { "id": 28, "tasks": ["9.2"] },
    { "id": 29, "tasks": ["9.3"] },
    { "id": 30, "tasks": ["9.4"] },
    { "id": 31, "tasks": ["9.5"] },
    { "id": 32, "tasks": ["10.1"] },
    { "id": 33, "tasks": ["10.2"] },
    { "id": 34, "tasks": ["10.3"] },
    { "id": 35, "tasks": ["10.4"] },
    { "id": 36, "tasks": ["12.1"] },
    { "id": 37, "tasks": ["12.2"] },
    { "id": 38, "tasks": ["12.3"] },
    { "id": 39, "tasks": ["12.4"] },
    { "id": 40, "tasks": ["13.1"] },
    { "id": 41, "tasks": ["13.2"] },
    { "id": 42, "tasks": ["13.3"] },
    { "id": 43, "tasks": ["14.1"] },
    { "id": 44, "tasks": ["14.2"] },
    { "id": 45, "tasks": ["14.3"] },
    { "id": 46, "tasks": ["14.4"] },
    { "id": 47, "tasks": ["15.1"] },
    { "id": 48, "tasks": ["16.1"] },
    { "id": 49, "tasks": ["16.2"] },
    { "id": 50, "tasks": ["16.3"] },
    { "id": 51, "tasks": ["16.4"] },
    { "id": 52, "tasks": ["16.5"] },
    { "id": 53, "tasks": ["16.6"] },
    { "id": 54, "tasks": ["16.7"] },
    { "id": 55, "tasks": ["16.8"] },
    { "id": 56, "tasks": ["16.9"] },
    { "id": 57, "tasks": ["18.1", "19.1"] },
    { "id": 58, "tasks": ["20.1", "21.1"] },
    { "id": 59, "tasks": ["20.3", "21.2"] },
    { "id": 60, "tasks": ["20.2"] },
    { "id": 61, "tasks": ["20.4"] },
    { "id": 62, "tasks": ["21.3"] },
    { "id": 63, "tasks": ["22.1"] },
    { "id": 64, "tasks": ["22.2"] }
  ]
}
```
