# Requirements Document

## Introduction

This specification defines the deliverable **Field Book SRS v2.0** — a professional, detailed, approximately 40-page academic Software Requirements Specification for the Field Book platform, produced by upgrading the existing 13-page IEEE 830-1998-style SRS v1.0 (dated 10 September 2026; authors Prince, Nandini Mehta, Mahi Agrawal; Poornima Institute of Engineering & Technology, Jaipur).

The primary product of this spec is **a document**. The SRS v2.0 describes the system as it actually exists in the repository at the time of authoring. No existing Field Book source file, migration, or configuration is edited by this work.

Requirements 18 and 19 are the one qualification to that. They **specify** two corrective forward migrations that close the organizer self-publish defect and the admin self-approval defect. Specifying them is in scope here; creating and applying them is not part of the document-authoring activity, is gated on the user's explicit confirmation recorded before execution, and never takes the form of an edit to a migration file already present in the repository. Until those migrations are applied, SRS v2.0 documents the present behaviour as a defect and classifies both controls `Partially Implemented`.

Two source classes govern the work and are strictly asymmetric:

- **Authoritative sources** — the existing SRS v1.0 and the actual Field Book repository. Every factual statement in SRS v2.0 traces to one of these.
- **Reference-only source** — the supplied ~40-page "Expense Management System" college SRS. Used exclusively for structure, section depth, and presentation conventions. None of its content, domain, features, tables, diagrams, or wording enters SRS v2.0.

A repository investigation has already been performed against all 16 SQL migrations, the `certificate-service` Spring Boot module, the frontend route table and service layer, the CI workflows, and the deployment descriptors. That investigation produced the five up-front review deliverables the user requested, which are attached as **Appendix A** (gap analysis), **Appendix B** (page structure), **Appendix C** (diagram list), **Appendix D** (screenshot list), and **Appendix E** (code-listing list). **Appendix F** holds the Requires-Confirmation register.

Appendix A contains material factual corrections to SRS v1.0 — including claims about a public verification route, three `certificates` columns, the event status enumeration, two table names, the Spring Boot major version, and the enforceability of self-approval prevention. The user has now ruled on the decisions those corrections raised:

- **Output format and location decided.** SRS_v2 is authored as a single Markdown master at `docs/srs/field-book-srs-v2.0.md` with every image asset under `docs/srs/assets/`. RC-03 is closed as `Confirmed`.
- **SRS v1.0 is available.** The user supplied SRS v1.0 as a document attachment to the authoring conversation, so its full text — including REQ-1 … REQ-32, BR-1 … BR-6 and TBD-1 … TBD-3 verbatim — is available to the Author_Process even though the document is not stored in the Repository. RC-01 and RC-02 are closed as `Confirmed`.
- **Certificate verification is planned, not implemented.** The `/verify/:id` route does not exist and the workflow is future functionality. RC-08 is closed as `Confirmed`.
- **The organizer self-publish path and the missing admin self-approval guard are defects, not intended behaviour.** RC-09 and RC-10 are closed as `Refuted`. The intended behaviour is that only admin approval publishes an event, and that an admin cannot approve a role-change request concerning that same admin. Requirement 18 and Requirement 19 specify those corrections as new forward migrations.

Because the system contains implemented, partially implemented and planned functionality in the same feature set, Requirement 17 establishes a mandatory three-value implementation-maturity classification so that SRS_v2 never presents planned functionality as implemented.

---

## Glossary

- **SRS_v1**: The existing 13-page Field Book Software Requirements Specification, version 1.0, dated 10 September 2026. An authoritative source, supplied by the user as a document attachment to the authoring conversation and not stored as a file in the Repository. The supplied attachment is the authoritative rendering of SRS_v1 — see Appendix F, RC-01 and RC-02, both `Confirmed`.
- **SRS_v2**: The upgraded ~40-page Field Book Software Requirements Specification produced by this spec. The deliverable.
- **Repository**: The Field Book source repository rooted at the workspace directory, comprising `src/`, `certificate-service/`, `supabase/migrations/`, `.github/workflows/`, and root-level configuration and documentation files. An authoritative source.
- **Reference_SRS**: The supplied ~40-page "Expense Management System" college SRS. A structure-and-presentation reference only.
- **Author_Process**: The human-plus-agent authoring activity that produces SRS_v2 and its supporting artifacts.
- **Evidence_Citation**: A repository-relative file path, optionally with a line range or symbol name, attached to a factual claim in SRS_v2 to identify the artifact that substantiates that claim. Example: `supabase/migrations/20260819120000_attendance.sql`.
- **Requires_Confirmation_Marker**: The literal inline text `[Requires Confirmation]` placed immediately after a statement in SRS_v2 whose truth the Author_Process could not establish from the Repository.
- **RC_Register**: The consolidated appendix table in SRS_v2 listing every Requires_Confirmation_Marker with an identifier, the unverifiable statement, the reason verification failed, and the party who can confirm the statement.
- **Legacy_Requirement_ID**: Any requirement identifier already published in SRS_v1, specifically REQ-1 through REQ-32, BR-1 through BR-6, and TBD-1 through TBD-3.
- **New_Requirement_ID**: A requirement identifier introduced for the first time in SRS_v2, allocated from ranges that begin above the highest Legacy_Requirement_ID in each series (REQ-33 upward, BR-7 upward, TBD-4 upward).
- **Identifier_Continuity_Table**: The table required by Requirement 4 mapping each Legacy_Requirement_ID to its SRS_v1 subject and its SRS_v2 subject.
- **Supabase_Database**: The PostgreSQL database of the Supabase project whose schema is defined by the migration files under `supabase/migrations/`, including its tables, row-level security policies, functions, and triggers. The tier addressed by Requirements 18 and 19.
- **Implementation_Status**: The maturity classification carried by a functional requirement, a workflow, or a module in SRS_v2, whose value is exactly one of `Implemented`, `Partially Implemented`, or `Planned`, as defined in Requirement 17.
- **Implementation_Status_Table**: The single summary table in SRS_v2 required by Requirement 17 that lists every requirement identifier against its Implementation_Status value together with a count of identifiers per status value.
- **Corrective_Migration**: A new SQL file added under `supabase/migrations/` whose filename timestamp is later than every migration file already present, created to change database behaviour that an earlier applied migration established, and which never alters the text of an already-applied migration file.
- **Numbered_Artifact**: Any figure, diagram, table, screenshot, or code listing appearing in SRS_v2.
- **RTM**: The Requirement Traceability Matrix section of SRS_v2, mapping each requirement to its design section, module, screen, and test case identifiers.
- **Coverage_Checklist_Table**: The twenty-one-row table required by Requirement 5 mapping each mandated content area to the SRS_v2 section that satisfies it.
- **Test_Case_Table**: A table in SRS_v2 that specifies test case identifier, objective, precondition, steps, and expected result for a requirement.
- **Execution_Status_Column**: The column of a Test_Case_Table that records whether a test case has been executed and what the observed outcome was.
- **Available_Screenshot**: A raster image already committed in the Repository that depicts a Field Book screen. Two exist: `fieldbook-homepage.png` and `fieldbook-login-mobile-390.png`.
- **Capture_Required_Screenshot**: A Field Book screen that SRS_v2 must depict but for which no Available_Screenshot exists, and which therefore must be newly captured from a running instance of the application.
- **Documentation_Account**: A non-production Field Book account created solely to capture screenshots, whose credentials never appear in SRS_v2.
- **Page_Budget**: The per-section estimated page allocation for SRS_v2, defined in Appendix B, whose total falls within the band 38 to 42 pages inclusive.
- **Mermaid**: The text-based diagram syntax used for diagrams in SRS_v2 whose structure Mermaid can express.

---

## Requirements

### Requirement 1: Sourcing discipline and source-of-truth precedence

**User Story:** As the SRS author, I want every statement in the upgraded document anchored to the existing SRS or the actual repository, so that the submitted document survives academic and technical scrutiny.

#### Acceptance Criteria

1. THE Author_Process SHALL derive every statement of fact in SRS_v2 concerning the Field Book system — including behaviour, database objects, interfaces, screens, routes, workflows, configuration values, and numeric quantities — from SRS_v1 or from the Repository, and SHALL treat the Repository as the higher-precedence source wherever both sources address the same subject.
2. IF a statement in SRS_v1 conflicts with the Repository, THEN THE Author_Process SHALL adopt the Repository content as the corresponding SRS_v2 statement and SHALL record one row in the Appendix A conflict table stating the SRS_v1 claim, the contradicting Repository finding, and at least one Evidence_Citation.
3. THE Author_Process SHALL use the Reference_SRS solely to determine section ordering, section depth expressed as the Page_Budget allocated to each section, and presentation conventions comprising heading numbering, artifact captioning, and table layout for SRS_v2.
4. THE Author_Process SHALL exclude from SRS_v2 every sentence, phrase, table row, table heading, diagram element, figure, and domain term that originates in the Reference_SRS, such that SRS_v2 contains zero occurrences of Reference_SRS domain vocabulary including the terms expense, claim, reimbursement, and voucher.
5. WHEN a statement in SRS_v2 describes a database object, an API contract, a screen, a route, a workflow, or a configuration value, THE Author_Process SHALL attach an Evidence_Citation to that statement at its first occurrence within the section, naming the Repository file that substantiates the description, and SHALL include a line range or symbol name in that Evidence_Citation where the cited file exceeds 100 lines.
6. THE Author_Process SHALL express each Evidence_Citation as a path relative to the Repository root using forward-slash separators, containing no absolute path prefix and no drive letter, with any line range expressed as the cited path followed by a start line number and an end line number.
7. IF neither SRS_v1 nor the Repository substantiates a statement, THEN THE Author_Process SHALL exclude that statement from SRS_v2 unless the statement carries a Requires_Confirmation_Marker, and SHALL exclude the statement from every summary, table, and diagram that presents established fact.
8. IF an Evidence_Citation does not resolve to a file present in the Repository at authoring time, THEN THE Author_Process SHALL correct the citation or remove the statement that the citation supports before delivering SRS_v2, so that the delivered SRS_v2 contains zero unresolved Evidence_Citations.
9. IF SRS_v1 states a configuration value, expiry period, quota, or hosted-platform setting that is held outside the Repository, THEN THE Author_Process SHALL classify the statement as unverifiable rather than as a conflict, SHALL record the statement as an RC_Register entry naming the party able to confirm it, and SHALL exclude the statement from the Appendix A conflict table.
10. THE Author_Process SHALL treat the user-supplied SRS v1.0 document attachment as the authoritative rendering of SRS_v1 for every purpose in this specification — including the verbatim wording of REQ-1 through REQ-32, BR-1 through BR-6, and TBD-1 through TBD-3, the Identifier_Continuity_Table, and the revision-history table — SHALL quote SRS_v1 wording only from that attachment, and SHALL continue to treat the Repository as the higher-precedence source wherever the attachment and the Repository address the same subject.
11. WHERE a statement is drawn from SRS_v1 rather than from the Repository, THE Author_Process SHALL identify SRS_v1 as the source of that statement in place of an Evidence_Citation, and SHALL NOT present a Repository-relative path as the source of a statement that only SRS_v1 substantiates.

### Requirement 2: Prohibition on fabricated content

**User Story:** As the SRS author, I want a hard prohibition on invented content, so that no examiner can find a claim in the document that the repository contradicts.

#### Acceptance Criteria

