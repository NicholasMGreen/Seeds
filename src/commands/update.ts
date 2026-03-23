import { jsonError, jsonSuccess, printError, printIssue } from "../output.js";
import { updateIssue } from "../store.js";
import type { IssueStatus, IssueType } from "../types.js";
import { VALID_STATUSES, VALID_TYPES } from "../types.js";
import { parsePriority } from "./create.js";

export async function cmdUpdate(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	const id = args[0];
	if (!id) {
		const msg = "Issue ID required";
		if (json) jsonError("update", msg);
		else printError(msg);
		process.exit(1);
	}

	// Build patch
	const patch: Record<string, unknown> = {};

	if (opts["--status"] !== undefined) {
		if (!VALID_STATUSES.includes(opts["--status"] as IssueStatus)) {
			const msg = `Invalid status '${opts["--status"]}'. Use: ${VALID_STATUSES.join(", ")}`;
			if (json) jsonError("update", msg);
			else printError(msg);
			process.exit(1);
		}
		patch.status = opts["--status"];
	}

	if (opts["--title"] !== undefined) patch.title = opts["--title"];
	if (opts["--description"] !== undefined) patch.description = opts["--description"];
	if (opts["--assignee"] !== undefined) patch.assignee = opts["--assignee"];

	if (opts["--type"] !== undefined) {
		if (!VALID_TYPES.includes(opts["--type"] as IssueType)) {
			const msg = `Invalid type '${opts["--type"]}'. Use: ${VALID_TYPES.join(", ")}`;
			if (json) jsonError("update", msg);
			else printError(msg);
			process.exit(1);
		}
		patch.type = opts["--type"];
	}

	if (opts["--priority"] !== undefined) {
		try {
			patch.priority = parsePriority(opts["--priority"]);
		} catch (e) {
			const msg = (e as Error).message;
			if (json) jsonError("update", msg);
			else printError(msg);
			process.exit(1);
		}
	}

	if (Object.keys(patch).length === 0) {
		const msg = "No fields to update";
		if (json) jsonError("update", msg);
		else printError(msg);
		process.exit(1);
	}

	try {
		const updated = await updateIssue(id, patch, cwd);
		if (json) {
			jsonSuccess("update", { issue: updated });
		} else {
			printIssue(updated);
		}
	} catch (e) {
		const msg = (e as Error).message;
		if (json) jsonError("update", msg);
		else printError(msg);
		process.exit(1);
	}
}
