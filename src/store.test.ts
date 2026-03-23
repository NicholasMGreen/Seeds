import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	appendIssue,
	appendTemplate,
	readIssues,
	readTemplates,
	updateIssue,
	writeIssues,
} from "./store.js";
import type { Issue, Template } from "./types.js";

let tmpDir: string;

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	const now = new Date().toISOString();
	return {
		id: "test-a1b2",
		title: "Test issue",
		status: "open",
		type: "task",
		priority: 2,
		createdAt: now,
		updatedAt: now,
		...overrides,
	};
}

beforeEach(() => {
	tmpDir = join(tmpdir(), `seeds-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(join(tmpDir, ".seeds"), { recursive: true });
	writeFileSync(join(tmpDir, ".seeds", "config.yaml"), "project: test\nversion: 1\n");
	writeFileSync(join(tmpDir, ".seeds", "issues.jsonl"), "");
	writeFileSync(join(tmpDir, ".seeds", "templates.jsonl"), "");
});

afterEach(() => {
	try {
		rmSync(tmpDir, { recursive: true, force: true });
	} catch {}
});

// ─── Issues ───────────────────────────────────────────────────────────────────

test("readIssues: returns empty array when file is empty", async () => {
	const issues = await readIssues(tmpDir);
	expect(issues).toEqual([]);
});

test("appendIssue + readIssues: round-trip", async () => {
	const issue = makeIssue();
	await appendIssue(issue, tmpDir);
	const issues = await readIssues(tmpDir);
	expect(issues).toHaveLength(1);
	expect(issues[0]?.id).toBe("test-a1b2");
	expect(issues[0]?.title).toBe("Test issue");
});

test("readIssues: deduplicates by ID, last wins", async () => {
	const issue1 = makeIssue({ title: "First" });
	const issue2 = makeIssue({ title: "Second" }); // same id
	await appendIssue(issue1, tmpDir);
	await appendIssue(issue2, tmpDir);
	const issues = await readIssues(tmpDir);
	expect(issues).toHaveLength(1);
	expect(issues[0]?.title).toBe("Second");
});

test("updateIssue: updates fields and bumps updatedAt", async () => {
	const issue = makeIssue({ updatedAt: "2020-01-01T00:00:00.000Z" });
	await appendIssue(issue, tmpDir);

	const updated = await updateIssue("test-a1b2", { title: "Updated title" }, tmpDir);
	expect(updated.title).toBe("Updated title");
	expect(updated.updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
});

test("updateIssue: throws for unknown ID", async () => {
	await expect(updateIssue("not-found", { title: "x" }, tmpDir)).rejects.toThrow("not found");
});

test("writeIssues: overwrites file with new issues", async () => {
	const i1 = makeIssue({ id: "test-1111", title: "One" });
	const i2 = makeIssue({ id: "test-2222", title: "Two" });
	await appendIssue(i1, tmpDir);
	await writeIssues([i2], tmpDir);
	const issues = await readIssues(tmpDir);
	expect(issues).toHaveLength(1);
	expect(issues[0]?.id).toBe("test-2222");
});

test("appendIssue: multiple issues stored correctly", async () => {
	const i1 = makeIssue({ id: "test-aaaa", title: "First" });
	const i2 = makeIssue({ id: "test-bbbb", title: "Second" });
	await appendIssue(i1, tmpDir);
	await appendIssue(i2, tmpDir);
	const issues = await readIssues(tmpDir);
	expect(issues).toHaveLength(2);
});

// ─── Templates ────────────────────────────────────────────────────────────────

test("readTemplates: returns empty array when empty", async () => {
	const templates = await readTemplates(tmpDir);
	expect(templates).toEqual([]);
});

test("appendTemplate + readTemplates: round-trip", async () => {
	const tpl: Template = {
		id: "tpl-a1b2",
		name: "Test Template",
		steps: [{ title: "Step 1" }],
	};
	await appendTemplate(tpl, tmpDir);
	const templates = await readTemplates(tmpDir);
	expect(templates).toHaveLength(1);
	expect(templates[0]?.id).toBe("tpl-a1b2");
});