1. THE Author_Process SHALL restrict SRS_v2 feature descriptions to behaviour that at least one Repository file expresses, and SHALL attach to each feature description an Evidence_Citation naming that file.
2. THE Author_Process SHALL restrict SRS_v2 database documentation to the tables, columns, keys, constraints, indexes, policies, triggers, functions, views, and storage buckets that exist after all files in `supabase/migrations/` are applied in ascending filename order, and SHALL exclude any object that a later migration drops or renames.
3. THE Author_Process SHALL restrict SRS_v2 API documentation to the endpoints, request fields, response fields, and status codes declared in the controller, DTO, and exception-handler sources under `certificate-service/src/main/java/`.
4. THE Author_Process SHALL reproduce every SRS_v2 code listing character-for-character from the cited Repository file, with the sole permitted departures being marked elisions and marked redactions of secret values, each of which SHALL be identified in the caption of that listing.
5. THE Author_Process SHALL restrict every SRS_v2 screenshot to an Available_Screenshot or to an image captured from a running instance of the Field Book application, and SHALL restrict post-capture editing of that image to cropping, scaling, and redaction of personally identifying data.
6. IF a numeric performance figure, availability figure, or conformance level has no Repository file recording an observed measurement of that figure, THEN THE Author_Process SHALL present that figure in SRS_v2 as a stated target and SHALL place, in the same sentence or the same table row as the figure, a statement that the figure is unmeasured.
7. THE Author_Process SHALL exclude from SRS_v2 every synthesized, mocked, illustrative, placeholder, wireframe, and generated screenshot, and every image whose origin is neither an Available_Screenshot nor a capture from a running instance of the Field Book application.
8. THE Author_Process SHALL exclude from SRS_v2 every test outcome, pass count, fail count, coverage figure, and benchmark result that no dated execution record in the Repository or in the Author_Process session log produced.
9. WHEN the Author_Process completes a section of SRS_v2, THE Author_Process SHALL check each factual statement in that section against the Repository file named in its Evidence_Citation, and SHALL delete or mark with a Requires_Confirmation_Marker every statement the named file does not substantiate, before that section is treated as complete.
10. IF a mandated SRS_v2 content area has no substantiating Repository artifact, THEN THE Author_Process SHALL state the absence of the artifact in that content area and SHALL exclude any substitute description of unimplemented behaviour from that content area.

### Requirement 3: Requires-Confirmation marking and register

**User Story:** As the SRS author, I want every unverifiable fact visibly flagged and consolidated, so that I can resolve open questions with my team rather than silently guessing.

#### Acceptance Criteria

1. IF the Author_Process retains a statement in SRS_v2 for which a search of the Repository yields no Evidence_Citation that substantiates the statement and no Repository content that contradicts it, THEN THE Author_Process SHALL append, immediately after the terminating punctuation of that statement, the Requires_Confirmation_Marker reproduced as the literal text `[Requires Confirmation]` without abbreviation, substitution, or reformatting, followed by the identifier of the RC_Register entry that covers the statement.
2. THE Author_Process SHALL record every Requires_Confirmation_Marker in the RC_Register held in the Requires-Confirmation appendix of SRS_v2 defined by the final row of the Appendix B table, using an identifier of the form `RC-<n>` where `<n>` is a two-digit zero-padded decimal number assigned sequentially from `01`, in ascending order of the first inline occurrence of the entry in SRS_v2, unique across SRS_v2, and never reused for a second entry.
3. THE RC_Register SHALL state, for each entry, the entry identifier, the unverifiable statement as it appears in SRS_v2, the section number of every inline occurrence of that entry, the reason the Repository does not substantiate the statement expressed either as the named location outside the Repository that holds the fact or as a statement that no Repository artifact was found, one confirming party drawn from the SRS_v1 author team, the holder of the Supabase project configuration, or the holder of the deployment configuration, and a status recorded as exactly one of `Open`, `Confirmed`, or `Refuted`.
4. THE Author_Process SHALL assign an RC_Register entry to every SRS_v1 claim whose value is a configuration setting declared in no Repository file, including provider-held authentication, session, email, and storage settings and hosting-provider settings, and SHALL name the holding location of that setting as the reason for the entry.
5. THE Author_Process SHALL make every RC_Register entry identifier appear in at least one inline Requires_Confirmation_Marker in SRS_v2, SHALL make every inline Requires_Confirmation_Marker identifier resolve to exactly one RC_Register entry, and SHALL exclude from the RC_Register any entry whose identifier appears in no inline Requires_Confirmation_Marker.
6. WHEN the user supplies a confirmation decision for an RC_Register entry, THE Author_Process SHALL remove the Requires_Confirmation_Marker from every inline occurrence recorded for that entry, SHALL bring the statement into agreement with the supplied decision, and SHALL set the entry status to `Confirmed` or `Refuted` together with the date of the decision.
7. IF no confirming party from the parties permitted in criterion 3 can be identified for a statement, THEN THE Author_Process SHALL record the confirming party as the SRS_v1 author team, SHALL retain the entry status as `Open`, and SHALL state in the entry that no other party was identified.
8. IF the Repository contradicts a statement carried forward from SRS_v1, THEN THE Author_Process SHALL correct the statement to the Repository content, SHALL record the correction in the Appendix A gap analysis, and SHALL exclude a Requires_Confirmation_Marker and an RC_Register entry from that statement.

### Requirement 4: Preservation of existing requirement identifiers and architecture

**User Story:** As the SRS author, I want v1.0 requirement identifiers and the documented architecture carried forward unchanged, so that prior review history and cross-references stay valid.

#### Acceptance Criteria

1. THE SRS_v2 SHALL contain all 41 Legacy_Requirement_IDs — REQ-1 through REQ-32, BR-1 through BR-6, and TBD-1 through TBD-3 — with each identifier appearing on at least one requirement statement in the body of SRS_v2 and on exactly one row of the RTM.
2. THE Author_Process SHALL bind each of the 41 Legacy_Requirement_IDs in SRS_v2 to the same system capability, the same acting role, and the same data object that the identifier addressed in SRS_v1, and SHALL evidence each binding by a row of an Identifier_Continuity_Table stating the identifier, the SRS_v1 subject, and the SRS_v2 subject.
3. THE Author_Process SHALL allocate each requirement introduced in SRS_v2 a New_Requirement_ID drawn from REQ-33 upward, BR-7 upward, or TBD-4 upward, incrementing by 1 within each series with no skipped value.
4. THE Author_Process SHALL keep every requirement identifier in SRS_v2 bound to exactly one requirement statement, and SHALL apply no Legacy_Requirement_ID to any requirement introduced in SRS_v2.
5. IF the Repository contradicts the wording of a Legacy_Requirement_ID, THEN THE Author_Process SHALL retain that identifier unchanged, SHALL restrict the correction to the contradicted clause, and SHALL record a revision-history table row stating the identifier, the SRS_v1 wording, the SRS_v2 wording, and the Evidence_Citation that substantiates the correction.
6. THE SRS_v2 SHALL describe exactly three architectural tiers — the React single-page application, the Supabase platform, and the `certificate-service` Spring Boot module — stating for each tier its Repository root path, the responsibilities it carries, the interfaces it exposes to the other tiers, and an Evidence_Citation.
7. THE Author_Process SHALL exclude from the architecture section, the module descriptions section, and the database requirements section of SRS_v2 every statement that proposes a tier, technology, module, table, column, endpoint, or interface absent from the Repository.
8. IF the Author_Process identifies an architectural improvement, THEN THE Author_Process SHALL state the improvement only in the Future Enhancements section of SRS_v2 and SHALL label the improvement as not implemented in the Repository.
9. IF a Legacy_Requirement_ID describes a capability that the Repository does not implement, THEN THE Author_Process SHALL retain the identifier in SRS_v2, SHALL classify the requirement as unimplemented in its RTM row, and SHALL describe the capability in the Future Enhancements section of SRS_v2.

### Requirement 5: Coverage of the twenty-one mandated content areas

**User Story:** As the SRS author, I want confidence that all twenty-one enumerated content areas appear in the document, so that nothing the assignment demands is missing.

#### Acceptance Criteria

1. THE SRS_v2 SHALL contain an introduction section carrying four separately titled subsections named purpose, scope, objectives, and problem statement, where the objectives subsection states no fewer than three numbered objectives and the scope subsection states both what the Field Book system includes and what it excludes.
2. THE SRS_v2 SHALL contain an overall system description section stating the system purpose, the three-tier composition comprising the React single-page application, the Supabase platform, and the `certificate-service` Spring Boot module, the user classes, and the operating constraints.
3. THE SRS_v2 SHALL contain a user roles and permissions section presenting a permission grid table with exactly one row for the student role, one row for the organizer role, and one row for the admin role, and one column for each permission-bearing capability, where every granted capability carries an Evidence_Citation.
4. THE SRS_v2 SHALL contain a functional requirements section in which each functional requirement carries exactly one Legacy_Requirement_ID or New_Requirement_ID and each such identifier appears exactly once as a defining statement.
5. THE SRS_v2 SHALL contain a non-functional requirements section in which each non-functional requirement carries a requirement identifier and states the measurement method that would substantiate it.
6. THE SRS_v2 SHALL contain a system architecture section describing each of the three tiers, the interface between each pair of communicating tiers, and the direction of data flow across each interface.
7. THE SRS_v2 SHALL contain a module descriptions section presenting one subsection per module, each stating the module responsibility, the module inputs, the module outputs, the module dependencies, and the Repository path of the module.
8. THE SRS_v2 SHALL contain a database requirements section stating, for every table declared in `supabase/migrations/`, the columns, the primary keys, the foreign keys, the relationships, the constraints, and the row-level security policies, together with selected SQL text reproduced verbatim from the declaring migration.
9. THE SRS_v2 SHALL contain a user interface requirements section covering each major screen, where a major screen is a screen rendered by a route declared in `src/app/routes/index.tsx`, and stating for each such screen the purpose of the screen, the functionality of the screen, and, for each input field of the screen, the accepted value format or range and the rejection behaviour.
10. THE SRS_v2 SHALL contain a system diagrams section containing every diagram listed in the Appendix C diagram set, each presented as a Numbered_Artifact.
11. THE SRS_v2 SHALL contain a detailed workflows section covering registration and login, event creation, event approval, QR attendance capture, duplicate attendance prevention, certificate generation, certificate verification, and role upgrade, and stating for each of these eight workflows the initiating actor, the trigger, the ordered steps, the terminal outcome, and the failure paths.
12. THE SRS_v2 SHALL contain a detailed use cases section in which every use case appearing in the use case diagram is stated with a use case identifier, the primary actor, the preconditions, the main flow, the alternate flows, and the postconditions.
13. THE SRS_v2 SHALL contain a validation and error handling section stating, for each documented validation rule, the validated input, the accepted values, the observable rejection behaviour, whether the submitted data is retained or discarded, and the layer that enforces the rule.
14. THE SRS_v2 SHALL contain a security requirements section covering authentication, authorization, the row-level security model, the privilege boundary between the frontend key and the service-role key, and the security weaknesses identified during the Repository investigation.
15. THE SRS_v2 SHALL contain a code listings section carrying at least one Listing drawn from the React and TypeScript tier, at least one Listing drawn from the SQL and Supabase tier, and at least one Listing drawn from the Spring Boot, Java, and PDFBox tier.
16. THE SRS_v2 SHALL contain a testing requirements section including at least one Test_Case_Table that states, for each of its rows, a test case identifier, an objective, a precondition, an ordered list of steps, an expected result, and an Execution_Status_Column value.
17. THE SRS_v2 SHALL contain a hardware and software requirements section stating the minimum client hardware, the supported browsers, and the runtime and build tool versions as declared in `package.json`, `certificate-service/pom.xml`, and `certificate-service/Dockerfile`.
18. THE SRS_v2 SHALL contain a limitations section in which each limitation states its impact on system use and carries an Evidence_Citation.
19. THE SRS_v2 SHALL contain a future enhancements section in which each enhancement states its rationale, and which includes every capability that the Appendix A gap analysis records as documented in SRS_v1 without Repository implementation.
20. THE SRS_v2 SHALL contain a conclusion section that introduces no factual claim absent from the preceding sections of SRS_v2.
21. THE SRS_v2 SHALL contain an RTM section carrying one row for every requirement stated in SRS_v2.
22. THE SRS_v2 detailed workflows section SHALL state that the certificate verification workflow is planned functionality that the Repository does not implement, SHALL state that `src/app/routes/index.tsx` declares no route serving that workflow, SHALL attach an Evidence_Citation naming that route table, SHALL classify the workflow `Planned` under Requirement 17, and THE SRS_v2 SHALL record the absence in the limitations section and SHALL state the workflow in the Future Enhancements section.
23. THE SRS_v2 SHALL contain a Coverage_Checklist_Table with exactly twenty-one rows, one per mandated content area, each row naming the content area and the SRS_v2 section number that satisfies it.
24. IF a mandated content area has no substantiating artifact in the Repository, THEN THE Author_Process SHALL retain the section for that content area, SHALL state within that section that the Repository substantiates no content for it, and SHALL add an RC_Register entry naming the content area and the missing artifact.
25. THE Author_Process SHALL list each of the twenty-one mandated content areas in the SRS_v2 table of contents with its section number, and SHALL allocate each of those sections a Page_Budget greater than zero pages in Appendix B.
26. THE Author_Process SHALL exclude from every section, table, diagram, screenshot, caption, and body passage of SRS_v2 any statement that presents the certificate verification workflow as available, working, operating, provided, or implemented, and SHALL state that workflow only as planned functionality in the voice required by Requirement 17.

