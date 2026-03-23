# AGENTS.md

This file provides essential instructions for agentic coding agents (like opencode)
operating in this repository. Always consult this file before making changes.
Run lint/typecheck after every task. Never commit without explicit user request.

## Project Status
- Repository: Empty (no files, no git repo as of last check).
- Languages: None detected. Follow standard practices for new projects.
- No .cursor/rules/, .cursorrules, .github/copilot-instructions.md found.

## Build/Lint/Test Commands
No project-specific scripts found (no package.json, pyproject.toml, etc.).
Use these generic commands based on detected languages. Initialize project first.

### Node.js/JavaScript/TypeScript
```
npm init -y
npm install --save-dev typescript @types/node eslint prettier jest ts-jest @types/jest
npx tsc --init  # Generate tsconfig.json
```
- **Lint**: `npm run lint` or `eslint src/ --fix`
  - Single file: `eslint src/file.ts --fix`
- **Typecheck**: `npm run typecheck` or `tsc --noEmit`
- **Format**: `npm run format` or `prettier --write src/`
- **Build**: `npm run build` or `tsc`
- **Test all**: `npm test` or `jest`
- **Single test**: `npm test -- src/file.test.ts` or `jest src/file.test.ts`
- **Watch tests**: `jest --watch`

### Python
```
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
pip install ruff pytest black mypy
ruff check --init
```
- **Lint**: `ruff check . --fix`
  - Single file: `ruff check src/file.py --fix`
- **Format**: `black .`
  - Single file: `black src/file.py`
- **Typecheck**: `mypy src/`
- **Test all**: `pytest`
- **Single test**: `pytest tests/test_file.py::test_function` or `pytest tests/test_file.py -k test_function`
- **Watch tests**: `pytest-watch src/`

### Rust
```
cargo new .
cargo add --dev ruff  # Wait, use clippy
```
- **Lint**: `cargo clippy --fix --allow-staged`
- **Format**: `cargo fmt`
- **Test all**: `cargo test`
- **Single test**: `cargo test test_function`
- **Build**: `cargo build --release`

### Go
```
go mod init example.com/project
go install golangci-lint@latest
```
- **Lint**: `golangci-lint run ./...`
- **Format**: `go fmt ./...`
- **Test all**: `go test ./...`
- **Single test**: `go test . -run TestFunction`

### Generic Makefile (if Makefile exists)
```
make lint
make test
make build
make test-single TEST=src/file.test.ts
```

**Post-Change Workflow** (MANDATORY):
1. Run lint: `npm run lint` (or equiv.)
2. Run typecheck: `tsc --noEmit` (or equiv.)
3. Run tests: `npm test`
4. Fix any failures before proceeding.
If commands unknown, ask user & add to this file.

## Code Style Guidelines

### General
- **Naming Conventions**:
  | Language | Variables/Functions | Classes/Components | Constants | Files |
  |----------|---------------------|--------------------|-----------|-------|
  | JS/TS   | camelCase          | PascalCase        | UPPER_SNAKE_CASE | kebab-case |
  | Python  | snake_case         | PascalCase        | UPPER_SNAKE_CASE | snake_case.py |
  | Rust    | snake_case         | PascalCase        | UPPER_SNAKE_CASE | snake_case.rs |
  | Go      | camelCase          | PascalCase        | UPPER_CASE      | file_name.go |
- **Indentation**: 2 spaces (no tabs unless .editorconfig specifies).
- **Line Length**: 100 chars max.
- **Trailing Commas**: Always in JS/TS objects/arrays.
- **Quotes**: Single quotes for JS/TS strings; double for HTML attrs.
- **Semicolons**: Always in JS/TS.

### Imports
- **JS/TS**:
  ```ts
  // Preferred: Absolute with paths in tsconfig.json
  import { Button } from '@/components/Button';
  // Group: Third-party, then local
  import React from 'react';
  import { useQuery } from '@tanstack/react-query';
  import { fetchUser } from '@/api/user';
  ```
  - No relative deep imports (`../../../`).
  - Sort alphabetically.
- **Python**:
  ```py
  # Stdlib first, then third-party, then local
  import os
  import sys
  from typing import Optional
  import requests
  from myapp.utils import helper
  ```
  - Use absolute imports.
  - isort for sorting.
- Avoid wildcard imports (`import *`).

### Formatting
- **JS/TS**: Prettier + ESLint.
  - .prettierrc: `semi: true, singleQuote: true, trailingComma: "es5"`
- **Python**: Black + isort.
  - Line length 88 (black default).
- **Rust**: rustfmt.
- **Go**: gofmt.

