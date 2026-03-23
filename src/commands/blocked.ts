import { jsonSuccess, printIssueRow } from "../output.js";
import { readIssues } from "../store.js";

export async function cmdBlocked(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	const all = await readIssues(cwd);
	const openIds = new Set(all.filter((i) => i.status !== "closed").map((i) => i.id));

	const blocked = all.filter(
		(i) => i.status !== "closed" && i.blockedBy?.some((bid) => openIds.has(bid)),
	);

	blocked.sort((a, b) => a.priority - b.priority);

	if (json) {
		jsonSuccess("blocked", { issues: blocked, count: blocked.length });
	} else {
		if (blocked.length === 0) {
			console.log("No blocked issues.");
			return;
		}
		for (const issue of blocked) printIssueRow(issue);
		console.log(`\n${blocked.length} blocked issue(s)`);
	}
}