### Requirement 6: Presentation conventions for numbered artifacts

**User Story:** As the SRS author, I want every figure, table, screenshot and listing numbered, captioned, explained and traced, so that the document reads as a professional specification rather than a collection of images.

#### Acceptance Criteria

1. THE Author_Process SHALL assign each Numbered_Artifact an identifier of the form `<Type> <section>.<sequence>`, where `Type` is exactly one of Figure, Table, Screenshot, or Listing, `<section>` is the number of the SRS_v2 section in which the Numbered_Artifact is placed, and `<sequence>` is a positive integer, such that the resulting identifier is unique across all Numbered_Artifacts in SRS_v2.
2. THE Author_Process SHALL number Numbered_Artifacts of a given type in ascending order of first appearance within each section, starting at sequence 1 and increasing by exactly 1 with no skipped or repeated sequence values.
3. IF two or more Numbered_Artifacts carry the same identifier, or a section's sequence values for a given type are not contiguous from 1, THEN THE Author_Process SHALL renumber the affected Numbered_Artifacts and update every body-prose reference to them before SRS_v2 is submitted.
4. THE Author_Process SHALL attach to each Numbered_Artifact a caption that begins with the artifact identifier and is followed by a single descriptive phrase of 3 to 25 words, placed on the same page as the artifact.
5. THE Author_Process SHALL attach to each Numbered_Artifact explanatory prose of at least 2 sentences and at least 30 words, located in the same section as the artifact and within one page of it, stating what the artifact represents and what the reader is expected to conclude from it.
6. WHERE a Numbered_Artifact substantiates a requirement, THE Author_Process SHALL cite in that artifact's caption at least one requirement identifier of the form `Requirement <number>`, matching a requirement that exists in SRS_v2.
7. THE Author_Process SHALL attach to each Listing a Repository-relative file path identifying the source file from which the listing is taken, together with the start and end line numbers when the listing reproduces fewer than all lines of that file.
8. IF a Listing's stated Repository-relative file path does not resolve to an existing file in the Repository, or the stated line range does not exist in that file, THEN THE Author_Process SHALL correct the path or line range, or remove the Listing from SRS_v2, and SHALL NOT submit SRS_v2 while an unresolved path remains.
9. THE Author_Process SHALL reference each Numbered_Artifact at least once in the body prose of SRS_v2, using the artifact identifier verbatim, with the reference appearing in the same section as the artifact or in the section that introduces it.
10. IF a Numbered_Artifact lacks a caption, lacks the explanatory prose required by criterion 5, or has no verbatim body-prose reference, THEN THE Author_Process SHALL add the missing caption, prose, or reference, or remove the artifact from SRS_v2, before SRS_v2 is submitted.
11. THE Author_Process SHALL present enumerated comparisons, mappings, permission grids, schema definitions, and test cases in SRS_v2 as tables of type Table, each having a header row that labels every column and at least two columns, and SHALL NOT present such content as unstructured prose, bullet lists, or screenshots.

### Requirement 7: Page structure and budget

**User Story:** As the SRS author, I want an agreed section structure with page targets, so that the finished document lands near forty pages without padding.

#### Acceptance Criteria

1. THE SRS_v2 SHALL present the 21 numbered sections named in the Appendix B table in ascending section-number order, under the titles given in that table, with no section omitted, merged, reordered, or renumbered, and SHALL place the front-matter row content ahead of section 1 and the appendix row content after section 21.
2. THE Page_Budget SHALL assign a page allocation greater than zero to each of the 23 rows of the Appendix B table, and the sum of those 23 allocations SHALL fall between 38 and 42 pages inclusive.
3. THE Author_Process SHALL deliver each section of SRS_v2 at a length no less than 80 percent and no more than 125 percent of the Page_Budget allocation for that section, measured in rendered pages of the delivered document, and SHALL exclude sections whose body consists only of a heading, a cross-reference, or placeholder text.
4. THE Author_Process SHALL exclude from SRS_v2 any passage of 40 or more consecutive words that appears more than once, any section-closing paragraph that introduces no fact and no Evidence_Citation not already stated in that section, and any prose that describes software specification practice rather than the Field Book system; and WHERE a fact stated in one section is needed in another, THE Author_Process SHALL cite the section number or requirement identifier instead of restating the fact.
5. THE SRS_v2 SHALL contain, ahead of section 1, a title page, a revision history table, and a table of contents, and the title page SHALL state the document title, the version identifier, the issue date, the author names, and the institution name.
6. THE revision history table SHALL contain one row for SRS_v1 and one row for SRS_v2, each row SHALL state the version identifier, the issue date, the author names, and a summary of the changes introduced in that version, and the SRS_v2 row SHALL list every Legacy_Requirement_ID whose wording the Author_Process corrected or SHALL record that no Legacy_Requirement_ID wording changed.
7. THE table of contents SHALL list every row of the Appendix B table with its section number, its section title, and the page number on which that section begins in the delivered document.
8. THE delivered SRS_v2 SHALL span between 38 and 42 pages inclusive, counted in the delivered output format across the title page, the revision history table, the table of contents, sections 1 through 21, and every appendix.
9. IF the delivered page count of SRS_v2 falls outside 38 to 42 pages inclusive, THEN THE Author_Process SHALL bring the count inside that band by removing duplicated content or by adding content sourced from SRS_v1 or the Repository, SHALL leave the page size, margins, body font size, and line spacing of the document unchanged, and SHALL update the Page_Budget to match the revised section lengths.

### Requirement 8: Diagram set and Mermaid usage

**User Story:** As the SRS author, I want the full diagram set specified up front, so that the diagrams section is complete and internally consistent.

#### Acceptance Criteria

1. THE SRS_v2 system diagrams section SHALL contain exactly 13 numbered figures, carrying the Appendix C identifiers C.1 through C.13, spanning 10 diagram families: one system architecture diagram, one context diagram, one data flow diagram at level 0, one data flow diagram at level 1, one use case diagram, one entity relationship diagram, one class diagram, three sequence diagrams covering QR attendance capture, certificate generation, and event approval, two activity diagrams covering role upgrade request and resolution and registration with capacity check, and one deployment diagram.
2. WHERE Appendix C names a Mermaid diagram type for a figure, THE Author_Process SHALL author that figure as Mermaid source text of the named type — `flowchart`, `erDiagram`, `classDiagram`, or `sequenceDiagram` — embedded in SRS_v2.
3. WHERE Mermaid provides no native notation for a diagram family, THE Author_Process SHALL author the figure as a Mermaid `flowchart` and SHALL state in the caption of that figure both the family the figure represents and the fact that a `flowchart` substitutes for the absent notation.
4. THE Author_Process SHALL restrict figure C.6 to tables, columns, and relationships declared in the 16 migration files under `supabase/migrations/`, SHALL use for each entity the table name as declared in those files, and SHALL exclude every entity, column, and relationship not declared in those files.
5. THE Author_Process SHALL restrict figure C.7 to classes, records, and interfaces declared in `certificate-service/src/main/java/` and to types exported from `src/lib/`, and SHALL exclude every type not declared in those two locations.
6. THE Author_Process SHALL restrict figure C.13 to hosts, services, and environment variables declared in `vercel.json`, `render.yaml`, `certificate-service/Dockerfile`, and `.github/workflows/`, SHALL label each environment variable by its declared name only, and SHALL exclude every environment variable value.
7. THE Author_Process SHALL label the three external actors and the six external systems of figure C.2 — Student, Organizer, Admin, Supabase Auth, Supabase Postgres, Supabase Storage, Google OAuth, Render, and Vercel — using the name each carries in the Repository, and SHALL attach an Evidence_Citation to figure C.2 for each labelled external system.
8. THE Author_Process SHALL use, for each actor, entity, process, service, and data store that appears in more than one of the 13 figures, label text identical in every figure in which it appears and identical to the name used for that element in the SRS_v2 body prose.
9. IF the Mermaid source of a figure does not render as a complete diagram in the output format selected under Requirement 13, THEN THE Author_Process SHALL present that figure as a static image exported from the same Mermaid source, SHALL retain the Mermaid source text in SRS_v2, and SHALL state the image format in the caption of that figure.
10. IF an element required by criteria 4 through 7 has no declaration in the Repository, THEN THE Author_Process SHALL omit the element from the figure and SHALL record an RC_Register entry naming the omitted element and the figure identifier.

### Requirement 9: Screenshot inventory and capture

**User Story:** As the SRS author, I want a clear split between screenshots I already have and screenshots that must be captured, so that no image in the document is fabricated.

#### Acceptance Criteria

