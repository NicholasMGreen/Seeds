import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readIssues, readTemplates } from "../store.js";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
	origCwd = process.cwd();
	tmpDir = join(tmpdir(), `seeds-tpl-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(join(tmpDir, ".seeds"), { recursive: true });
	writeFileSync(join(tmpDir, ".seeds", "config.yaml"), "project: testproj\nversion: 1\n");
	writeFileSync(join(tmpDir, ".seeds", "issues.jsonl"), "");
	writeFileSync(join(tmpDir, ".seeds", "templates.jsonl"), "");
	process.chdir(tmpDir);
});

afterEach(() => {
	process.chdir(origCwd);
	try {
		rmSync(tmpDir, { recursive: true, force: true });
	} catch {}
});

test("tpl create: creates a template", async () => {
	const { cmdTpl } = await import("../commands/tpl.js");
	await cmdTpl(["create"], { "--name": "My Template", "--json": "true" });

	const templates = await readTemplates(tmpDir);
	expect(templates).toHaveLength(1);
	expect(templates[0]?.name).toBe("My Template");
	expect(templates[0]?.id).toMatch(/^tpl-[0-9a-f]+$/);
	expect(templates[0]?.steps).toEqual([]);
});

test("tpl step add: adds step to template", async () => {
	const { cmdTpl } = await import("../commands/tpl.js");
	await cmdTpl(["create"], { "--name": "Build Flow", "--json": "true" });

	const templates = await readTemplates(tmpDir);
	const tplId = templates[0]?.id ?? "";
	expect(tplId).toBeTruthy();

	await cmdTpl(["step", "add", tplId], { "--title": "Scout: {prefix}", "--json": "true" });
	await cmdTpl(["step", "add", tplId], { "--title": "Build: {prefix}", "--json": "true" });

	const updated = await readTemplates(tmpDir);
	expect(updated[0]?.steps).toHaveLength(2);
	expect(updated[0]?.steps[0]?.title).toBe("Scout: {prefix}");
});

test("tpl pour: creates issues with dependency chain", async () => {
	const { cmdTpl } = await import("../commands/tpl.js");
	await cmdTpl(["create"], { "--name": "Scout-Build", "--json": "true" });

	const templates = await readTemplates(tmpDir);
	const tplId = templates[0]?.id ?? "";

	await cmdTpl(["step", "add", tplId], { "--title": "Scout: {prefix}", "--json": "true" });
	await cmdTpl(["step", "add", tplId], { "--title": "Build: {prefix}", "--json": "true" });
	await cmdTpl(["step", "add", tplId], { "--title": "Review: {prefix}", "--json": "true" });

	await cmdTpl(["pour", tplId], { "--prefix": "Feature X", "--json": "true" });

	const issues = await readIssues(tmpDir);
	expect(issues).toHaveLength(3);

	// Verify titles have prefix substituted
	const scout = issues.find((i) => i.title.startsWith("Scout:"));
	expect(scout?.title).toBe("Scout: Feature X");

	// Verify dependency chain: Build blocked by Scout, Review blocked by Build
	const build = issues.find((i) => i.title.startsWith("Build:"));
	const review = issues.find((i) => i.title.startsWith("Review:"));
	expect(build?.blockedBy).toContain(scout?.id);
	expect(review?.blockedBy).toContain(build?.id);
});

test("tpl list: lists templates", async () => {
	const { cmdTpl } = await import("../commands/tpl.js");
	await cmdTpl(["create"], { "--name": "Template 1", "--json": "true" });
	await cmdTpl(["create"], { "--name": "Template 2", "--json": "true" });

	const templates = await readTemplates(tmpDir);
	expect(templates).toHaveLength(2);
});
