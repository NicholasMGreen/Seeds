import { jsonSuccess, printIssueRow } from "../output.js";
import { readIssues } from "../store.js";

export async function cmdReady(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	const all = await readIssues(cwd);
	const openIds = new Set(all.filter((i) => i.status !== "closed").map((i) => i.id));

	const ready = all.filter((i) => {
		if (i.status === "closed") return false;
		if (!i.blockedBy?.length) return true;
		// Blocked only if any blocker is still open
		return !i.blockedBy.some((bid) => openIds.has(bid));
	});

	ready.sort((a, b) => a.priority - b.priority);

	if (json) {
		jsonSuccess("ready", { issues: ready, count: ready.length });
	} else {
		if (ready.length === 0) {
			console.log("No ready issues.");
			return;
		}
		for (const issue of ready) printIssueRow(issue);
		console.log(`\n${ready.length} ready issue(s)`);
	}
}