1. THE Author_Process SHALL record in Appendix D one row for each screen depicted in SRS_v2, SHALL classify each row as exactly one of Available_Screenshot or Capture_Required_Screenshot, and SHALL include at minimum the 2 Available_Screenshot rows (`fieldbook-homepage.png`, `fieldbook-login-mobile-390.png`) and the 28 Capture_Required_Screenshot rows identified during the Repository investigation.
2. THE Author_Process SHALL state, for each Capture_Required_Screenshot row in Appendix D, the route path as declared in `src/app/routes/index.tsx`, the role required to reach the route stated as exactly one of student, organizer, admin, any signed-in user, or none, the data precondition required for the screen to render content, and the SRS_v2 section that displays the screenshot.
3. WHEN a Capture_Required_Screenshot is captured, THE Author_Process SHALL capture the image from a running instance of the Field Book application served at `http://localhost:5173`, SHALL capture at a viewport width of 1440 pixels for every row except rows Appendix D marks as mobile, SHALL capture mobile-marked rows at a viewport width of 390 pixels, and SHALL store the image as a lossless raster image.
4. THE Author_Process SHALL record, for each screenshot in SRS_v2, the image file name, the route, the acting role, the viewport width in pixels, and the capture date, in the Appendix D row for that screen.
5. IF a screen fails to render its documented content within 30 seconds of navigation on 2 successive attempts because the required role or the required data is unavailable, THEN THE Author_Process SHALL omit the screenshot from SRS_v2, SHALL mark the Appendix D row as not captured, SHALL add an RC_Register entry naming the screen, the blocking precondition, and the party able to supply that precondition, and SHALL leave no placeholder image and no unresolved image reference in SRS_v2.
6. THE Author_Process SHALL exclude from every screenshot in SRS_v2 the names, email addresses, phone numbers, enrolment or roll identifiers, profile photographs, and account identifiers of real people, either by capturing the screen while signed in as a Documentation_Account or by covering the affected region with an opaque block before the image enters SRS_v2.
7. WHERE a Capture_Required_Screenshot requires the student role, the organizer role, the admin role, or any signed-in user, THE Author_Process SHALL reach the route by signing in with a Documentation_Account and SHALL exclude the credentials of that account from SRS_v2.
8. THE Author_Process SHALL restrict post-capture modification of any screenshot to cropping and opaque redaction, and SHALL exclude compositing, recolouring, text substitution, and every other alteration of the rendered screen content.
9. WHEN the user interface requirements section of SRS_v2 is complete, THE Author_Process SHALL resolve every Appendix D row to either one Screenshot artifact present in SRS_v2 or one RC_Register entry, and SHALL keep the count of Screenshot artifacts in SRS_v2 equal to the count of Appendix D rows that are not marked as not captured.

### Requirement 10: Code-listing inventory across the three technology tiers

**User Story:** As the SRS author, I want real code from all three tiers quoted with its file path, so that the document demonstrates the implementation rather than describing it abstractly.

#### Acceptance Criteria

1. THE SRS_v2 SHALL contain exactly 7 Listings drawn from React or TypeScript source files under `src/`, each Listing drawn from a distinct source file.
2. THE SRS_v2 SHALL contain exactly 8 Listings drawn from SQL files under `supabase/migrations/`, each Listing drawn from a distinct source file.
3. THE SRS_v2 SHALL contain exactly 7 Listings drawn from Java source files under `certificate-service/src/main/java/`, each Listing drawn from a distinct source file.
4. THE Author_Process SHALL reproduce each Listing character-for-character identical to the cited Repository file at a single Repository revision recorded in Appendix E, with no renamed identifiers, no reformatted code, no paraphrased statements, and no lines added that are absent from the source file.
5. WHERE a cited source file exceeds 60 lines, THE Author_Process SHALL abbreviate the Listing to between 10 and 60 contiguous or elided lines, SHALL mark each omission with a single ellipsis line at the omission point, and SHALL state each omitted line range as first line number and last line number in the Listing caption.
6. THE Author_Process SHALL replace every occurrence of a secret value, service-role key, anonymous key, project identifier, and deploy-hook URL inside a Listing with a fixed non-functional placeholder token, such that no Listing in SRS_v2 contains a literal credential, key, project identifier, or deploy-hook URL.
7. THE Author_Process SHALL state in each Listing caption the Repository-relative file path, the reproduced line range, and at least one SRS_v2 requirement identifier that the listed code implements.
8. THE SRS_v2 SHALL place all 22 Listings in the code listings section defined by row 15 of the Appendix B table, numbered sequentially from 1 to 22 with no duplicate and no skipped number, and grouped so that the 7 `src/` Listings, the 8 `supabase/migrations/` Listings, and the 7 `certificate-service/src/main/java/` Listings each appear under a separate tier heading matching the tier grouping of Appendix E.
9. IF a candidate source file is a secret-bearing environment file, including `.env.local` at the Repository root and `.env.local` under `certificate-service/`, THEN THE Author_Process SHALL exclude that file from Appendix E in its entirety and SHALL select a replacement source file from the same tier so that the tier count in criteria 1 through 3 is still met.
10. IF a cited file path, Repository revision, or line range in an Appendix E caption does not resolve to existing content in the Repository, THEN THE Author_Process SHALL withhold that Listing from SRS_v2, SHALL record an unresolved-citation error identifying the affected Listing number and cited path, and SHALL retain the remaining Listings unchanged.

### Requirement 11: Requirement Traceability Matrix completeness

**User Story:** As the SRS author, I want a traceability matrix that accounts for every requirement, so that examiners can follow each requirement from statement to implementation to test.

#### Acceptance Criteria

1. THE RTM SHALL contain exactly one row for each requirement stated in SRS_v2, comprising one row for each of the 41 Legacy_Requirement_IDs (REQ-1 through REQ-32, BR-1 through BR-6, and TBD-1 through TBD-3) and one row for each New_Requirement_ID, with no requirement identifier appearing in more than one row and no row bearing a requirement identifier absent from SRS_v2.
2. THE RTM SHALL state, for each row, a non-empty value in each of five columns: the requirement identifier, the SRS_v2 design section number, the module, the screen, and the test case identifier.
3. WHERE a requirement has no implementing screen, THE RTM SHALL record the literal value `No screen` in the screen column of that row.
4. WHERE a requirement has no implementing module, THE RTM SHALL record the literal value `No module` in the module column of that row.
5. THE Author_Process SHALL resolve every module name in the RTM to a repository-relative path, expressed with forward slashes, of a file or directory that exists in the Repository.
6. THE Author_Process SHALL resolve every screen name in the RTM to one of the 25 route paths declared in `src/app/routes/index.tsx`, excluding the catch-all route, and SHALL state that route path in the screen column.
7. THE Author_Process SHALL resolve every test case identifier in the RTM to exactly one row of a Test_Case_Table in SRS_v2.
8. WHERE more than one test case covers a requirement, THE RTM SHALL list every test case identifier covering that requirement in the test case column of that row.
9. WHERE a row records `No module` in the module column, THE RTM SHALL record the status `Unimplemented` for that requirement and SHALL name the SRS_v2 section that documents the absence of the implementation.
10. IF a module name, a screen name, or a test case identifier in the RTM cannot be resolved as required by criteria 5 through 7, THEN THE Author_Process SHALL record the literal value `Unresolved` in that cell and SHALL add an RC_Register entry naming the requirement identifier, the column, and the reason resolution failed.

### Requirement 12: Test-case tables without claimed results

**User Story:** As the SRS author, I want test cases specified as intent rather than reported as passed, so that the document never claims verification that has not happened.

#### Acceptance Criteria

1. THE Test_Case_Table SHALL state, for each test case, a unique test case identifier, an objective stated in 1 to 2 sentences, at least 1 precondition, an ordered list of 2 to 10 numbered steps, exactly 1 expected result, and a reference to at least 1 requirement identifier defined in SRS_v2.
2. THE Test_Case_Table SHALL contain an Execution_Status_Column in which every cell is non-empty and records exactly one of the two permitted forms defined in criteria 3 and 4.
3. IF a test case has no execution record available to the SRS author, THEN THE Execution_Status_Column cell for that test case SHALL record only the literal value `Not executed`, and SHALL contain no outcome term such as `Pass`, `Passed`, `Fail`, `Failed`, `Verified`, or `Successful`.
4. IF a test case has an execution record available to the SRS author, THEN THE Execution_Status_Column cell for that test case SHALL record the observed outcome, the calendar date of the execution in `YYYY-MM-DD` form, and the name of the command or workflow that produced that record.
5. THE SRS_v2 testing section SHALL state that the Repository provides a TypeScript compilation gate through `npm run typecheck` and the GitHub Actions workflow `.github/workflows/frontend-typecheck.yml`, and SHALL describe that gate as an available capability without stating any execution outcome for it.
6. THE SRS_v2 testing section SHALL state that the `certificate-service` module declares JUnit test support through the `spring-boot-starter-test` dependency, and SHALL state no test count, pass count, or execution outcome for that module.
7. THE SRS_v2 testing section SHALL state that the Repository declares no automated test runner for the frontend application, SHALL identify the absent declarations by name as vitest, jest, playwright, and testing-library, and SHALL record `Not executed` in the Execution_Status_Column for every frontend test case.
8. THE Test_Case_Table SHALL contain at least 15 test cases in total and at least 1 test case for each functional requirement defined in SRS_v2.
9. THE SRS_v2 SHALL contain no statement asserting a test pass, a test failure, a pass rate, a defect count, or a code coverage percentage.
10. THE SRS_v2 testing section SHALL include a note stating that the document reports test intent only, that no test execution results are reported, and that every Execution_Status_Column value holds as of the document version date.

### Requirement 13: Deliverable output format and location

**User Story:** As the SRS author, I want the document written to an agreed location in an agreed format, so that the deliverable is easy to find, review and submit.

#### Acceptance Criteria

1. THE Author_Process SHALL write SRS_v2 as one master document file inside a single output directory within the Repository, and SHALL NOT split SRS_v2 across more than one master document file.
2. THE Author_Process SHALL store every image asset referenced by SRS_v2 inside a single asset subdirectory of that output directory, with zero referenced assets stored outside that output directory.
3. THE Author_Process SHALL reference each image asset from SRS_v2 by a path relative to the SRS_v2 document location, and SHALL NOT use absolute filesystem paths or external URLs for any referenced asset.
4. THE Author_Process SHALL write SRS_v2 as Markdown at the decided Repository-relative path `docs/srs/field-book-srs-v2.0.md`, SHALL use `docs/srs/` as the single output directory required by criterion 1, and SHALL use `docs/srs/assets/` as the single asset subdirectory required by criterion 2.
5. WHEN the user selects an output format, THE Author_Process SHALL verify, before authoring the diagrams section, that the selected format renders each of the 13 diagrams in the Appendix C diagram set, and SHALL record a per-diagram rendered or not-rendered result for all 13 diagrams in the corresponding RC_Register entry.
6. THE Author_Process SHALL author every diagram of the Appendix C diagram set as Mermaid source text embedded in the Markdown master, and SHALL record in the RC-03 register entry a rendered or not-rendered result for each of the 13 diagrams as rendered by the Markdown output format.
7. IF the selected output format does not render a diagram in the Appendix C diagram set from its authored diagram source, THEN THE Author_Process SHALL export that diagram to a static image asset stored in the asset subdirectory, SHALL reference that asset by a path relative to the SRS_v2 document, and SHALL retain the authored diagram source in the Repository.
8. WHERE the user requests a submission copy of SRS_v2 in a format other than Markdown, THE Author_Process SHALL derive that copy from the Markdown master at the path stated in criterion 4, SHALL export each Mermaid diagram that the requested format does not render to a static image asset under `docs/srs/assets/` as required by criterion 7, and SHALL retain the Markdown master and its authored diagram sources unchanged.

### Requirement 14: Up-front review deliverables

**User Story:** As the SRS author, I want the gap analysis, structure, diagram list, screenshot list and code-snippet list to arrive before the document body, so that I can correct course before forty pages exist.

#### Acceptance Criteria

