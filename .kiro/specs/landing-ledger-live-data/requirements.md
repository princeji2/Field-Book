# Requirements Document

## Introduction

The Fieldbook landing page shows a ledger card (in `src/app/shared.tsx`) that currently renders hard-coded sample attendees and a hard-coded event header. This feature replaces the sample data with live data from Supabase. An anonymous visitor sees the most recent event that has attendance, with up to five attendees: checked-in students first, then registered students who have not checked in.

The `profiles`, `events`, `attendance`, and `registrations` tables are protected by authenticated-only row-level security, and that protection stays unchanged. Live data is exposed to anonymous visitors only through a new `SECURITY DEFINER` RPC that returns masked, minimal fields. The existing Fieldbook design system stays frozen.

## Glossary

- **Landing_Ledger_Card**: The ledger card component in `src/app/shared.tsx` that is displayed on the landing page.
- **Ledger_RPC**: The new Postgres function, defined in a new Supabase migration, that is `SECURITY DEFINER` and granted `EXECUTE` to the `anon` role. It returns the landing ledger payload.
- **Migration**: The new SQL file under `supabase/migrations/` whose timestamp is later than `20260907120000`.
- **Featured_Event**: The event with the most recent attendance record (`attendance.recorded_at`).
- **Ledger_Row**: One attendee entry shown in the Landing_Ledger_Card.
- **Checked_In_Attendee**: A student who has an `attendance` row for the Featured_Event.
- **Registered_Attendee**: A student who has a `registrations` row for the Featured_Event and no `attendance` row for it.
- **Display_Name**: The first name followed by a space and the last-name initial and a period, for example "Prince N.".
- **Masked_ID**: The one uppercase initial per name word (up to 3), a hyphen, then the last 4 characters of the profile UUID in uppercase, for example "PN-7F2A".
- **Ledger_ID**: A display identifier derived from the Featured_Event id and the Featured_Event date.
- **Pinned_Student**: The student Prince Naruka, identified inside the Ledger_RPC by full name or email lookup.
- **Fallback_Data**: The existing hard-coded sample header and attendee array currently in `src/app/shared.tsx`.
- **Frontend_Client**: The Supabase client code in the Vite/React frontend that calls the Ledger_RPC.
- **Design_System**: The frozen Fieldbook design system (palette, typography, borders, motion, Seal).

## Requirements

### Requirement 1: Safe anonymous data access

**User Story:** As an anonymous visitor, I want the landing ledger to read from the database safely, so that I see real activity without exposing private data.

#### Acceptance Criteria

1. THE Migration SHALL define the Ledger_RPC as a `SECURITY DEFINER` function with a fixed `search_path`.
2. THE Migration SHALL grant `EXECUTE` on the Ledger_RPC to the `anon` and `authenticated` roles.
3. THE Migration SHALL leave all existing row-level security policies on `profiles`, `events`, `attendance`, and `registrations` unchanged.
4. THE Migration SHALL use a timestamp later than `20260907120000` in its file name.
5. THE Migration SHALL follow the function, grant, and revoke patterns used in `20260822120000_event_attendees_rpc.sql`.
6. THE Ledger_RPC SHALL return only the event title, event date, event venue, event code, Ledger_ID, and a list of Ledger_Rows containing Display_Name, Masked_ID, check-in status, and check-in timestamp.
7. THE Ledger_RPC SHALL omit email addresses, full names, and full profile UUIDs from the returned payload.

### Requirement 2: Featured event selection

**User Story:** As a visitor, I want the card to show the most recent event with activity, so that the ledger looks current.

#### Acceptance Criteria

1. THE Ledger_RPC SHALL select as Featured_Event the event that has the attendance row with the latest `recorded_at`.
2. THE Ledger_RPC SHALL return the Featured_Event title, `event_date`, venue, and `events.code` from the real event row.
3. THE Ledger_RPC SHALL derive the Ledger_ID from the Featured_Event id and `event_date`.
4. IF no event has an attendance row, THEN THE Ledger_RPC SHALL return an empty result.

### Requirement 3: Attendee selection and masking

**User Story:** As a visitor, I want a short, meaningful attendee list, so that the card shows both verified and pending students.

#### Acceptance Criteria

1. THE Ledger_RPC SHALL return at most 5 Ledger_Rows.
2. THE Ledger_RPC SHALL order Checked_In_Attendees before Registered_Attendees.
3. THE Ledger_RPC SHALL order Checked_In_Attendees by `attendance.recorded_at` descending.
4. WHEN the Featured_Event has fewer than 5 Checked_In_Attendees, THE Ledger_RPC SHALL fill the remaining rows with Registered_Attendees.
5. THE Ledger_RPC SHALL return each Ledger_Row with a Display_Name and a Masked_ID computed from `profiles.full_name` and `profiles.id`.
6. IF a profile has a single-word full name, THEN THE Ledger_RPC SHALL return the single word as the Display_Name without an initial.
7. THE Ledger_RPC SHALL treat a student with both an `attendance` row and a `registrations` row as a Checked_In_Attendee exactly once.

