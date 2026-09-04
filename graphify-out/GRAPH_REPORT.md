# Graph Report - Field Book  (2026-09-02)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1281 nodes · 2174 edges · 147 communities (48 shown, 66 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 42 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6222f8cc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.tsx
- TemplateField
- SupabaseClient
- templates.tsx
- sidebar.tsx
- carousel.tsx
- package.json
- organizer.tsx
- student.tsx
- compilerOptions
- users.tsx
- profile.tsx
- command.tsx
- analytics.tsx
- events.ts
- compilerOptions
- shared.tsx
- login.tsx
- auth.ts
- dependencies
- DotEnvEnvironmentPostProcessor
- dashboard.tsx
- SignupPage
- WebConfig
- form.tsx
- approvals.ts
- EventsWorkspaceScreen
- 20260815120000_initial_schema.sql
- admin.tsx
- approvals.tsx
- roleRequests.tsx
- shell.tsx
- sheet.tsx
- certificates.ts
- roleRequests.ts
- chart.tsx
- settings.tsx
- ScannerScreen
- navigation-menu.tsx
- UsersScreen
- notifications.tsx
- signOutUser
- toggle-group.tsx
- CertificateTemplatesScreen
- CertIssuanceModal
- OrgQRScreen
- OrgCertificatesScreen
- 20260817120000_role_change_requests.sql
- vercel.json
- alert.tsx
- 20260816120000_rls_policies.sql
- public.attendance
- 20260816140000_profile_creation_trigger.sql
- ErrorBoundary
- public.platform_activity
- badge.tsx
- CountUp
- public.audit_log
- tsconfig.json
- class-variance-authority
- clsx
- cmdk
- date-fns
- embla-carousel-react
- @emotion/react
- @emotion/styled
- input-otp
- jsqr
- lucide-react
- @mui/icons-material
- @mui/material
- next-themes
- pdfjs-dist
- @popperjs/core
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-day-picker
- react-dnd
- react-dnd-html5-backend
- react-hook-form
- react-popper
- react-resizable-panels
- react-responsive-masonry
- react-router
- react-slick
- recharts
- sonner
- tailwind-merge
- tw-animate-css
- vaul
- EventQRCode
- OrgAttendeesScreen
- com.fieldbook:certificate-service
- public.certificates

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 40 edges
2. `useScreenNav()` - 38 edges
3. `signOutUser()` - 31 edges
4. `SupabaseClient` - 23 edges
5. `TemplateField` - 21 edges
6. `CertificateTemplate` - 20 edges
7. `Screen` - 20 edges
8. `SupabaseProperties` - 18 edges
9. `TemplateEditor()` - 18 edges
10. `dotGrid` - 18 edges

## Surprising Connections (you probably didn't know these)
- `handleNav()` --calls--> `signOutUser()`  [EXTRACTED]
  src/app/organizer.tsx → src/lib/auth.ts
- `handleNav()` --calls--> `signOutUser()`  [EXTRACTED]
  src/app/organizer.tsx → src/lib/auth.ts
- `handleNav()` --calls--> `signOutUser()`  [EXTRACTED]
  src/app/organizer.tsx → src/lib/auth.ts
- `CertificateController` --references--> `CertificatePdfService`  [EXTRACTED]
  certificate-service/src/main/java/com/fieldbook/certificateservice/controller/CertificateController.java → certificate-service/src/main/java/com/fieldbook/certificateservice/service/CertificatePdfService.java
- `AdminApproval` --references--> `AppRole`  [EXTRACTED]
  src/lib/approvals.ts → src/lib/auth.ts

## Import Cycles
- None detected.

## Communities (147 total, 66 thin omitted)

### Community 0 - "index.tsx"
Cohesion: 0.09
Nodes (51): App(), AdminAnalyticsRoute(), AdminApprovalsRoute(), AdminDashboardRoute(), AdminNotificationsRoute(), AdminRoleRequestsRoute(), AdminSettingsRoute(), AdminTemplatesRoute() (+43 more)

### Community 1 - "TemplateField"
Cohesion: 0.06
Nodes (21): CertificateTemplate, TemplateField, CertificateFonts, Role, MONO, SANS, SERIF, CertificatePdfService (+13 more)

### Community 2 - "SupabaseClient"
Cohesion: 0.07
Nodes (23): SupabaseProperties, CertificateController, ValidationExceptionHandler, CertificateRequest, CertificateResponse, SupabaseIntegrationException, TemplateNotFoundException, CertificateStorageService (+15 more)

