#!/usr/bin/env bun
/**
 * Bump version in package.json and src/index.ts atomically.
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
const [major, minor, patch] = pkg.version.split(".").map(Number);

let nextVersion: string;
if (kind === "major") nextVersion = `${(major ?? 0) + 1}.0.0`;
else if (kind === "minor") nextVersion = `${major ?? 0}.${(minor ?? 0) + 1}.0`;
else nextVersion = `${major ?? 0}.${minor ?? 0}.${(patch ?? 0) + 1}`;

// Update package.json
pkg.version = nextVersion;
await Bun.write(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);

// Update src/index.ts VERSION constant
const indexContent = await Bun.file(indexPath).text();
const updated = indexContent.replace(
	/export const VERSION = "[^"]+"/,
	`export const VERSION = "${nextVersion}"`,
);
await Bun.write(indexPath, updated);

console.log(`Bumped ${pkg.version} → ${nextVersion}`);
console.log(`\nNext steps:`);
console.log(`  1. Update CHANGELOG.md`);
console.log(`  2. git add package.json src/index.ts CHANGELOG.md`);
console.log(`  3. git commit -m "chore: bump version to ${nextVersion}"`);
console.log(`  4. git tag v${nextVersion}`);
