import { jsonSuccess } from "../output.js";
import { readIssues } from "../store.js";

export async function cmdStats(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	const all = await readIssues(cwd);
	const openIds = new Set(all.filter((i) => i.status !== "closed").map((i) => i.id));

	const stats = {
		total: all.length,
		open: all.filter((i) => i.status === "open").length,
		in_progress: all.filter((i) => i.status === "in_progress").length,
		closed: all.filter((i) => i.status === "closed").length,
		blocked: all.filter(
			(i) => i.status !== "closed" && i.blockedBy?.some((bid) => openIds.has(bid)),
		).length,
	};

	if (json) {
		jsonSuccess("stats", { stats });
	} else {
		console.log("\nProject statistics:");
		console.log(`  Total:       ${stats.total}`);
		console.log(`  Open:        ${stats.open}`);
		console.log(`  In progress: ${stats.in_progress}`);
		console.log(`  Closed:      ${stats.closed}`);
		console.log(`  Blocked:     ${stats.blocked}`);
	}
}