### Community 3 - "templates.tsx"
Cohesion: 0.07
Nodes (26): canvasToPngFile(), CertTemplate, DEFAULT_FIELDS, FONT_STYLE, INITIAL_TEMPLATES, PREVIEW_SAMPLE, readImageAspectRatio(), SIZE_CLASS (+18 more)

### Community 4 - "sidebar.tsx"
Cohesion: 0.07
Nodes (17): Input(), Separator(), Sidebar(), SidebarContext, SidebarContextProps, SidebarMenuButton(), sidebarMenuButtonVariants, SidebarProvider() (+9 more)

### Community 5 - "carousel.tsx"
Cohesion: 0.07
Nodes (19): AlertDialogAction(), AlertDialogCancel(), Button(), buttonVariants, Calendar(), CarouselApi, CarouselContent(), CarouselContext (+11 more)

### Community 6 - "package.json"
Cohesion: 0.06
Nodes (35): devDependencies, tailwindcss, @tailwindcss/vite, @types/node, @types/react-dom, typescript, vite, @vitejs/plugin-react (+27 more)

### Community 7 - "organizer.tsx"
Cohesion: 0.06
Nodes (25): ANALYTICS_EVENTS, ATTENDANCE_DATA, Attendee, AttendeeCertStatus, ATTENDEES_BY_EVENT, AttendeeStatus, CATEGORY_BANNER, CERT_EVENT_DATA (+17 more)

### Community 8 - "student.tsx"
Cohesion: 0.06
Nodes (23): CATEGORIES, CATEGORY_HERO, CATEGORY_ICONS, CERT_ACCENT, CERT_RECORDS, CertCard(), CertDetailOverlay(), CertificatesScreen() (+15 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): DOM, DOM.Iterable, ES2020, src, vite/client, compilerOptions, allowImportingTsExtensions, isolatedModules (+15 more)

### Community 10 - "users.tsx"
Cohesion: 0.13
Nodes (16): UserRole, ALL_ROLES, EditRoleModal(), InviteUserModal(), PLATFORM_USERS, PlatformUser, REAL_USER_PLACEHOLDER, handleEditRole() (+8 more)

### Community 11 - "profile.tsx"
Cohesion: 0.12
Nodes (13): appRoleToProfileRole(), ProfileRole, profileRoleToAppRole(), ProfileScreen(), handleRemovePhoto(), handleSave(), handleSubmitRoleRequest(), markDirty() (+5 more)

### Community 12 - "command.tsx"
Cohesion: 0.12
Nodes (5): Dialog(), DialogContent(), DialogDescription(), DialogHeader(), DialogTitle()

### Community 13 - "analytics.tsx"
Cohesion: 0.11
Nodes (17): ADMIN_DATE_RANGE_OPTIONS, AdminDateRange, ENGAGEMENT_BY_ROLE, GROWTH_DATA, TOP_EVENTS_PLATFORM, TOP_ORGANIZERS, ForCampusesPage(), NOTE: All copy on this page is PLACEHOLDER content aimed at institutional (+9 more)

### Community 14 - "events.ts"
Cohesion: 0.14
Nodes (15): EventDetailScreen(), ExploreScreen(), StudentDashboard(), EventRow, fetchOrganizerNames(), getEventById(), GetEventResult, getStudentEventById() (+7 more)

### Community 15 - "compilerOptions"
Cohesion: 0.11
Nodes (18): ES2023, node, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module (+10 more)

### Community 16 - "shared.tsx"
Cohesion: 0.15
Nodes (15): AuthCard(), AuthHeader(), CertificateSeal(), DemoCert(), DemoCreate(), DemoScan(), EBState, getPasswordScore() (+7 more)

### Community 20 - "login.tsx"
Cohesion: 0.16
Nodes (13): AdminLoginScreen(), handleGoogleSignIn(), handleSubmit(), DEMO_ROLE_OPTIONS, MASCOT_DEFS, MascotTrio(), PAW_EASE, RoleOption (+5 more)

### Community 21 - "auth.ts"
Cohesion: 0.16
Nodes (15): ResetCallbackRoute(), handleSubmit(), handleResendOtp(), hasActiveSession(), otpErrorMessage(), RequestPasswordResetResult, resendSignupOtp(), ResendSignupOtpResult (+7 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): canvas-confetti, motion, dependencies, canvas-confetti, motion, @radix-ui/react-context-menu, @radix-ui/react-hover-card, @radix-ui/react-scroll-area (+7 more)