1. THE Author_Process SHALL deliver the gap analysis as Appendix A of this requirements document, in the same submission as the other four review deliverables, and before authoring any section of the body of SRS_v2.
2. THE gap analysis SHALL separate findings into four labelled categories — content documented in SRS_v1 without Repository implementation, content implemented in the Repository without documentation in SRS_v1, statements in SRS_v1 that the Repository contradicts, and statements in SRS_v1 that the Repository verifies — and SHALL contain not fewer than 10 findings in the first category, 20 in the second, 12 in the third, and 7 in the fourth.
3. THE Author_Process SHALL attach to each gap analysis finding a unique finding identifier, the SRS_v1 claim or Repository capability at issue, and at least one Evidence_Citation, and SHALL leave no finding without an Evidence_Citation.
4. THE Author_Process SHALL deliver the section structure as Appendix B of this requirements document before authoring the body of SRS_v2, stating for each of its 23 rows the section number, the section title, and the Page_Budget allocation for that section, with the allocations totalling between 38 and 42 pages inclusive.
5. THE Author_Process SHALL deliver the diagram list as Appendix C of this requirements document before authoring the body of SRS_v2, containing 13 entries that together cover every diagram type enumerated in Requirement 8 criterion 1, and stating for each entry the diagram type, the diagram title, the SRS_v2 section that will contain it, and whether Mermaid expresses its structure.
6. THE Author_Process SHALL deliver the screenshot list as Appendix D of this requirements document before authoring the body of SRS_v2, containing 30 entries of which 2 are classified as Available_Screenshot and 28 as Capture_Required_Screenshot, and stating for each entry the screen name, the route that renders the screen, and the role required to reach that route.
7. THE Author_Process SHALL deliver the code-listing list as Appendix E of this requirements document before authoring the body of SRS_v2, containing 22 entries, stating for each entry the Repository-relative file path and the technology tier, and containing at least one entry from each of the React and TypeScript tier, the SQL and Supabase tier, and the Java tier.
8. WHEN the user records approval of all five review deliverables, THE Author_Process SHALL begin authoring the body of SRS_v2.
9. WHILE any of the five review deliverables remains unapproved, THE Author_Process SHALL restrict its output to the five review deliverables and SHALL author no section of the body of SRS_v2.
10. IF the user rejects any of the five review deliverables or requests a change to one, THEN THE Author_Process SHALL revise the identified deliverable, SHALL re-deliver it for review, SHALL retain the unaffected deliverables and their prior approvals unchanged, and SHALL continue to withhold authoring of the body of SRS_v2.
11. THE Author_Process SHALL state, for each contradiction finding in the gap analysis, the correction it proposes to adopt in SRS_v2, and SHALL request the user's decision on that correction as part of the approval of Appendix A.

### Requirement 15: Accessibility and measurement claim discipline

**User Story:** As the SRS author, I want accessibility and performance claims stated honestly, so that the document does not assert conformance the project has not demonstrated.

#### Acceptance Criteria

1. THE SRS_v2 SHALL state, in the non-functional requirements section and in the limitations section, that full accessibility conformance validation requires manual testing with assistive technologies and expert accessibility review, and SHALL state that the Author_Process performed neither activity.
2. WHERE SRS_v1 asserts conformance to an accessibility standard, THE Author_Process SHALL restate the assertion in SRS_v2 as a design intent, SHALL label the assertion as unvalidated, SHALL append a Requires_Confirmation_Marker to the restated assertion, and SHALL record one RC_Register entry naming the asserted standard and conformance level.
3. THE Author_Process SHALL present each of the four performance figures carried forward from SRS_v1 — first contentful paint of 1.5 s, QR decode under 250 ms, check-in under 2 s, and certificate PDF generation under 8 s — in SRS_v2 as a target labelled unmeasured, accompanied by a measurement method that states the quantity observed, the observation count of no fewer than 10 observations, the reported statistic, and the execution environment in which the observations would be taken.
4. THE Author_Process SHALL present the 99.0 % availability figure carried forward from SRS_v1 in SRS_v2 as a target labelled unmeasured, accompanied by a measurement method that states the observation window, the sampling interval, the definition of an unavailable sample, and the arithmetic that converts samples to an availability percentage.
5. THE SRS_v2 SHALL state that the Repository contains no performance benchmark artifact, no accessibility audit or accessibility checking tool, and no recorded availability series, and SHALL state that the keep-alive workflow at `.github/workflows/keep-alive.yml` issues a health request every 10 minutes and retains no result.
6. THE SRS_v2 SHALL contain one table listing the four performance figures of criterion 3, the availability figure of criterion 4, and the accessibility conformance assertion of criterion 2, stating for each row the figure as published in SRS_v1, the status value `Unmeasured`, the measurement method that would substantiate the figure, and the RC_Register identifier where one exists.
7. IF a passage of SRS_v2 would state that a performance figure, an availability figure, or an accessibility conformance level has been measured, achieved, tested, or conformed to, THEN THE Author_Process SHALL replace that passage with the target statement required by criterion 3, criterion 4, or criterion 2, SHALL retain the numeric value unchanged, and SHALL cite the row of the criterion 6 table that carries the figure.
8. THE Author_Process SHALL record the absence of accessibility tooling, the absence of a performance benchmark harness, and the absence of an availability measurement series as three separate entries in the limitations section of SRS_v2, each carrying an Evidence_Citation or an explicit statement that no Repository artifact exists.

### Requirement 16: Security documentation fidelity

**User Story:** As the SRS author, I want the security section to describe the real security posture including its weak points, so that the document is an accurate engineering record.

#### Acceptance Criteria

1. THE SRS_v2 security section SHALL state, for each table governed by `supabase/migrations/20260816120000_rls_policies.sql`, whether row-level security is enabled and SHALL state the name, the covered operation, and the `using` or `with check` expression of each policy declared for that table, with an Evidence_Citation naming the migration file.
2. THE SRS_v2 security section SHALL state that the anonymous key used by the frontend operates subject to the row-level security policies of Requirement 16.1, SHALL state that the service-role key used by `certificate-service` bypasses those policies, and SHALL state that no database-level control constrains an actor holding the service-role key.
3. THE SRS_v2 security section SHALL state that the `POST /api/certificates/generate` endpoint validates no caller identity, no caller session, and no caller role, SHALL state that the endpoint executes while holding the service-role key described in Requirement 16.2, and SHALL state the resulting exposure that any caller able to reach the endpoint can cause certificate issuance without authentication.
4. THE SRS_v2 security section SHALL state that the cross-origin allow-list declared in `certificate-service/src/main/java/com/fieldbook/certificateservice/config/WebConfig.java` is seeded with `http://localhost:5173`, is extended by the `FRONTEND_ORIGIN` value, admits wildcard origin patterns supplied through `FRONTEND_ORIGIN_PATTERN`, and permits all origins for GET requests to `/actuator/**`.
5. THE SRS_v2 security section SHALL state that `public.audit_log` accepts inserts and rejects updates and deletes, SHALL state that the rejection arises solely from the absence of any update policy and any delete policy on that table, and SHALL state that no check constraint, trigger, or privilege revocation enforces the append-only property.
6. THE SRS_v2 security section SHALL state, as the behaviour of the Repository before the Corrective_Migration of Requirement 18 is applied, that `events_update_own_organizer` restricts an update to rows where `organizer_id` equals the calling user identity and applies no restriction on the `status` value, SHALL state that an organizer can therefore set an owned event to `published` by direct update, SHALL state that the admin approval gate is enforced only by application code, SHALL classify the control `Partially Implemented` under Requirement 17, and SHALL cite Requirement 18 as the statement of the intended behaviour and of the correction.
7. THE SRS_v2 security section SHALL state, as the behaviour of the Repository before the Corrective_Migration of Requirement 19 is applied, that `approve_role_change_request` verifies that the caller satisfies `is_admin()` and performs no comparison between the request subject identity and the calling user identity, SHALL state that the function therefore does not prevent an admin from approving a role-change request concerning that same admin, SHALL classify the control `Partially Implemented` under Requirement 17, and SHALL cite Requirement 19 as the statement of the intended behaviour and of the correction.
8. WHERE a security control that SRS_v1 describes is enforced other than by a database policy, THE SRS_v2 SHALL state the enforcement layer for that control as application code, platform configuration, or unenforced, and SHALL attach an Evidence_Citation to the stated enforcement layer.
9. THE SRS_v2 limitations section SHALL list every security weakness recorded in Appendix A, SHALL include at minimum the weaknesses stated in Requirements 16.3 through 16.7, and SHALL state for each listed weakness an identifier, the Evidence_Citation, the enforcement layer, and the RC_Register identifier where one exists.
10. IF a statement of a security weakness in SRS_v2 would carry a qualifier that reduces the stated severity of the weakness without an Evidence_Citation substantiating the qualifier, THEN THE Author_Process SHALL omit that qualifier and SHALL retain the weakness statement unmodified.

### Requirement 17: Implementation maturity classification

**User Story:** As the SRS author, I want implemented, partially implemented and planned functionality separated by an explicit label everywhere they appear, so that no reader of the document mistakes a plan for a working feature.

#### Acceptance Criteria

1. THE SRS_v2 SHALL define an Implementation_Status vocabulary of exactly three values — `Implemented`, `Partially Implemented`, and `Planned` — and SHALL state the definition of each value as follows: `Implemented` means the Repository substantiates the whole of the described capability; `Partially Implemented` means the Repository substantiates some but not all of the described capability, or enforces the capability at a weaker layer than the requirement states; `Planned` means the Repository substantiates none of the described capability.
2. THE Author_Process SHALL exclude from SRS_v2 every maturity label other than the three values defined in criterion 1, and SHALL reproduce each of those three values with the exact spelling and capitalisation given in criterion 1.
3. THE SRS_v2 SHALL assign exactly one Implementation_Status value to each functional requirement stated in the functional requirements section, to each of the workflows stated in the detailed workflows section, and to each module stated in the module descriptions section.
4. WHERE an item carries the Implementation_Status value `Implemented`, THE SRS_v2 SHALL attach to that item at least one Evidence_Citation naming a Repository file that substantiates the whole of the described capability.
5. WHERE an item carries the Implementation_Status value `Partially Implemented`, THE SRS_v2 SHALL state which part of the capability the Repository substantiates, which part the Repository does not substantiate, the layer at which the substantiated part is enforced, and at least one Evidence_Citation for the substantiated part.
6. WHERE an item carries the Implementation_Status value `Planned`, THE SRS_v2 SHALL state which part of the capability is absent and SHALL attach either an Evidence_Citation naming the Repository file whose content demonstrates the absence or an explicit statement that no Repository artifact exists for the item.
7. THE SRS_v2 SHALL contain exactly one Implementation_Status_Table, presented as a Numbered_Artifact of type Table, carrying one row for each requirement identifier stated in SRS_v2, each row stating the requirement identifier and its Implementation_Status value, and carrying a count of requirement identifiers for each of the three Implementation_Status values together with a total that equals the number of rows.
8. THE RTM SHALL carry an Implementation_Status column stating, for each row, the same Implementation_Status value that the Implementation_Status_Table states for the requirement identifier of that row.
9. WHERE an RTM row records the status `Unimplemented` under Requirement 11 criterion 9, THE RTM SHALL record `Planned` in the Implementation_Status column of that row, so that the Requirement 11 status vocabulary and the Implementation_Status vocabulary remain reconcilable without either being redefined.
10. THE Author_Process SHALL state every capability carrying the Implementation_Status value `Planned` in the future or conditional voice, using a construction such as "is planned to", "would", or "will", and SHALL exclude from every such statement the present-tense implemented voice, including the verbs provides, supports, allows, displays, generates, verifies, enforces, and returns applied to the planned capability as its subject.
11. THE Author_Process SHALL exclude every capability carrying the Implementation_Status value `Planned` from the set of implemented functional requirements presented in the functional requirements section, SHALL present each such capability in the Future Enhancements section, and SHALL retain the requirement identifier of that capability in the functional requirements section together with its `Planned` label and a cross-reference to the Future Enhancements section.
12. THE SRS_v2 SHALL classify the certificate verification workflow, and every requirement identifier whose subject is that workflow, with the Implementation_Status value `Planned`.
13. WHILE the Corrective_Migration required by Requirement 18 is unapplied, THE SRS_v2 SHALL classify the event publication gate with the Implementation_Status value `Partially Implemented`; and WHILE the Corrective_Migration required by Requirement 19 is unapplied, THE SRS_v2 SHALL classify the prohibition on admin self-approval of role-change requests with the Implementation_Status value `Partially Implemented`.
14. THE Author_Process SHALL exclude from every diagram in SRS_v2 any element that depicts a capability carrying the Implementation_Status value `Planned` as an existing screen, an existing process, an existing data store, or an existing data flow.
15. WHERE a diagram in SRS_v2 contains an element representing a capability carrying the Implementation_Status value `Planned`, THE Author_Process SHALL render that element with a visual treatment distinct from the treatment used for elements representing capabilities carrying the Implementation_Status value `Implemented`, SHALL state in the caption of that diagram both the identity of each planned element and the Implementation_Status value `Planned`, and SHALL state in the caption the visual treatment that distinguishes the planned elements.
16. THE Author_Process SHALL exclude from every screenshot in SRS_v2 any depiction of a capability carrying the Implementation_Status value `Planned`, and SHALL exclude every mocked, wireframed, or otherwise synthesized image offered as a depiction of such a capability.
17. IF a statement in SRS_v2 would present a capability carrying the Implementation_Status value `Planned` or `Partially Implemented` as available, working, operating, delivered, or complete, THEN THE Author_Process SHALL replace that statement with a statement in the voice required by criterion 10 or with the disclosure required by criterion 5, and SHALL retain the requirement identifier and the Implementation_Status value of the affected item unchanged.
18. WHEN a section of SRS_v2 is complete, THE Author_Process SHALL check that every functional requirement, workflow, and module in that section carries an Implementation_Status value, that each such value appears in the Implementation_Status_Table, and that the value in the Implementation_Status_Table agrees with the value in the RTM row for the same requirement identifier, before that section is treated as complete.
19. IF the Implementation_Status value stated for an item in a section, the value stated in the Implementation_Status_Table, and the value stated in the RTM row for that item are not all identical, THEN THE Author_Process SHALL bring the three statements into agreement with the value substantiated by the Evidence_Citations of that item before SRS_v2 is submitted.

