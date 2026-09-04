---
inclusion: always
---

# Field Book Development Workflow

This is the standing workflow for EVERY development task in this project. Use the available
developer tools (Graphify, Codebase MCP, Playwright MCP) intelligently instead of guessing about
the codebase. Prefer evidence from the actual codebase and tools over assumptions.

## 1. Before making changes

### Step 1 — Understand the architecture
- Query **Graphify FIRST**. Use the appropriate commands:
  - `graphify query "<question>"`
  - `graphify explain "<concept>"`
  - `graphify path "<A>" "<B>"`
  - `graphify god-nodes`
- For larger/shared changes, run `graphify affected "<symbol>"`.
- Use Graphify to understand relationships, dependencies, affected components, services, and data
  flow before editing code.

### Step 2 — Locate the exact implementation
Use **Codebase MCP** to identify the exact files, components, functions, services, and existing
patterns involved:
- `get_stack`
- `get_structure`
- `search_components`
- `get_conventions`
- `get_git_history`

### Step 3 — Reuse before creating
- Search for existing functionality before implementing anything new.
- Reuse existing components, hooks, utilities, services, types, API functions, and patterns
  whenever possible.
- Do NOT duplicate functionality unnecessarily.

### Step 4 — Preserve architecture
- Follow the existing project architecture and conventions.
- Treat the existing **Fieldbook design system as FROZEN** unless the user explicitly requests a
  design-system change.
- Do not introduce a new library, pattern, component system, or architecture when an existing
  solution already works.

### Step 5 — Minimize the change
- Make the smallest clean change that fully solves the requested task.
- Do not refactor unrelated code.
- Do not modify unrelated files.
- Do not "improve" unrelated parts of the application.

## 2. Implementation

Follow this sequence: **UNDERSTAND → GRAPHIFY → CODEBASE SEARCH → PLAN → IMPLEMENT**

Before editing:
1. Explain briefly what you found.
2. Identify affected files/components/services.
3. State the implementation plan.
4. Then make the changes.

When implementing:
- Follow existing naming and coding conventions.
- Preserve backward compatibility unless the requested change requires otherwise.
- Keep TypeScript types correct.
- Reuse existing UI components and styling patterns.
- Keep frontend/backend boundaries intact.
- Do not remove working functionality unless explicitly required.

## 3. After making changes

### Step 6 — Re-verify with Codebase MCP
Re-check affected components/functions/dependencies using Codebase MCP.

### Step 7 — Run appropriate checks
- **Frontend:** TypeScript check (`tsc`) and a Vite production build (`vite build` / `npm run build`).
- **`certificate-service`:** the appropriate Maven verification/build commands (e.g. `mvn verify`).
- Do not consider a task complete merely because the code was edited.

## 4. UI / user-flow changes

If the change affects UI, navigation, forms, interactions, or user flows:
1. Start the application: `npm run dev`
2. Use: `http://localhost:5173`
3. Use **Playwright MCP** to test the actual application.
4. Verify:
   - Page loads successfully
   - No unexpected console errors
   - The changed interaction works
   - Navigation works
   - Forms/interactions work where applicable
   - Responsive behavior works when the layout is affected
5. If Playwright finds a failure: **diagnose → fix → rebuild/retest**.

Do NOT simply report a failure without attempting to fix it. Ignore harmless known issues such as a
missing `favicon.ico` only when they are genuinely unrelated to the requested change.

## 5. Larger / shared changes

For changes involving shared components, hooks, utilities, services, or architecture:
1. Use Graphify to identify affected areas.
2. Run `graphify affected "<symbol>"`.
3. Review the dependency/impact results before editing.
4. Re-run relevant Graphify queries after implementation.

If the project structure changes significantly, regenerate/update the graph — preferably
`graphify update .`, or if necessary `graphify extract . --code-only --force` followed by the
appropriate clustering step (`graphify cluster-only .`).

Do not regenerate the entire graph unnecessarily for tiny changes.

## 6. Final verification

Every task must end with:
- **What changed** — concise summary of the implementation.
- **Files changed** — exact files modified/created/deleted.
- **Why** — why each relevant change was necessary.
- **Tests/checks** — TypeScript, Vite build, Maven checks when applicable, and any other relevant
  verification.
- **Playwright results** — include when UI/user-flow testing was applicable; state what was tested
  and whether it passed.
- **Remaining issues** — clearly list anything that could not be verified or remains unresolved. If
  there are no remaining issues, explicitly state that.

## Important rules
- Do not skip Graphify before making architectural/shared changes.
- Do not skip Codebase MCP when locating existing implementation.
- Do not skip Playwright for UI/user-flow changes.
- Do not make unrelated changes.
- Do not recreate functionality that already exists.
- Do not redesign the Fieldbook UI unless explicitly requested.
- Do not claim something was tested if it was not actually tested.
- When a test fails, investigate and fix it before reporting the task as complete.
- Prefer evidence from the actual codebase and tools over assumptions.
