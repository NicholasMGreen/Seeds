import { jsonError, jsonSuccess, printError, printIssue } from "../output.js";
import { readIssues } from "../store.js";

export async function cmdShow(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const id = args[0];
	if (!id) {
		const msg = "Issue ID required";
		if (json) jsonError("show", msg);
		else printError(msg);
		process.exit(1);
	}

	const issues = await readIssues(process.cwd());
	const issue = issues.find((i) => i.id === id);

	if (!issue) {
		const msg = `Issue not found: ${id}`;
		if (json) jsonError("show", msg);
		else printError(msg);
		process.exit(1);
	}

	if (json) {
		jsonSuccess("show", { issue });
	} else {
		printIssue(issue);
	}
}