### Requirement 4: Pinned student

**User Story:** As the project owner, I want Prince Naruka to appear on the card, so that the landing ledger always features the owner.

#### Acceptance Criteria

1. WHERE the Pinned_Student has a profile, THE Ledger_RPC SHALL include the Pinned_Student in the returned Ledger_Rows.
2. WHERE the Pinned_Student is included, THE Ledger_RPC SHALL place the Pinned_Student first among the Ledger_Rows of the Pinned_Student's status group.
3. WHERE the Pinned_Student is included, THE Ledger_RPC SHALL keep the total number of Ledger_Rows at or below 5.
4. THE Ledger_RPC SHALL identify the Pinned_Student by looking up the profile by full name or email.
5. THE Frontend_Client SHALL contain no hard-coded reference to the Pinned_Student for selection or ordering.
6. IF no profile matches the Pinned_Student lookup, THEN THE Ledger_RPC SHALL return the Ledger_Rows without a Pinned_Student.

### Requirement 5: Live card rendering

**User Story:** As a visitor, I want the card header and rows to display the live values, so that the card reflects the database.

#### Acceptance Criteria

1. WHEN the Ledger_RPC returns data, THE Landing_Ledger_Card SHALL render the event title, event date, venue, event code, and Ledger_ID in the header.
2. WHEN the Ledger_RPC returns data, THE Landing_Ledger_Card SHALL render one row per Ledger_Row showing Display_Name, Masked_ID, and check-in timestamp.
3. WHILE a Ledger_Row is a Checked_In_Attendee, THE Landing_Ledger_Card SHALL render the verified indicator from the Design_System.
4. WHILE a Ledger_Row is a Registered_Attendee, THE Landing_Ledger_Card SHALL render the pending indicator from the Design_System.
5. THE Landing_Ledger_Card SHALL display the Ledger_Rows in the order returned by the Ledger_RPC.

### Requirement 6: Loading and fallback behavior

**User Story:** As a visitor, I want the card to handle loading and failure gracefully, so that the landing page always looks complete.

#### Acceptance Criteria

1. WHILE the Frontend_Client awaits the Ledger_RPC response, THE Landing_Ledger_Card SHALL render a loading state built from Design_System elements.
2. IF the Ledger_RPC call returns an error, THEN THE Landing_Ledger_Card SHALL render the Fallback_Data.
3. IF the Ledger_RPC returns an empty result, THEN THE Landing_Ledger_Card SHALL render the Fallback_Data.
4. WHEN the Ledger_RPC call does not respond within 8 seconds, THE Frontend_Client SHALL treat the call as an error.
5. IF the Ledger_RPC call fails, THEN THE Frontend_Client SHALL log the error to the browser console without displaying an error message to the visitor.
6. WHEN the Frontend_Client environment lacks Supabase configuration, THE Landing_Ledger_Card SHALL render the Fallback_Data.

### Requirement 7: Responsive grid layout

**User Story:** As a visitor on any device, I want the ledger layout to stay aligned, so that the card is readable.

#### Acceptance Criteria

1. WHILE the viewport width is 640 px or wider, THE Landing_Ledger_Card SHALL render the column header row and each Ledger_Row on a 3-column grid.
2. WHILE the viewport width is below 640 px, THE Landing_Ledger_Card SHALL stack the columns of each Ledger_Row vertically.
3. THE Landing_Ledger_Card SHALL align each Ledger_Row column with the matching column in the header row.

### Requirement 8: Design system preservation

**User Story:** As the design owner, I want the Fieldbook design system preserved, so that the visual identity does not change.

#### Acceptance Criteria

1. THE Landing_Ledger_Card SHALL use only the colors, typefaces, borders, motion, and icons defined in the Design_System.
2. THE Landing_Ledger_Card SHALL use no shadows, blurs, or gradients.
3. THE Landing_Ledger_Card SHALL apply the standard mount motion of fade in with an 8 px rise to the ledger rows.
4. WHEN the Landing_Ledger_Card renders live or fallback data, THE Landing_Ledger_Card SHALL keep the existing card surface, header, and ledger row patterns.

### Requirement 9: Verification and handoff

**User Story:** As a developer, I want verification and handoff material, so that I can confirm and reproduce the change.

#### Acceptance Criteria

1. WHEN the change is complete, THE TypeScript check (`tsc`) SHALL finish with zero errors.
2. WHEN the change is complete, THE Vite production build SHALL finish successfully.
3. WHEN the change is complete, THE Playwright MCP run on the landing page SHALL confirm the card loads, the header and rows render, and the browser console shows no unexpected errors.
4. WHEN the work is delivered, THE final report SHALL list the files changed, the Migration SQL, and the local test steps.