### Requirement 18: Event publication gate enforced at the database layer

**User Story:** As the platform owner, I want event publication to require admin approval at the database layer, so that an organizer cannot bypass review by publishing an event directly.

#### Acceptance Criteria

1. WHEN an actor performs an update that sets `public.events.status` to `published`, THE Supabase_Database SHALL permit the update only where the acting actor satisfies `public.is_admin()`, or where the update is performed by the approval function acting under an admin-initiated call.
2. IF an actor holding the organizer role performs an update that sets `public.events.status` to `published` on an event whose `organizer_id` equals that actor's identity, THEN THE Supabase_Database SHALL reject the update and SHALL surface a permission error to the caller.
3. THE SRS_v2 security section SHALL state that the policy `events_update_own_organizer` declared in `supabase/migrations/20260816120000_rls_policies.sql` carries `with check (organizer_id = auth.uid())` with no restriction on the `status` column, and SHALL state that this policy therefore permits an actor holding the organizer role to set an owned event to `published` by direct update without any admin action.
4. THE Author_Process SHALL specify the correction to the behaviour of criterion 3 as a Corrective_Migration added under `supabase/migrations/`, and SHALL NOT specify any change to the text of `supabase/migrations/20260816120000_rls_policies.sql` or of any other migration file already present in the Repository.
5. THE Corrective_Migration SHALL preserve the ability of an actor holding the organizer role to update every column of an owned event other than `status`, and SHALL preserve the ability of that actor to set `status` to each value that an organizer is entitled to set.
6. THE SRS_v2 SHALL state, for the event publication gate, the defect described in criterion 3, the intended behaviour described in criteria 1 and 2, the enforcement layer before the Corrective_Migration stated as application code, the enforcement layer after the Corrective_Migration stated as a row-level security policy, and the filename of the Corrective_Migration.
7. WHILE the Corrective_Migration is unapplied, THE SRS_v2 SHALL describe the behaviour of criterion 3 as a defect in the current implementation, SHALL classify the event publication gate `Partially Implemented` under Requirement 17, and SHALL NOT describe the intended behaviour of criteria 1 and 2 as implemented.
8. WHEN the Corrective_Migration is applied, THE Author_Process SHALL verify against the database that an actor holding the organizer role is refused an update setting an owned event to `published`, that an actor holding the admin role is permitted that update, and that an actor holding the organizer role retains every update capability required by criterion 5.
9. IF the verification required by criterion 8 shows that any existing capability of the organizer role or of the admin role no longer succeeds, THEN THE Author_Process SHALL treat the Corrective_Migration as failed, SHALL specify a further Corrective_Migration that restores the regressed capability, and SHALL NOT record the intended behaviour of criteria 1 and 2 as implemented.
10. THE Author_Process SHALL classify the Corrective_Migration as a security-sensitive change to live authorization, SHALL obtain the user's explicit confirmation to apply it, SHALL record that confirmation together with its date before the migration is executed against any database, and SHALL NOT execute the migration against any database while that confirmation is unrecorded.

### Requirement 19: Prohibition on admin self-approval of role-change requests

**User Story:** As the platform owner, I want an admin blocked from approving a role-change request about themselves, so that no single account can grant itself a role without a second reviewer.

#### Acceptance Criteria

1. WHEN `public.approve_role_change_request` is called with a request identifier whose `user_id` equals the calling user identity, THE Supabase_Database SHALL reject the call, SHALL leave `public.role_change_requests.status` for that request unchanged, SHALL leave `public.profiles.role` for the request subject unchanged, and SHALL write no `public.audit_log` row recording an approval for that request.
2. THE Supabase_Database SHALL surface the rejection required by criterion 1 to the caller as an error carrying a message and an error code distinguishable from the error raised for a caller who does not satisfy `public.is_admin()`, from the error raised for a request identifier that does not exist, and from the error raised for a request already resolved.
3. THE SRS_v2 security section SHALL state that `public.approve_role_change_request` declared in `supabase/migrations/20260817120000_role_change_requests.sql` verifies only that the caller satisfies `public.is_admin()` and performs no comparison between the request subject identity and the calling user identity, and SHALL state that the function therefore permits an actor holding the admin role to approve a role-change request concerning that same actor.
4. THE Author_Process SHALL assess the policy `approvals_update_admin` declared in `supabase/migrations/20260816120000_rls_policies.sql` for the same absence of an ownership exclusion, SHALL state the result of that assessment in the SRS_v2 security section with an Evidence_Citation, and WHERE that policy permits an actor holding the admin role to resolve an approval record concerning an event owned by that same actor, THE Author_Process SHALL state that outcome as a defect and SHALL specify its correction within the Corrective_Migration required by criterion 5.
5. THE Author_Process SHALL specify the correction to the behaviour of criteria 3 and 4 as a Corrective_Migration added under `supabase/migrations/`, and SHALL NOT specify any change to the text of `supabase/migrations/20260817120000_role_change_requests.sql`, of `supabase/migrations/20260816120000_rls_policies.sql`, or of any other migration file already present in the Repository.
6. THE Corrective_Migration SHALL preserve the ability of an actor holding the admin role to approve a role-change request whose `user_id` differs from that actor's identity, to reject any role-change request, and to read every row of `public.role_change_requests`.
7. THE SRS_v2 SHALL state, for the prohibition on admin self-approval, the defect described in criteria 3 and 4, the intended behaviour described in criteria 1 and 2, the enforcement layer before the Corrective_Migration stated as unenforced, the enforcement layer after the Corrective_Migration stated as a database function guard, and the filename of the Corrective_Migration.
8. WHILE the Corrective_Migration is unapplied, THE SRS_v2 SHALL describe the behaviour of criteria 3 and 4 as a defect in the current implementation, SHALL classify the prohibition on admin self-approval `Partially Implemented` under Requirement 17, and SHALL NOT describe the intended behaviour of criteria 1 and 2 as implemented.
9. WHEN the Corrective_Migration is applied, THE Author_Process SHALL verify against the database that a call to `public.approve_role_change_request` naming a request whose `user_id` equals the caller identity is rejected with the distinguishable error of criterion 2, that a call naming a request whose `user_id` differs from the caller identity still approves that request and still updates `public.profiles.role` and `public.audit_log`, and that every capability required by criterion 6 still succeeds.
10. IF the verification required by criterion 9 shows that any existing capability of the admin role or of the requesting user no longer succeeds, THEN THE Author_Process SHALL treat the Corrective_Migration as failed, SHALL specify a further Corrective_Migration that restores the regressed capability, and SHALL NOT record the intended behaviour of criteria 1 and 2 as implemented.
11. THE Author_Process SHALL classify the Corrective_Migration as a security-sensitive change to live authorization, SHALL obtain the user's explicit confirmation to apply it, SHALL record that confirmation together with its date before the migration is executed against any database, and SHALL NOT execute the migration against any database while that confirmation is unrecorded.

---

## Appendix A — Gap Analysis: SRS v1.0 versus the actual repository

Every finding below carries an Evidence_Citation. Findings are grounded in a first-hand read of the cited files.

### A.1 Documented in SRS v1.0, not implemented in the repository

| # | SRS v1.0 claim | Repository finding | Evidence |
|---|---|---|---|
| A1.1 | Public certificate verification route `/verify/:id` | No route matching `/verify` exists. The route table declares 25 routes plus a catch-all that renders the landing page. A repository-wide search for `/verify` returns no match. | `src/app/routes/index.tsx` |
| A1.2 | `certificates.sha256_hash` column | No migration declares a hash column on any table. | `supabase/migrations/20260815120000_initial_schema.sql`, `supabase/migrations/20260816160000_certificate_url.sql` |
| A1.3 | `certificates.pdf_storage_path` column | The column that stores the artifact location is `certificate_url`, added as nullable `text`. | `supabase/migrations/20260816160000_certificate_url.sql` |
| A1.4 | `certificates.attendance_id` as a UNIQUE foreign key | The `certificates` table declares no reference to `attendance`. Actual columns: `id`, `event_id`, `student_id`, `template_id`, `certificate_code`, `issued_at`, `certificate_url`. No database-level link ties certificate issuance to an attendance record. | `supabase/migrations/20260815120000_initial_schema.sql` |
| A1.5 | Event lifecycle including `pending_review` and `cancelled` | The `events.status` CHECK constraint admits exactly `draft`, `published`, `live`, `completed`. | `supabase/migrations/20260815120000_initial_schema.sql` |
| A1.6 | Password reset link expiring in 15 minutes | No expiry value is configured in the repository. The reset flow calls `resetPasswordForEmail` with a `redirectTo` of `/auth/reset-callback`; expiry is a Supabase project setting. | `src/lib/auth.ts` |
| A1.7 | Performance targets: first contentful paint 1.5 s, QR decode under 250 ms, check-in under 2 s, PDF generation under 8 s | No benchmark harness, profiling configuration, or measurement artifact exists. | Repository-wide: no matching artifact |
| A1.8 | Availability of 99.0 % | No uptime measurement artifact exists. The keep-alive workflow pings `/actuator/health` every 10 minutes but records no availability series. | `.github/workflows/keep-alive.yml` |
| A1.9 | WCAG 2.1 AA conformance | No accessibility tooling, audit report, or automated check exists in the repository. | Repository-wide: no matching artifact |
| A1.10 | `orgs.social/verify/:id` verification endpoint | No verification route exists. `www.orgs.social` appears only as an "Org site" link. | `README.md`, `src/app/routes/index.tsx` |

### A.2 Implemented in the repository, not documented in SRS v1.0

