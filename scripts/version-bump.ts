#!/usr/bin/env bun
/**
 * Version bump script for Seeds.
 * Updates version in package.json and src/index.ts atomically.
 *
 * Usage: bun run version:bump <major|minor|patch>
 */

const kind = process.argv[2];
if (!kind || !["major", "minor", "patch"].includes(kind)) {
	console.error("Usage: bun run version:bump <major|minor|patch>");
	process.exit(1);
}

const pkgPath = new URL("../package.json", import.meta.url).pathname;
const indexPath = new URL("../src/index.ts", import.meta.url).pathname;

const pkg = JSON.parse(await Bun.file(pkgPath).text()) as { version: string };
const oldVersion = pkg.version;
const parts = oldVersion.split(".").map(Number);
if (parts.length !== 3 || parts.some(Number.isNaN)) {
	console.error(`Invalid version in package.json: ${oldVersion}`);
	process.exit(1);
}
const [major, minor, patch] = parts as [number, number, number];

let nextVersion: string;
if (kind === "major") nextVersion = `${major + 1}.0.0`;
else if (kind === "minor") nextVersion = `${major}.${minor + 1}.0`;
else nextVersion = `${major}.${minor}.${patch + 1}`;

// Verify VERSION constant exists and matches package.json
const indexContent = await Bun.file(indexPath).text();
const versionRegex = /export const VERSION = "([^"]+)"/;
const match = versionRegex.exec(indexContent);
if (!match) {
	console.error('Could not find `export const VERSION = "..."` in src/index.ts');
	process.exit(1);
}
const srcVersion = match[1];
if (srcVersion !== oldVersion) {
	console.error(`Version mismatch: package.json=${oldVersion}, src/index.ts=${srcVersion}`);
	console.error("Fix the mismatch before bumping.");
	process.exit(1);
}

// Update package.json
pkg.version = nextVersion;
await Bun.write(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);

// Update src/index.ts VERSION constant
const updated = indexContent.replace(versionRegex, `export const VERSION = "${nextVersion}"`);
await Bun.write(indexPath, updated);

console.log(`Bumped: ${oldVersion} → ${nextVersion}`);
console.log("");
console.log("Next steps:");
console.log(`  1. Update CHANGELOG.md — add entry for [${nextVersion}]`);
console.log("  2. Review and update README.md if CLI reference changed");
console.log("  3. Review and update CLAUDE.md if structure changed");
console.log("  4. git add package.json src/index.ts CHANGELOG.md");
console.log(`  5. git commit -m "chore: release v${nextVersion}"`);
console.log("  6. Push to main — auto-tag workflow will create the release");
