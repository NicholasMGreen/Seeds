import { loadConfig } from "../config.js";
import { generateIssueId } from "../id.js";
import { jsonError, jsonSuccess, printError, printIssue } from "../output.js";
import { appendIssue, readIssues } from "../store.js";
import type { Issue, IssueStatus, IssueType } from "../types.js";
import { VALID_STATUSES, VALID_TYPES } from "../types.js";

export function parsePriority(raw: string): number {
	const s = raw.trim();
	// Handle P0-P4 shorthand
	if (/^P\d$/i.test(s)) return Number.parseInt(s.slice(1));
	const n = Number.parseInt(s);
	if (Number.isNaN(n) || n < 0 || n > 4)
		throw new Error(`Invalid priority '${raw}'. Use 0-4 or P0-P4.`);
	return n;
}

export async function cmdCreate(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	const title = opts["--title"] ?? opts["-t"];
	if (!title) {
		const msg = "Title is required (--title)";
		if (json) jsonError("create", msg);
		else printError(msg);
		process.exit(1);
	}

	const typeRaw = opts["--type"] ?? "task";
	if (!VALID_TYPES.includes(typeRaw as IssueType)) {
		const msg = `Invalid type '${typeRaw}'. Use: ${VALID_TYPES.join(", ")}`;
		if (json) jsonError("create", msg);
		else printError(msg);
		process.exit(1);
	}

	let priority = 2;
	if (opts["--priority"] !== undefined) {
		try {
			priority = parsePriority(opts["--priority"]);
		} catch (e) {
			const msg = (e as Error).message;
			if (json) jsonError("create", msg);
			else printError(msg);
			process.exit(1);
		}
	}

	const config = await loadConfig(cwd);
	const existing = await readIssues(cwd);
	const existingIds = new Set(existing.map((i) => i.id));
	const id = generateIssueId(config.project, existingIds);

	const now = new Date().toISOString();
	const issue: Issue = {
		id,
		title,
		status: (opts["--status"] as IssueStatus) ?? "open",
		type: typeRaw as IssueType,
		priority,
		createdAt: now,
		updatedAt: now,
	};

	if (opts["--description"]) issue.description = opts["--description"];
	if (opts["--assignee"]) issue.assignee = opts["--assignee"];

	await appendIssue(issue, cwd);

	if (json) {
		jsonSuccess("create", { id });
	} else {
		printIssue(issue);
	}
}