| # | Repository capability | Evidence |
|---|---|---|
| A2.1 | `role_change_requests` table with a partial unique index enforcing one pending request per user, plus the `approve_role_change_request` and `reject_role_change_request` SECURITY DEFINER functions that update the request, the profile role, and the audit log atomically. | `supabase/migrations/20260817120000_role_change_requests.sql` |
| A2.2 | `registrations` table modelling intent to attend, distinct from attendance, with cancellation as a status flip; the capacity-safe `register_for_event` function that locks the event row; `cancel_registration`; and `event_active_registration_counts`. | `supabase/migrations/20260820120000_registrations.sql` |
| A2.3 | Notification metadata and server-side generation: `category` CHECK across six values, `event_id`, `metadata`, the `notifications_dedupe_unique` partial index, the `create_notification` chokepoint that is deliberately not granted to `authenticated`, and three AFTER triggers on `registrations`, `attendance`, and `certificates`. | `supabase/migrations/20260821120000_notifications_events.sql` |
| A2.4 | `platform_activity` display-only admin feed table with admin-only select and insert policies. | `supabase/migrations/20260819100000_platform_activity.sql` |
| A2.5 | `event_attendees(p_event_id)` SECURITY DEFINER function — the only path by which an organizer obtains attendee names, since no organizer select policy exists on `profiles`. Authorization is enforced inside the function body. | `supabase/migrations/20260822120000_event_attendees_rpc.sql` |
| A2.6 | `events.certificate_template_id` nullable foreign key with `on delete set null`, and its supporting index. | `supabase/migrations/20260907120000_events_certificate_template.sql` |
| A2.7 | Two supplementary views exposing only non-sensitive profile columns: `organizer_directory` and `event_certificate_recipients`. | `supabase/migrations/20260816120000_rls_policies.sql` |
| A2.8 | Four storage buckets with per-bucket size limits and MIME allow-lists, and storage-object policies across insert, update, delete, and select. | `supabase/migrations/20260816170000_storage_buckets.sql`, `supabase/migrations/20260818090000_storage_objects_select_policies.sql` |
| A2.9 | The upsert visibility defect and its fix: `upload` with `upsert: true` issues `INSERT ... ON CONFLICT DO UPDATE`, which requires a select policy that the original bucket migration omitted. | `supabase/migrations/20260818090000_storage_objects_select_policies.sql` |
| A2.10 | Helper functions `current_profile_role`, `is_admin`, `is_organizer`; the `handle_new_user` trigger on `auth.users`; `set_updated_at` with a pinned `search_path`; and the revocation of `EXECUTE` on the platform-provisioned `rls_auto_enable`. | `supabase/migrations/20260816120000_rls_policies.sql`, `supabase/migrations/20260816140000_profile_creation_trigger.sql`, `supabase/migrations/20260816130000_security_cleanup.sql` |
| A2.11 | The `certificate-service` endpoint performs no caller authentication, a fact the module README states explicitly. Any caller who reaches the endpoint acts through a service-role key that bypasses row-level security. | `certificate-service/README.md` |
| A2.12 | Deployed certificate-service host `https://fieldbook-certificate-service.onrender.com`, kept warm by a ten-minute cron because free-tier instances sleep after roughly fifteen minutes. | `.github/workflows/keep-alive.yml`, `render.yaml` |
| A2.13 | Cold-start resilience in the client: a 60-second request timeout, one automatic retry, a retry predicate for transient Supabase 502 responses, and a "waking" UI state. | `src/lib/certificates.ts` |
| A2.14 | The CORS model: an explicit allow-list seeded with `http://localhost:5173`, extended by `FRONTEND_ORIGIN`, plus wildcard origin patterns via `FRONTEND_ORIGIN_PATTERN`. The `/actuator/**` mapping allows all origins for GET. | `certificate-service/src/main/java/com/fieldbook/certificateservice/config/WebConfig.java` |
| A2.15 | Font embedding of Fraunces, Public Sans and IBM Plex Mono as subsetted `PDType0Font` instances, a PDFBox reproduction of the design-system seal, and a visual-QA test that asserts fonts do not silently fall back to Standard-14. | `certificate-service/README.md` |
| A2.16 | The QR payload format `fieldbook:attendance:{EVENT_CODE}`, with a parser that also accepts a bare event code, a manual-code-entry fallback, and an image-upload decode path using `inversionAttempts: "attemptBoth"`. | `src/app/student.tsx` |
| A2.17 | Client-side attendance gating: attendance recording is refused unless the event status is `published` or `live`, with distinct messages for a completed event and a not-yet-available event. | `src/app/student.tsx` |
| A2.18 | Three separately-triggered GitHub Actions workflows: certificate-service deploy via Render deploy hook, frontend type check, and keep-alive health ping. | `.github/workflows/` |
| A2.19 | Twenty-five routes including marketing routes `/pricing` and `/campuses`, the OAuth callback `/auth/callback`, the recovery callback `/auth/reset-callback`, and a catch-all that renders the landing page rather than a not-found page. | `src/app/routes/index.tsx` |
| A2.20 | Residual mock data in the organizer attendee screen, indicating a partially-migrated screen. | `src/app/organizer.tsx` |

### A.3 Statements in SRS v1.0 that the repository contradicts

| # | SRS v1.0 statement | Correction | Evidence |
|---|---|---|---|
| A3.1 | Spring Boot 3 | The parent POM declares `spring-boot-starter-parent` version 4.1.0. `java.version` is 17; the module README notes testing on a later JDK. | `certificate-service/pom.xml`, `certificate-service/README.md` |
| A3.2 | Table `attendances` | The table is `public.attendance`, singular. | `supabase/migrations/20260819120000_attendance.sql` |
| A3.3 | Table `audit_logs` | The table is `public.audit_log`, singular. | `supabase/migrations/20260816150000_audit_log.sql` |
| A3.4 | Camera capture at 1280×720 or greater | The constraint requests `width: { ideal: 720 }` and `height: { ideal: 720 }` with `facingMode: "environment"`. | `src/app/student.tsx` |
| A3.5 | Profile-creation trigger on `public.profiles` | The trigger `on_auth_user_created` fires AFTER INSERT on `auth.users` and writes into `public.profiles`. The trigger is not attached to `public.profiles`. | `supabase/migrations/20260816140000_profile_creation_trigger.sql` |
| A3.6 | Admin approval gates publication | Partially accurate. `events_insert_organizer` forces `status = 'draft'` on insert, and `approveEventApproval` sets `status` to `published`. However `events_update_own_organizer` carries `with check (organizer_id = auth.uid())` with no status restriction, so an organizer can move an owned event to `published` by direct update. The gate is an application-level convention, not a database-enforced one. | `supabase/migrations/20260816120000_rls_policies.sql`, `src/lib/approvals.ts` |
| A3.7 | Admins cannot self-approve | Not enforced. `approve_role_change_request` checks `is_admin()` but does not compare `v_request.user_id` against `auth.uid()`. The `approvals_update_admin` policy likewise applies no ownership exclusion. An admin can resolve a request or an approval concerning that same admin. | `supabase/migrations/20260817120000_role_change_requests.sql`, `supabase/migrations/20260816120000_rls_policies.sql` |
| A3.8 | Production frontend origin | `README.md` names `field-book-delta.vercel.app`. `render.yaml` sets `FRONTEND_ORIGIN` to `https://field-book.vercel.app`, which does not match. Cross-origin access from the README origin succeeds only through the `https://*.vercel.app` pattern. | `README.md`, `render.yaml`, `.vercel/project.json` |
| A3.9 | Attendance unique constraint on `(event_id, student_id)` | Substantively correct. The constraint is declared as `unique (student_id, event_id)`; the column order differs from the SRS wording but the constraint is equivalent. | `supabase/migrations/20260819120000_attendance.sql` |
| A3.10 | PostgreSQL 15 | Not verifiable. No migration or configuration file pins a PostgreSQL major version. | Repository-wide: no version pin |
| A3.11 | Table count | The migrations declare **eleven** application tables: `profiles`, `events`, `approvals`, `certificate_templates`, `certificates`, `notifications`, `audit_log`, `role_change_requests`, `platform_activity`, `attendance`, `registrations`. `README.md` states nine while listing ten names, so the README is internally inconsistent and both it and SRS v1.0 undercount. | all 16 files in `supabase/migrations/`, `README.md` |
| A3.12 | Storage bucket count | Four buckets exist: `certificates` (created outside the migrations, per the module README), plus `certificate-templates`, `qr-photos` and `avatars` created idempotently in migration. | `supabase/migrations/20260816170000_storage_buckets.sql`, `certificate-service/README.md` |

### A.4 SRS v1.0 statements verified as accurate

| # | Statement | Evidence |
|---|---|---|
| A4.1 | Six-digit email OTP verification for signup, with distinct handling for expired codes and rate limits. | `src/lib/auth.ts` |
| A4.2 | Google OAuth with the PKCE flow, with in-library code exchange. | `src/lib/supabaseClient.ts`, `src/lib/auth.ts` |
| A4.3 | Client insert into `certificates` is denied by row-level security; the only insert policy is admin-scoped. | `supabase/migrations/20260816120000_rls_policies.sql` |
| A4.4 | The audit log is append-only. | `supabase/migrations/20260816150000_audit_log.sql` |
| A4.5 | One active pending role-change request per user. | `supabase/migrations/20260817120000_role_change_requests.sql` |
| A4.6 | React with Vite, TypeScript and Tailwind CSS on the frontend; Apache PDFBox 3.0.8 in the certificate service. | `package.json`, `certificate-service/pom.xml` |
| A4.7 | jsQR performs QR decoding on canvas image data. | `src/app/student.tsx`, `package.json` |

---

## Appendix B — Proposed section structure and page budget

Estimated total: **42 pages**, at the upper bound of the 38-to-42 band required by Requirement 7. The row count is **23**, unchanged, so Requirement 7 criterion 1, Requirement 7 criterion 2 and Requirement 14 criterion 4 need no amendment.

Two allocations were raised to absorb Requirements 17, 18 and 19: section 6 gains 0.5 pages for the Implementation_Status column and the Implementation_Status_Table, and section 14 gains 0.5 pages for the two documented defects, their intended behaviour, and their corrective migrations. No allocation was reduced, because 41.0 + 1.0 = 42.0 stays inside the band.

| § | Section | Pages |
|---|---|---|
| — | Title page, revision history, table of contents | 2.0 |
| 1 | Introduction — purpose, scope, objectives, problem statement, definitions, references, overview | 2.0 |
| 2 | Overall Description — product perspective, product functions, user classes, operating environment, design constraints, assumptions and dependencies | 2.0 |
| 3 | User Roles and Permissions — role matrix, permission grid, guard behaviour | 1.5 |
| 4 | System Architecture — three-tier decomposition, trust boundaries, data-access paths | 2.0 |
| 5 | Module Descriptions — frontend route modules, service-layer modules, certificate-service packages, database objects | 2.0 |
| 6 | Functional Requirements — REQ-1 to REQ-32 carried forward, plus new identifiers from REQ-33, each carrying an Implementation_Status value, plus the Implementation_Status_Table | 4.0 |
| 7 | Non-Functional Requirements — performance targets, reliability, maintainability, portability, accessibility intent | 1.5 |
| 8 | Database Requirements — eleven tables, columns, keys, constraints, indexes, policies, triggers, functions, views, buckets, selected SQL | 4.0 |
| 9 | User Interface Requirements — every major screen with purpose, functionality, validation, and screenshot | 3.0 |
| 10 | System Diagrams — the ten diagram families in Appendix C | 3.0 |
| 11 | Detailed Workflows — the eight mandated workflows | 2.5 |
| 12 | Detailed Use Cases — use case specifications with actors, preconditions, main flow, alternate flows | 2.0 |
| 13 | Validation and Error Handling — client validation, database constraints, HTTP error contract | 1.0 |
| 14 | Security Requirements — authentication, authorization, row-level security, key separation, CORS, audit trail, the two documented defects with their intended behaviour and corrective migrations | 2.0 |
| 15 | Code Listings — the three tiers, per Appendix E | 2.0 |
| 16 | Testing Requirements — strategy, existing gates, test-case tables | 1.5 |
| 17 | Hardware and Software Requirements | 0.5 |
| 18 | Limitations | 0.5 |
| 19 | Future Enhancements | 0.5 |
| 20 | Conclusion | 0.5 |
| 21 | Requirement Traceability Matrix | 1.5 |
| RC | Appendix RC — Requires-Confirmation register | 0.5 |

