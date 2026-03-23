import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "./types.js";
import { parseYaml, stringifyYaml } from "./yaml.js";

export const SEEDS_DIR = ".seeds";
export const CONFIG_FILE = "config.yaml";
export const ISSUES_FILE = "issues.jsonl";
export const TEMPLATES_FILE = "templates.jsonl";
export const GITIGNORE_FILE = ".gitignore";

export function getSeedsDir(cwd = process.cwd()): string {
	return join(cwd, SEEDS_DIR);
}

export function getConfigPath(cwd = process.cwd()): string {
	return join(getSeedsDir(cwd), CONFIG_FILE);
}

export function getIssuesPath(cwd = process.cwd()): string {
	return join(getSeedsDir(cwd), ISSUES_FILE);
}

export function getTemplatesPath(cwd = process.cwd()): string {
	return join(getSeedsDir(cwd), TEMPLATES_FILE);
}

export function isInitialized(cwd = process.cwd()): boolean {
	return existsSync(getConfigPath(cwd));
}

export async function loadConfig(cwd = process.cwd()): Promise<Config> {
	const path = getConfigPath(cwd);
	if (!existsSync(path)) {
		throw new Error(`Seeds not initialized. Run 'sd init' first.`);
	}
	const content = await Bun.file(path).text();
	const parsed = parseYaml(content);
	return {
		project: parsed.project ?? "seeds",
		version: parsed.version ?? "1",
	};
}

export async function saveConfig(config: Config, cwd = process.cwd()): Promise<void> {
	const path = getConfigPath(cwd);
	await Bun.write(path, stringifyYaml({ project: config.project, version: config.version }));
}