### Types
- **TS**: Strict mode. No `any`. Use interfaces over types for objects.
  ```ts
  interface User { id: string; name: string; }
  const user: User = { ... };
  ```
- **Python**: Use typing (List, Dict, Optional). mypy strict.
- Prefer explicit returns over undefined.

### Error Handling
- **JS/TS**:
  ```ts
  try {
    await apiCall();
  } catch (error) {
    console.error('API call failed:', error);
    throw new Error('Failed to fetch user');
  }
  ```
  - Custom errors: Extend Error.
  - No silent fails.
- **Python**:
  ```py
  try:
      result = api_call()
  except requests.RequestException as e:
      logger.error(f"API call failed: {e}")
      raise ValueError("Failed to fetch user") from e
  ```
  - Use logging, not print.
  - Chain exceptions with `raise ... from e`.
- Validate inputs early.

### Components (React/Vue/Svelte)
- Functional components only.
- Props: Typed, default values.
- Hooks: Custom hooks for logic.
- No business logic in UI files.

### Git Conventions
- Commit messages: &lt;type&gt;: &lt;short summary&gt;
  - feat: new feature
  - fix: bug fix
  - chore: build/lint/docs
- Branch: feature/xyz, bugfix/abc
- No force push to main.

### Security
- Never log/hardcode secrets.
- Sanitize user input.
- Use prepared statements for SQL.

### Testing
- 80%+ coverage.
- Unit: Pure functions.
- Integration: API/DB.
- E2E: Cypress/Playwright.
- Test names: `shouldReturnTrueWhenCondition()`

## Verification Commands
After changes:
```bash
git status
git diff
npm run lint && npm run typecheck && npm test  # Adapt to lang
```

## Cursor/Copilot Rules
None found. Follow above guidelines.

Last Updated: Sun Mar 22 2026

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:ca08a54f -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

<!-- mulch:start -->
## Project Expertise (Mulch)
<!-- mulch-onboard-v:1 -->

This project uses [Mulch](https://github.com/jayminwest/mulch) for structured expertise management.

**At the start of every session**, run:
```bash
mulch prime
```

This injects project-specific conventions, patterns, decisions, and other learnings into your context.
Use `mulch prime --files src/foo.ts` to load only records relevant to specific files.

**Before completing your task**, review your work for insights worth preserving — conventions discovered,
patterns applied, failures encountered, or decisions made — and record them:
```bash
mulch record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
```

Link evidence when available: `--evidence-commit <sha>`, `--evidence-bead <id>`

Run `mulch status` to check domain health and entry counts.
Run `mulch --help` for full usage.
Mulch write commands use file locking and atomic writes — multiple agents can safely record to the same domain concurrently.

### Before You Finish

1. Discover what to record:
   ```bash
   mulch learn
   ```
2. Store insights from this work session:
   ```bash
   mulch record <domain> --type <convention|pattern|failure|decision|reference|guide> --description "..."
   ```
3. Validate and commit:
   ```bash
   mulch sync
   ```
<!-- mulch:end -->

<!-- seeds:start -->
## Issue Tracking (Seeds)
<!-- seeds-onboard-v:1 -->

This project uses [Seeds](https://github.com/jayminwest/seeds) for git-native issue tracking.

**At the start of every session**, run:
```
sd prime
```

This injects session context: rules, command reference, and workflows.

**Quick reference:**
- `sd ready` — Find unblocked work
- `sd create --title "..." --type task --priority 2` — Create issue
- `sd update <id> --status in_progress` — Claim work
- `sd close <id>` — Complete work
- `sd dep add <id> <depends-on>` — Add dependency between issues
- `sd sync` — Sync with git (run before pushing)

### Before You Finish
1. Close completed issues: `sd close <id>`
2. File issues for remaining work: `sd create --title "..."`
3. Sync and push: `sd sync && git push`
<!-- seeds:end -->

<!-- canopy:start -->
## Prompt Management (Canopy)
<!-- canopy-onboard-v:1 -->

This project uses [Canopy](https://github.com/jayminwest/canopy) for git-native prompt management.

**At the start of every session**, run:
```
cn prime
```

This injects prompt workflow context: commands, conventions, and common workflows.

**Quick reference:**
- `cn list` — List all prompts
- `cn render <name>` — View rendered prompt (resolves inheritance)
- `cn emit --all` — Render prompts to files
- `cn update <name>` — Update a prompt (creates new version)
- `cn sync` — Stage and commit .canopy/ changes

**Do not manually edit emitted files.** Use `cn update` to modify prompts, then `cn emit` to regenerate.
<!-- canopy:end -->
