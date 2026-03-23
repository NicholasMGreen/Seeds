import { expect, test } from "bun:test";
import { generateId, generateIssueId, generateTemplateId } from "./id.js";

test("generateId: format matches prefix-hex pattern", () => {
	const id = generateId("seeds", new Set());
	expect(id).toMatch(/^seeds-[0-9a-f]{4}$/);
});

test("generateTemplateId: format matches tpl-hex", () => {
	const id = generateTemplateId(new Set());
	expect(id).toMatch(/^tpl-[0-9a-f]{4}$/);
});

test("generateIssueId: uses project prefix", () => {
	const id = generateIssueId("myproject", new Set());
	expect(id).toMatch(/^myproject-[0-9a-f]{4}$/);
});

test("generateId: avoids collisions", () => {
	// Fill up 4-hex space with a handful of IDs and check we still get a valid unique ID
	const prefix = "test";
	const existing = new Set<string>();
	const ids = new Set<string>();
	for (let i = 0; i < 20; i++) {
		const id = generateId(prefix, existing);
		expect(ids.has(id)).toBe(false);
		ids.add(id);
		existing.add(id);
	}
});

test("generateId: generates unique IDs across calls", () => {
	const existing = new Set<string>();
	const ids: string[] = [];
	for (let i = 0; i < 10; i++) {
		const id = generateId("proj", existing);
		ids.push(id);
		existing.add(id);
	}
	// All unique
	expect(new Set(ids).size).toBe(10);
});
