import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GITIGNORE_FILE, SEEDS_DIR, getSeedsDir } from "../config.js";
import { jsonError, jsonSuccess, printError, printSuccess } from "../output.js";
import { stringifyYaml } from "../yaml.js";

export async function cmdInit(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();
	const seedsDir = getSeedsDir(cwd);

	if (existsSync(join(seedsDir, "config.yaml"))) {
		const msg = "Seeds already initialized";
		if (json) jsonError("init", msg);
		else printError(msg);
		process.exit(1);
	}

	// Determine project name from directory name
	const project = args[0] ?? cwd.split("/").pop() ?? "seeds";

	mkdirSync(seedsDir, { recursive: true });

	// config.yaml
	await Bun.write(join(seedsDir, "config.yaml"), stringifyYaml({ project, version: "1" }));

	// issues.jsonl
	await Bun.write(join(seedsDir, "issues.jsonl"), "");

	// templates.jsonl
	await Bun.write(join(seedsDir, "templates.jsonl"), "");

	// .gitignore inside .seeds/
	await Bun.write(join(seedsDir, GITIGNORE_FILE), "*.lock\n");

	// Append .gitattributes to project root
	const gitattrsPath = join(cwd, ".gitattributes");
	const entry = `${SEEDS_DIR}/issues.jsonl merge=union\n${SEEDS_DIR}/templates.jsonl merge=union\n`;
	if (existsSync(gitattrsPath)) {
		const existing = await Bun.file(gitattrsPath).text();
		if (!existing.includes("seeds/issues.jsonl")) {
			await Bun.write(gitattrsPath, existing + entry);
		}
	} else {
		await Bun.write(gitattrsPath, entry);
	}

	if (json) {
		jsonSuccess("init", { project });
	} else {
		printSuccess(`Initialized Seeds project '${project}' in ${SEEDS_DIR}/`);
	}
}
