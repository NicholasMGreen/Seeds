import { jsonSuccess, printIssueRow } from "../output.js";
import { readIssues } from "../store.js";
import type { Issue } from "../types.js";

export async function cmdList(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	let issues = await readIssues(cwd);

	// Filters
	if (opts["--status"]) issues = issues.filter((i) => i.status === opts["--status"]);
	if (opts["--type"]) issues = issues.filter((i) => i.type === opts["--type"]);
	if (opts["--assignee"]) issues = issues.filter((i) => i.assignee === opts["--assignee"]);

	// Sort by priority then createdAt
	issues.sort((a, b) => a.priority - b.priority || a.createdAt.localeCompare(b.createdAt));

	const limit = opts["--limit"] ? Number.parseInt(opts["--limit"]) : 50;
	issues = issues.slice(0, limit);

	if (json) {
		jsonSuccess("list", { issues, count: issues.length });
	} else {
		if (issues.length === 0) {
			console.log("No issues found.");
			return;
		}
		for (const issue of issues) printIssueRow(issue);
		console.log(`\n${issues.length} issue(s)`);
	}
}
