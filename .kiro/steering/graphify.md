---
inclusion: always
---

graphify: A knowledge graph of this project lives in `graphify-out/`. For codebase, architecture, or dependency questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"` (or `graphify path "<A>" "<B>"` / `graphify explain "<concept>"`). These return a scoped subgraph, usually much smaller than `GRAPH_REPORT.md` or raw grep output. Read `GRAPH_REPORT.md` only for broad architecture review or when those commands do not surface enough context.

<!-- fieldbook project notes (appended manually) -->
Project layout: Vite/React/TypeScript frontend in `src/`, a Java Spring Boot `certificate-service/`, and Supabase SQL under `supabase/`.

This graph was built in code-only mode (no LLM API key required). To regenerate/update it after code changes, run from the project root:

```
graphify update .          # incremental: re-extract only changed files
graphify extract . --code-only --force   # full rebuild (also picks up SQL; needs graphifyy[sql])
graphify cluster-only .    # regenerate GRAPH_REPORT.md + graph.html
```

Communities are unnamed ("Community N") placeholders because no LLM backend is configured. Set `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) and run `graphify label .` to give them plain-language names.
