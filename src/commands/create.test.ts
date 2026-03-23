import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readIssues } from "../store.js";

let tmpDir: string;
let origCwd: string;

beforeEach(() => {
	origCwd = process.cwd();
	tmpDir = join(tmpdir(), `seeds-create-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
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

test("create: creates issue with correct fields", async () => {
	const { cmdCreate } = await import("../commands/create.js");
	await cmdCreate([], { "--title": "My task", "--json": "true" });

	const issues = await readIssues(tmpDir);
	expect(issues).toHaveLength(1);
	expect(issues[0]?.title).toBe("My task");
	expect(issues[0]?.status).toBe("open");
	expect(issues[0]?.type).toBe("task");
	expect(issues[0]?.priority).toBe(2);
	expect(issues[0]?.id).toMatch(/^testproj-[0-9a-f]+$/);
});

test("create: respects --type flag", async () => {
	const { cmdCreate } = await import("../commands/create.js");
	await cmdCreate([], { "--title": "A bug", "--type": "bug", "--json": "true" });

	const issues = await readIssues(tmpDir);
	expect(issues[0]?.type).toBe("bug");
});

test("create: respects --priority flag", async () => {
	const { cmdCreate } = await import("../commands/create.js");
	await cmdCreate([], { "--title": "High prio", "--priority": "1", "--json": "true" });

	const issues = await readIssues(tmpDir);
	expect(issues[0]?.priority).toBe(1);
});

test("create: respects P0-P4 priority shorthand", async () => {
	const { cmdCreate } = await import("../commands/create.js");
	await cmdCreate([], { "--title": "Critical", "--priority": "P0", "--json": "true" });

	const issues = await readIssues(tmpDir);
	expect(issues[0]?.priority).toBe(0);
});

test("create: sets assignee and description", async () => {
	const { cmdCreate } = await import("../commands/create.js");
	await cmdCreate([], {
		"--title": "Task",
		"--assignee": "builder-1",
		"--description": "Detailed desc",
		"--json": "true",
	});

	const issues = await readIssues(tmpDir);
	expect(issues[0]?.assignee).toBe("builder-1");
	expect(issues[0]?.description).toBe("Detailed desc");
});

test("show: returns issue details", async () => {
	const { cmdCreate } = await import("../commands/create.js");
	await cmdCreate([], { "--title": "Show me", "--json": "true" });

	const issues = await readIssues(tmpDir);
	const id = issues[0]?.id ?? "";
	expect(id).toBeTruthy();

	const { cmdShow } = await import("../commands/show.js");
	// Just ensure it runs without error
	await cmdShow([id], { "--json": "true" });
});
