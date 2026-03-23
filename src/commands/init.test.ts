import { afterEach, beforeEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
	origCwd = process.cwd();
	tmpDir = join(tmpdir(), `seeds-init-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(tmpDir, { recursive: true });
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(origCwd);
	try {
		rmSync(tmpDir, { recursive: true, force: true });
	} catch {}
});

test("init: creates .seeds directory structure", async () => {
	const { cmdInit } = await import("../commands/init.js");
	await cmdInit(["testproject"], { "--json": "true" });

	expect(existsSync(join(tmpDir, ".seeds"))).toBe(true);
	expect(existsSync(join(tmpDir, ".seeds", "config.yaml"))).toBe(true);
	expect(existsSync(join(tmpDir, ".seeds", "issues.jsonl"))).toBe(true);
	expect(existsSync(join(tmpDir, ".seeds", "templates.jsonl"))).toBe(true);
	expect(existsSync(join(tmpDir, ".seeds", ".gitignore"))).toBe(true);
});

test("init: config.yaml contains project name", async () => {
	const { cmdInit } = await import("../commands/init.js");
	await cmdInit(["myproject"], { "--json": "true" });

	const content = await Bun.file(join(tmpDir, ".seeds", "config.yaml")).text();
	expect(content).toContain("myproject");
});

test("init: seeds .gitignore ignores lock files", async () => {
	const { cmdInit } = await import("../commands/init.js");
	await cmdInit(["test"], { "--json": "true" });

	const content = await Bun.file(join(tmpDir, ".seeds", ".gitignore")).text();
	expect(content).toContain("*.lock");
});

test("init: creates .gitattributes with union merge strategy", async () => {
	const { cmdInit } = await import("../commands/init.js");
	await cmdInit(["test"], { "--json": "true" });

	const content = await Bun.file(join(tmpDir, ".gitattributes")).text();
	expect(content).toContain("merge=union");
	expect(content).toContain("issues.jsonl");
});