---

## Appendix C — Diagram list

| Figure | Diagram | Format | Source of truth |
|---|---|---|---|
| C.1 | System architecture | Mermaid `flowchart` | `src/`, `certificate-service/`, `supabase/migrations/` |
| C.2 | Context diagram | Mermaid `flowchart` | Actors: Student, Organizer, Admin. External systems: Supabase Auth, Supabase Postgres, Supabase Storage, Google OAuth, Render, Vercel |
| C.3 | Data flow diagram, level 0 | Mermaid `flowchart` | Single-process view with four data stores |
| C.4 | Data flow diagram, level 1 | Mermaid `flowchart` | Processes: authenticate, manage event, approve event, record attendance, register, issue certificate, request role change, notify |
| C.5 | Use case diagram | Mermaid `flowchart` (Mermaid has no native use-case notation; the caption will state the substitution) | `src/app/routes/index.tsx` role guards |
| C.6 | Entity relationship diagram | Mermaid `erDiagram` | All 16 migrations |
| C.7 | Class diagram | Mermaid `classDiagram` | `certificate-service/.../model/`, `dto/`, `service/`; `src/lib/` exported types |
| C.8 | Sequence — QR attendance capture | Mermaid `sequenceDiagram` | `src/app/student.tsx`, `src/lib/attendance.ts` |
| C.9 | Sequence — certificate generation | Mermaid `sequenceDiagram` | `src/lib/certificates.ts`, `CertificateController.java` |
| C.10 | Sequence — event approval | Mermaid `sequenceDiagram` | `src/lib/approvals.ts` |
| C.11 | Activity — role upgrade request and resolution | Mermaid `flowchart` | `supabase/migrations/20260817120000_role_change_requests.sql` |
| C.12 | Activity — registration with capacity check | Mermaid `flowchart` | `register_for_event` |
| C.13 | Deployment diagram | Mermaid `flowchart` | `vercel.json`, `render.yaml`, `certificate-service/Dockerfile`, `.github/workflows/` |

---

## Appendix D — Screenshot inventory

**Available now (2):**

| Screenshot | File | Depicts |
|---|---|---|
| Available-1 | `fieldbook-homepage.png` | Landing page at `/` |
| Available-2 | `fieldbook-login-mobile-390.png` | Login page at `/login`, 390 px viewport |

**Must be captured (28).** No other raster image exists anywhere in the repository outside `node_modules`, `.git` and `dist`; the `.playwright-mcp/` directory holds only console logs and accessibility snapshots, no images.

| # | Route | Role required |
|---|---|---|
| D-01 | `/pricing` | none |
| D-02 | `/campuses` | none |
| D-03 | `/signup` | none |
| D-04 | `/forgot` | none |
| D-05 | `/login` (desktop viewport) | none |
| D-06 | `/profile` | any signed-in |
| D-07 | `/student/dashboard` | student |
| D-08 | `/student/explore` | student |
| D-09 | `/student/explore/:eventId` | student |
| D-10 | `/student/events` | student |
| D-11 | `/student/scanner` | student |
| D-12 | `/student/scanner` success state | student |
| D-13 | `/student/scanner` duplicate-attendance state | student |
| D-14 | `/student/certificates` | student |
| D-15 | `/student/notifications` | student |
| D-16 | `/organizer/dashboard` | organizer |
| D-17 | `/organizer/events` | organizer |
| D-18 | `/organizer/events/create` | organizer |
| D-19 | `/organizer/qr` | organizer |
| D-20 | `/organizer/attendees` | organizer |
| D-21 | `/organizer/analytics` | organizer |
| D-22 | `/organizer/certificates` | organizer |
| D-23 | `/admin/dashboard` | admin |
| D-24 | `/admin/approvals` | admin |
| D-25 | `/admin/users` | admin |
| D-26 | `/admin/role-requests` | admin |
| D-27 | `/admin/templates` | admin |
| D-28 | `/admin/analytics`, `/admin/settings`, `/admin/notifications` | admin |

Capture method: run the application locally and drive it with Playwright, per Requirement 9.3. Screens D-12 and D-13 depend on seeded event and attendance data; if that data cannot be produced, those two entries become RC_Register items rather than fabricated images.

---

## Appendix E — Code-listing inventory

### E.1 React and TypeScript tier

| Listing | File | Subject |
|---|---|---|
| E1.1 | `src/lib/supabaseClient.ts` | Client construction with `flowType: "pkce"` and `detectSessionInUrl` |
| E1.2 | `src/lib/auth.ts` | `signUpWithProfile` and `verifySignupOtp` |
| E1.3 | `src/app/student.tsx` | `parseQrValue` and the `scanFrame` decode loop |
| E1.4 | `src/lib/attendance.ts` | `recordAttendance` and its handling of Postgres error `23505` |
| E1.5 | `src/lib/certificates.ts` | `generateCertificateWithRetry` with timeout and cold-start retry |
| E1.6 | `src/app/routes/index.tsx` | The route table and role guards |
| E1.7 | `src/lib/registrations.ts` | Registration and cancellation calls into the RPCs |

### E.2 SQL and Supabase tier

| Listing | File | Subject |
|---|---|---|
| E2.1 | `supabase/migrations/20260815120000_initial_schema.sql` | `profiles` and `events` DDL with CHECK constraints |
| E2.2 | `supabase/migrations/20260816120000_rls_policies.sql` | Helper functions and the `certificates` policy set |
| E2.3 | `supabase/migrations/20260816140000_profile_creation_trigger.sql` | `handle_new_user` |
| E2.4 | `supabase/migrations/20260819120000_attendance.sql` | Unique constraint and attendance policies |
| E2.5 | `supabase/migrations/20260820120000_registrations.sql` | `register_for_event` with the row lock |
| E2.6 | `supabase/migrations/20260817120000_role_change_requests.sql` | `approve_role_change_request` |
| E2.7 | `supabase/migrations/20260821120000_notifications_events.sql` | `create_notification` and the certificate trigger |
| E2.8 | `supabase/migrations/20260822120000_event_attendees_rpc.sql` | `event_attendees` |

### E.3 Spring Boot, Java and PDFBox tier

| Listing | File | Subject |
|---|---|---|
| E3.1 | `certificate-service/.../controller/CertificateController.java` | The generate endpoint and its ordered flow |
| E3.2 | `certificate-service/.../dto/CertificateRequest.java` | Request record and `@NotBlank` validation |
| E3.3 | `certificate-service/.../controller/ValidationExceptionHandler.java` | The 400, 404, 422 and 502 mappings |
| E3.4 | `certificate-service/.../config/WebConfig.java` | CORS allow-list and origin patterns |
| E3.5 | `certificate-service/.../service/CertificatePdfService.java` | Field stamping and percentage-to-point mapping |
| E3.6 | `certificate-service/.../supabase/SupabaseClient.java` | Template fetch and certificate record insert |
| E3.7 | `certificate-service/pom.xml` and `certificate-service/Dockerfile` | Build and container definition |

Secret-bearing files — `.env.local` at the repository root and in `certificate-service/` — are excluded from every listing, per Requirement 10.6.

---

## Appendix F — Requires-Confirmation register

The Status column carries one of the three values mandated by Requirement 3 criterion 3 — `Open`, `Confirmed`, or `Refuted`. The Decision / resolution column records what was decided and by whom.

Note on register retention: Requirement 3 criterion 5 excludes from the RC_Register any entry whose identifier appears in no inline Requires_Confirmation_Marker, while Requirement 3 criterion 6 requires a resolved entry to keep its status and lose its inline markers. A `Confirmed` or `Refuted` entry is therefore retained in this register as the decision record for that statement; criterion 5's exclusion rule applies only to entries that were never inline in the first place. No criterion was amended to reach this reading.

| ID | Statement requiring confirmation | Why the repository cannot settle it | Who can confirm | Status | Decision / resolution |
|---|---|---|---|---|---|
| RC-01 | The content of SRS v1.0 | No SRS file exists in the repository. The document is supplied by the user as an attachment to the authoring conversation rather than stored in the Repository, so Legacy_Requirement_ID wording is preserved verbatim from that attachment. | Author team | Confirmed | User supplied SRS v1.0 as a document attachment. The attachment is the authoritative rendering of SRS_v1 per Requirement 1 criterion 10. Decided by the user. |
| RC-02 | The mapping from REQ-1 … REQ-32, BR-1 … BR-6 and TBD-1 … TBD-3 to their subject matter | Identifiers appear nowhere in the repository. The mapping is read from the user-supplied SRS v1.0 attachment. | Author team | Confirmed | Available verbatim from the user-supplied SRS v1.0 attachment; feeds the Identifier_Continuity_Table of Requirement 4 criterion 2. Decided by the user. |
| RC-03 | Output location and format for SRS v2.0 | Not a repository fact — a delivery choice. | User | Confirmed | Markdown master at `docs/srs/field-book-srs-v2.0.md` with a co-located assets folder at `docs/srs/assets/`, per Requirement 13 criterion 4. Mermaid diagrams are embedded in the master; a non-Markdown submission copy is derived from the master with static-image exports per Requirement 13 criteria 7 and 8. Decided by the user. |
| RC-04 | PostgreSQL major version | No version pin in migrations or configuration. | Supabase project dashboard | Open | — |
| RC-05 | Password reset link validity period | A Supabase project setting, not a repository value. | Supabase project dashboard | Open | — |
| RC-06 | Whether email confirmation is enabled | `signUpWithProfile` branches on both cases, so the code does not reveal the setting. | Supabase project dashboard | Open | — |
| RC-07 | Which production frontend origin is live | `README.md` and `render.yaml` disagree, per finding A3.8. | User | Open | — |
| RC-08 | Whether the certificate verification workflow is planned or abandoned | No implementation exists, per finding A1.1. | User | Confirmed | Planned functionality, not implemented and not abandoned. Classified `Planned` under Requirement 17 criterion 12; documented per Requirement 5 criteria 22 and 26. Decided by the user. |
| RC-09 | Whether the absence of a self-approval guard is intended | Per finding A3.7, no guard exists. | User | Refuted | Not intended. The absence is a security defect. Intended behaviour and correction are specified by Requirement 19; classified `Partially Implemented` until the corrective migration is applied. Decided by the user. |
| RC-10 | Whether the organizer self-publish path is intended | Per finding A3.6, `events_update_own_organizer` applies no status restriction. | User | Refuted | Not intended. Only admin approval may publish an event. Intended behaviour and correction are specified by Requirement 18; classified `Partially Implemented` until the corrective migration is applied. Decided by the user. |
| RC-11 | Accessibility conformance level actually achieved | No audit artifact exists. Full validation needs manual assistive-technology testing and expert review. | Author team | Open | — |
| RC-12 | Whether any performance figure in SRS v1.0 was measured | No benchmark artifact exists. | Author team | Open | — |
