import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendIssue, readIssues } from "../store.js";
import type { Issue } from "../types.js";

let tmpDir: string;
let origCwd: string;

function makeIssue(id: string, title: string): Issue {
	const now = new Date().toISOString();
	return { id, title, status: "open", type: "task", priority: 2, createdAt: now, updatedAt: now };
}

beforeEach(async () => {
	origCwd = process.cwd();
	tmpDir = join(tmpdir(), `seeds-dep-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	mkdirSync(join(tmpDir, ".seeds"), { recursive: true });
	writeFileSync(join(tmpDir, ".seeds", "config.yaml"), "project: testproj\nversion: 1\n");
	writeFileSync(join(tmpDir, ".seeds", "issues.jsonl"), "");
	writeFileSync(join(tmpDir, ".seeds", "templates.jsonl"), "");
	process.chdir(tmpDir);

	await appendIssue(makeIssue("testproj-aaaa", "Issue A"), tmpDir);
	await appendIssue(makeIssue("testproj-bbbb", "Issue B"), tmpDir);
});

afterEach(() => {
	process.chdir(origCwd);
	try {
		rmSync(tmpDir, { recursive: true, force: true });
	} catch {}
});

test("dep add: sets blockedBy on issue and blocks on dep", async () => {
	const { cmdDep } = await import("../commands/dep.js");
	await cmdDep(["add", "testproj-bbbb", "testproj-aaaa"], { "--json": "true" });

	const issues = await readIssues(tmpDir);
	const issueB = issues.find((i) => i.id === "testproj-bbbb");
	const issueA = issues.find((i) => i.id === "testproj-aaaa");

	expect(issueB?.blockedBy).toContain("testproj-aaaa");
	expect(issueA?.blocks).toContain("testproj-bbbb");
});

test("dep remove: removes dependency", async () => {
	const { cmdDep } = await import("../commands/dep.js");
	await cmdDep(["add", "testproj-bbbb", "testproj-aaaa"], { "--json": "true" });
	await cmdDep(["remove", "testproj-bbbb", "testproj-aaaa"], { "--json": "true" });

	const issues = await readIssues(tmpDir);
	const issueB = issues.find((i) => i.id === "testproj-bbbb");
	expect(issueB?.blockedBy ?? []).not.toContain("testproj-aaaa");
});

test("dep list: shows dependencies", async () => {
	const { cmdDep } = await import("../commands/dep.js");
	await cmdDep(["add", "testproj-bbbb", "testproj-aaaa"], { "--json": "true" });
	// Should not throw
	await cmdDep(["list", "testproj-bbbb"], { "--json": "true" });
});

test("dep add: idempotent", async () => {
	const { cmdDep } = await import("../commands/dep.js");
	await cmdDep(["add", "testproj-bbbb", "testproj-aaaa"], { "--json": "true" });
	await cmdDep(["add", "testproj-bbbb", "testproj-aaaa"], { "--json": "true" });

	const issues = await readIssues(tmpDir);
	const issueB = issues.find((i) => i.id === "testproj-bbbb");
	expect(issueB?.blockedBy?.filter((id) => id === "testproj-aaaa")).toHaveLength(1);
});