### Community 23 - "DotEnvEnvironmentPostProcessor"
Cohesion: 0.21
Nodes (8): CertificateServiceApplication, DotEnvEnvironmentPostProcessor, Override, org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.boot.env.EnvironmentPostProcessor, org.springframework.boot.SpringApplication, org.springframework.core.env.ConfigurableEnvironment, org.springframework.core.Ordered

### Community 24 - "dashboard.tsx"
Cohesion: 0.21
Nodes (12): ACTIVITY_ICONS, activityIcon(), ADMIN_PLATFORM_METRICS, ADMIN_QUICK_LINKS, AdminDashboard(), ActivityCategory, formatActivityAge(), ListActivityResult (+4 more)

### Community 25 - "SignupPage"
Cohesion: 0.17
Nodes (11): ForgotPage(), handleResend(), handleSubmit(), validateEmail(), SignupPage(), handleSubmit(), handleVerifyOtp(), getCurrentUserProfile() (+3 more)

### Community 26 - "WebConfig"
Cohesion: 0.23
Nodes (8): SupabaseConfig, Override, WebConfig, org.springframework.boot.context.properties.EnableConfigurationProperties, org.springframework.context.annotation.Bean, org.springframework.context.annotation.Configuration, org.springframework.web.servlet.config.annotation.CorsRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer

### Community 27 - "form.tsx"
Cohesion: 0.20
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItemContext, FormItemContextValue, FormLabel(), FormMessage() (+2 more)

### Community 28 - "approvals.ts"
Cohesion: 0.19
Nodes (13): runApprove(), runReject(), logActivity(), AdminApproval, ApprovalStatus, approveEventApproval(), ListApprovalsResult, rejectEventApproval() (+5 more)

### Community 29 - "EventsWorkspaceScreen"
Cohesion: 0.23
Nodes (11): EventsWorkspaceScreen(), buildEventPayload(), goBack(), handlePublish(), handleSaveDraft(), refreshEvents(), validateForm(), loadEvents() (+3 more)

### Community 30 - "20260815120000_initial_schema.sql"
Cohesion: 0.28
Nodes (11): auth.users, public.set_updated_at, public.approvals, public.certificate_templates, public.certificates, public.events, public.notifications, public.profiles (+3 more)

### Community 31 - "admin.tsx"
Cohesion: 0.17
Nodes (7): AdminProfileScreen(), AdminRoleConfirmScreen(), handleSelect(), triggerConfirm(), AdminNotifsScreen(), AdminSettingsScreen(), RoleBadge()

### Community 32 - "approvals.tsx"
Cohesion: 0.21
Nodes (10): ApprovalsScreen(), ApprovalTab, initialsOf(), STATUS_TO_TAB, TYPE_COLORS, TYPE_LABELS, venueLabel(), ApprovalType (+2 more)

### Community 33 - "roleRequests.tsx"
Cohesion: 0.24
Nodes (12): formatDateTime(), initialsOf(), RequestTab, RoleRequestsScreen(), doApprove(), doReject(), STATUS_TO_TAB, approveRoleChangeRequest() (+4 more)

### Community 34 - "shell.tsx"
Cohesion: 0.17
Nodes (9): ADMIN_NAV_ITEMS, AdminAppShell(), AdminNavId, ROLE_CONFIG, SWITCH_ACCOUNTS, OrgAppShell(), AppShell(), SidebarFrame() (+1 more)

### Community 35 - "sheet.tsx"
Cohesion: 0.24
Nodes (10): Sheet(), SheetClose(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle() (+2 more)

### Community 36 - "certificates.ts"
Cohesion: 0.27
Nodes (10): MyEventsScreen(), handleGetCertificate(), fetchWithTimeout(), generateCertificate(), generateCertificateCode(), GenerateCertificateParams, GenerateCertificateResult, generateCertificateWithRetry() (+2 more)

### Community 37 - "roleRequests.ts"
Cohesion: 0.23
Nodes (11): AdminRoleChangeRequest, createRoleChangeRequest(), CreateRoleChangeRequestResult, getMyRoleChangeRequests(), GetMyRoleChangeRequestsResult, ListRoleChangeRequestsResult, ResolveRoleChangeRequestResult, RoleChangeRequest (+3 more)

### Community 38 - "chart.tsx"
Cohesion: 0.25
Nodes (8): ChartConfig, ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), getPayloadConfigFromPayload(), THEMES, useChart()

