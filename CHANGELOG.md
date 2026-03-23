# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-23

### Added
- Initial release
- Issue CRUD (create, show, list, update, close)
- Dependency tracking (dep add/remove/list, blocked, ready)
- Templates/molecules (tpl create/step/list/show/pour/status)
- Advisory file locking for concurrent agent access
- Atomic writes with dedup-on-read
- YAML config, JSONL storage
- `--json` flag on all commands
- Migration from beads (`sd migrate-from-beads`)
- `sd sync` for staging and committing `.seeds/` changes
- `sd stats` for project statistics
- `sd blocked` to list blocked issues
