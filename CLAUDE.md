# Seeds — Claude Code Instructions

Git-native issue tracker for AI agent workflows. Zero dependencies, JSONL storage, Bun runtime.

## Tech Stack

- **Runtime**: Bun (runs TypeScript directly)
- **Language**: TypeScript strict mode
- **Dependencies**: Zero runtime deps — Bun built-ins only (`Bun.file`, `Bun.write`, `node:fs`, `node:crypto`)
- **Formatting**: Biome (tabs, 100 char width)
- **Testing**: `bun test` with real I/O (no mocks)

## Quality Gates

Run before every commit:

```bash
bun test           # All tests must pass
bun run lint       # Zero errors (Biome)
bun run typecheck  # No TypeScript errors
```

## Directory Structure

```
seeds/
  src/
    index.ts              # CLI entry + command router + VERSION constant
    types.ts              # Issue, Template, Config, constants
    store.ts              # JSONL read/write/lock/atomic
    id.ts                 # ID generation
    config.ts             # YAML config load/save
    output.ts             # JSON + human output helpers
    yaml.ts               # Minimal YAML parser (flat key-value only)
    commands/
      init.ts             # sd init
      create.ts           # sd create
      show.ts             # sd show
      list.ts             # sd list
      ready.ts            # sd ready
      update.ts           # sd update
      close.ts            # sd close
      dep.ts              # sd dep add/remove/list
      sync.ts             # sd sync
      blocked.ts          # sd blocked
      stats.ts            # sd stats
      tpl.ts              # sd tpl create/step/list/show/pour/status
      migrate.ts          # sd migrate-from-beads
    store.test.ts
    id.test.ts
    yaml.test.ts
    commands/
      init.test.ts
      create.test.ts
      dep.test.ts
      tpl.test.ts
  scripts/
    version-bump.ts       # Bump version in package.json + src/index.ts
  .claude/
    commands/
      release.md          # /release slash command
  .github/
    workflows/
      ci.yml
      auto-tag.yml
```

## CLI Command Reference

```
sd init                              Initialize .seeds/
sd create --title <text>             Create issue
sd show <id>                         Show issue
sd list [--status|--type|--assignee|--limit]
sd ready                             Unblocked open issues
sd update <id> [--status|--title|--priority|--assignee|--description]
sd close <id> [--reason <text>]
sd dep add <issue> <depends-on>
sd dep remove <issue> <depends-on>
sd dep list <issue>
sd blocked
sd stats
sd sync [--status]
sd tpl create --name <text>
sd tpl step add <id> --title <text>
sd tpl list
sd tpl show <id>
sd tpl pour <id> [--prefix <text>]
sd tpl status <id>
sd migrate-from-beads
```

All commands support `--json` for structured output.

## Coding Conventions

- **Tabs**, not spaces (Biome default)
- **100 char** line width
- **`noUncheckedIndexedAccess`** enabled in tsconfig — always check array access
- **No `any`** — use proper types or `unknown`
- **Strict null checks** — handle undefined explicitly
- **No external dependencies** — Bun built-ins only

## Testing Philosophy

- Real I/O — tests create actual temp directories and run actual commands
- No mocks — test behavior, not implementation
- Colocated test files — `store.test.ts` next to `store.ts`
- Temp dirs cleaned up in `afterEach`

```typescript
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

let dir: string;
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "seeds-test-")); });
afterEach(async () => { await rm(dir, { recursive: true }); });
```

## Version Management

Version lives in two places (CI verifies they match):

- `package.json` → `"version"` field
- `src/index.ts` → `const VERSION = "X.Y.Z"`

Bump both atomically:

```bash
bun run version:bump patch   # 0.1.0 → 0.1.1
bun run version:bump minor   # 0.1.0 → 0.2.0
bun run version:bump major   # 0.1.0 → 1.0.0
```

## Storage Format

```
.seeds/
  config.yaml          # project: name, version: "1"
  issues.jsonl         # One issue per line, dedup-on-read (last wins)
  templates.jsonl      # One template per line
  .gitignore           # *.lock
```

`.gitattributes` (project root):
```
.seeds/issues.jsonl merge=union
.seeds/templates.jsonl merge=union
```

## Concurrency

Advisory locks on `.seeds/issues.jsonl.lock`:
- Stale after 30s, retry every 50ms, timeout 5s
- Mutations: acquire lock → read → mutate → write temp → rename → release
- Creates: acquire lock → append line → release

## Priority Scale

| Value | Label    |
|-------|----------|
| 0     | Critical |
| 1     | High     |
| 2     | Medium   |
| 3     | Low      |
| 4     | Backlog  |
