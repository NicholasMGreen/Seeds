#!/usr/bin/env bun
/**
 * Version bump script for Seeds.
 * Updates version in package.json and src/index.ts atomically.
 *
 * Usage: bun run scripts/version-bump.ts <major|minor|patch>
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

function bump(version: string, kind: "major" | "minor" | "patch"): string {
	const parts = version.split(".").map(Number);
	if (parts.length !== 3 || parts.some(isNaN)) {
		throw new Error(`Invalid version: ${version}`);
	}
	const [major, minor, patch] = parts as [number, number, number];
	switch (kind) {
		case "major":
			return `${major + 1}.0.0`;
		case "minor":
			return `${major}.${minor + 1}.0`;
		case "patch":
			return `${major}.${minor}.${patch + 1}`;
	}
}

function main() {
	const kind = process.argv[2];
	if (kind !== "major" && kind !== "minor" && kind !== "patch") {
		console.error("Usage: bun run scripts/version-bump.ts <major|minor|patch>");
		process.exit(1);
	}

	// Read package.json
	const pkgPath = join(ROOT, "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
	const oldVersion = pkg.version;
	const newVersion = bump(oldVersion, kind);

	// Read src/index.ts and verify VERSION constant exists
	const indexPath = join(ROOT, "src", "index.ts");
	const indexContent = readFileSync(indexPath, "utf-8");
	const versionRegex = /const VERSION\s*=\s*"([^"]+)"/;
	const match = versionRegex.exec(indexContent);
	if (!match) {
		console.error('Could not find `const VERSION = "..."` in src/index.ts');
		process.exit(1);
	}
	const srcVersion = match[1];
	if (srcVersion !== oldVersion) {
		console.error(
			`Version mismatch: package.json=${oldVersion}, src/index.ts=${srcVersion}`,
		);
		console.error("Fix the mismatch before bumping.");
		process.exit(1);
	}

	// Update package.json
	pkg.version = newVersion;
	writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t") + "\n", "utf-8");

	// Update src/index.ts
	const updatedIndex = indexContent.replace(
		versionRegex,
		`const VERSION = "${newVersion}"`,
	);
	writeFileSync(indexPath, updatedIndex, "utf-8");

	console.log(`Bumped: ${oldVersion} → ${newVersion}`);
	console.log("");
	console.log("Next steps:");
	console.log(`  1. Update CHANGELOG.md — add entry for [${newVersion}]`);
	console.log("  2. Review and update README.md if CLI reference changed");
	console.log("  3. Review and update CLAUDE.md if structure changed");
	console.log(`  4. git add package.json src/index.ts CHANGELOG.md`);
	console.log(`  5. git commit -m "chore: release v${newVersion}"`);
	console.log("  6. Push to main — auto-tag workflow will create the release");
}

main();
