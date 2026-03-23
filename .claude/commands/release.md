# /release

Prepare a Seeds release: analyze changes, bump version, update CHANGELOG and docs.

## Steps

1. **Analyze changes since last release**
   ```bash
   git log $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD --oneline
   git diff $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD -- package.json src/
   ```

2. **Determine version bump**
   - `major` — breaking CLI changes (removed commands, changed flags, incompatible output)
   - `minor` — new commands or flags added
   - `patch` — bug fixes, internal improvements, docs (default)

3. **Bump version**
   ```bash
   bun run version:bump <major|minor|patch>
   ```
   This updates `package.json` and `src/index.ts` atomically.

4. **Update CHANGELOG.md**
   - Move relevant changes from `[Unreleased]` to the new version section
   - Categorize under `Added`, `Changed`, `Fixed`, `Removed` as appropriate
   - Use format: `## [X.Y.Z] - YYYY-MM-DD`

5. **Update CLAUDE.md** (if needed)
   - If command count or structure changed, update the CLI Command Reference section

6. **Update README.md** (if needed)
   - If CLI commands were added/changed, update the CLI Reference section

7. **Present summary**
   Show what version was bumped to, what changed, and what files were modified.
   Do NOT commit or push — leave that to the user.

## Notes

- Auto-tag workflow runs on push to main and creates the GitHub release automatically
- Versions must match in `package.json` and `src/index.ts` — CI enforces this
- Always update CHANGELOG before committing the version bump
