import { expect, test } from "bun:test";
import { parseYaml, stringifyYaml } from "./yaml.js";

test("parseYaml: basic key-value", () => {
	const result = parseYaml("project: overstory\nversion: 1\n");
	expect(result.project).toBe("overstory");
	expect(result.version).toBe("1");
});

test("parseYaml: quoted values", () => {
	const result = parseYaml('project: "Seeds"\nversion: "1"\n');
	expect(result.project).toBe("Seeds");
	expect(result.version).toBe("1");
});

test("parseYaml: single-quoted values", () => {
	const result = parseYaml("project: 'Seeds'\n");
	expect(result.project).toBe("Seeds");
});

test("parseYaml: ignores comments", () => {
	const result = parseYaml("# comment\nproject: test\n");
	expect(result.project).toBe("test");
	expect(Object.keys(result)).toHaveLength(1);
});

test("parseYaml: ignores empty lines", () => {
	const result = parseYaml("\nproject: test\n\n");
	expect(result.project).toBe("test");
});

test("parseYaml: value with colon", () => {
	const result = parseYaml('url: "http://example.com"\n');
	expect(result.url).toBe("http://example.com");
});

test("stringifyYaml: basic", () => {
	const yaml = stringifyYaml({ project: "seeds", version: "1" });
	expect(yaml).toContain("project: seeds");
	expect(yaml).toContain("version: 1");
});

test("stringifyYaml: quotes special chars", () => {
	const yaml = stringifyYaml({ url: "http://example.com" });
	expect(yaml).toContain('"http://example.com"');
});

test("round-trip", () => {
	const original = { project: "test-project", version: "1" };
	const yaml = stringifyYaml(original);
	const parsed = parseYaml(yaml);
	expect(parsed.project).toBe(original.project);
	expect(parsed.version).toBe(original.version);
});
