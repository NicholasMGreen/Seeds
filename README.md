# Seeds

Git-native issue tracker for AI agent workflows. Zero dependencies, JSONL storage, Bun runtime.

Replaces [beads](https://github.com/steveyegge/beads) in the overstory/mulch ecosystem with something purpose-built: no Dolt, no daemon, no binary DB files. The JSONL file IS the database.

## Install

```bash
bun install
bun link
```

## Usage

```bash
sd init                              # Initialize .seeds/ in current directory
sd create --title "Fix the bug"      # Create an issue
sd list                              # List open issues
sd show <id>                         # Show issue details
sd update <id> --status in_progress  # Update an issue
sd close <id> --reason "done"        # Close an issue
sd ready                             # Show unblocked work
sd sync                              # Stage and commit .seeds/ changes
```

## CLI Reference

### Issue Commands

```
sd init                              Initialize .seeds/ in current directory

sd create                            Create a new issue
  --title <text>     (required)
  --type <type>      task|bug|feature|epic (default: task)
  --priority <n>     0-4 or P0-P4 (default: 2)
  --description <text>
  --assignee <name>

sd show <id>                         Show issue details

sd list                              List issues with filters
  --status <status>  open|in_progress|closed
  --type <type>      task|bug|feature|epic
  --assignee <name>
  --limit <n>        Max results (default: 50)

sd ready                             Show open issues with no unresolved blockers

sd update <id>                       Update issue fields
  --status <status>
  --title <text>
  --priority <n>
  --assignee <name>
  --description <text>

sd close <id> [<id2> ...]            Close one or more issues
  --reason <text>    Closure summary

sd dep add <issue> <depends-on>      Add dependency
sd dep remove <issue> <depends-on>   Remove dependency
sd dep list <issue>                  Show deps for an issue

sd blocked                           Show all blocked issues
sd stats                             Project statistics
sd sync                              Stage and commit .seeds/ changes
  --status           Check for uncommitted changes without committing
```

### Template (Molecule) Commands

```
sd tpl create                        Create a template
  --name <text>      (required)

sd tpl step add <template-id>        Add a step to a template
  --title <text>     (required)
  --type <type>      task|bug|feature|epic (default: task)
  --priority <n>     0-4 (default: 2)

sd tpl list                          List all templates
sd tpl show <template-id>            Show template with steps

sd tpl pour <template-id>            Instantiate template into real issues
  --prefix <text>    Replaces {prefix} in step titles

sd tpl status <template-id>          Show convoy status
```

### JSON Output

Every command supports `--json` for structured output:

```bash
sd create --title "Fix bug" --json
# {"success":true,"command":"create","id":"seeds-a1b2"}

sd list --json
# {"success":true,"command":"list","issues":[...],"count":5}
```

## Design

- **JSONL is the database.** No binary files, no export pipeline, no sync step.
- **Zero runtime dependencies.** Bun built-ins only.
- **Concurrent-safe.** Advisory file locks + atomic writes.
- **Git-native.** `merge=union` gitattribute handles parallel branch merges.

## Storage

```
.seeds/
  config.yaml        # Project config
  issues.jsonl       # All issues, one JSON object per line
  templates.jsonl    # Template definitions
  .gitignore         # Ignores lock files
```

## Scripts

```bash
bun run version:bump patch   # Bump patch version
bun run version:bump minor   # Bump minor version
bun run version:bump major   # Bump major version
```

## Development

```bash
bun test             # Run tests
bun run lint         # Lint with Biome
bun run typecheck    # TypeScript check
```

## Migration from Beads

```bash
sd migrate-from-beads    # One-time migration from .beads/
```

Reads `.beads/issues.jsonl` and writes to `.seeds/issues.jsonl`. Preserves original IDs.