### Community 41 - "settings.tsx"
Cohesion: 0.18
Nodes (6): CERT_TEMPLATES_LIST, SETTINGS_DEFAULTS, SettingsState, InlineSeal(), AuthedProfile, AuthContextValue

### Community 42 - "ScannerScreen"
Cohesion: 0.31
Nodes (10): parseQrValue(), ScannerScreen(), doRecordAttendance(), handleImageUpload(), handleManualSubmit(), processScannedCode(), requestScanFrame(), scanFrame() (+2 more)

### Community 44 - "UsersScreen"
Cohesion: 0.20
Nodes (4): formatJoined(), toPlatformUser(), UsersScreen(), listUsers()

### Community 46 - "notifications.tsx"
Cohesion: 0.22
Nodes (7): ADMIN_NOTIF_CATEGORY_COLORS, ADMIN_NOTIF_CATEGORY_LABELS, ADMIN_NOTIFS, AdminNotifCategory, AdminNotifItem, NOTIF_GROUPS, NotifGroup

### Community 49 - "signOutUser"
Cohesion: 0.32
Nodes (8): AdminAnalyticsScreen(), OrgAnalyticsScreen(), handleNav(), OrganizerDashboard(), handleNav(), OrgProfileScreen(), parseMetricNum(), signOutUser()

### Community 50 - "toggle-group.tsx"
Cohesion: 0.43
Nodes (4): ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 52 - "CertIssuanceModal"
Cohesion: 0.33
Nodes (4): CertIssuanceModal(), tick(), DecimalCountUp(), tick()

### Community 53 - "OrgQRScreen"
Cohesion: 0.33
Nodes (5): OrgQRScreen(), handleNav(), capitalizeStatus(), formatEventTime(), formatEventTimeRange()

### Community 55 - "20260817120000_role_change_requests.sql"
Cohesion: 0.33
Nodes (3): public.role_change_requests, public, public.profiles

### Community 56 - "vercel.json"
Cohesion: 0.33
Nodes (5): buildCommand, framework, installCommand, outputDirectory, rewrites

### Community 63 - "public.attendance"
Cohesion: 0.40
Nodes (4): public.attendance, public, public.events, public.profiles

### Community 70 - "public.platform_activity"
Cohesion: 0.50
Nodes (3): public.platform_activity, public.events, public.profiles

## Knowledge Gaps
- **258 isolated node(s):** `AdminUiContextValue`, `PlatformUser`, `UserStatus`, `ListUsersResult`, `UpdateUserRoleResult` (+253 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 626 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **66 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `signOutUser()` connect `signOutUser` to `templates.tsx`, `organizer.tsx`, `OrgAttendeesScreen`, `users.tsx`, `analytics.tsx`, `shared.tsx`, `login.tsx`, `auth.ts`, `dashboard.tsx`, `EventsWorkspaceScreen`, `admin.tsx`, `approvals.tsx`, `roleRequests.tsx`, `shell.tsx`, `settings.tsx`, `UsersScreen`, `notifications.tsx`, `CertificateTemplatesScreen`, `OrgQRScreen`, `OrgCertificatesScreen`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `react-responsive-masonry`, `react-router`, `react-slick`, `recharts`, `sonner`, `tailwind-merge`, `package.json`, `tw-animate-css`, `vaul`, `class-variance-authority`, `clsx`, `cmdk`, `date-fns`, `embla-carousel-react`, `@emotion/react`, `@emotion/styled`, `input-otp`, `jsqr`, `lucide-react`, `@mui/icons-material`, `@mui/material`, `next-themes`, `pdfjs-dist`, `@popperjs/core`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dnd`, `react-dnd-html5-backend`, `react-hook-form`, `react-popper`, `react-resizable-panels`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `AdminUiContextValue`, `PlatformUser`, `UserStatus` to the rest of the system?**
  _258 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0937625754527163 - nodes in this community are weakly interconnected._
- **Should `TemplateField` be split into smaller, more focused modules?**
  _Cohesion score 0.05548654244306418 - nodes in this community are weakly interconnected._
- **Should `SupabaseClient` be split into smaller, more focused modules?**
  _Cohesion score 0.0673076923076923 - nodes in this community are weakly interconnected._
- **Should `templates.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06666666666666667 - nodes in this community are weakly interconnected._