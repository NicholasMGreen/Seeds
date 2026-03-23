import { jsonError, jsonSuccess, printError, printSuccess } from "../output.js";
import { updateIssue } from "../store.js";

export async function cmdClose(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	if (args.length === 0) {
		const msg = "Issue ID(s) required";
		if (json) jsonError("close", msg);
		else printError(msg);
		process.exit(1);
	}

	const reason = opts["--reason"];
	const closedAt = new Date().toISOString();
	const closed: string[] = [];
	const errors: string[] = [];

	for (const id of args) {
		try {
			const patch: Record<string, unknown> = {
				status: "closed",
				closedAt,
			};
			if (reason) patch.closeReason = reason;
			await updateIssue(id, patch, cwd);
			closed.push(id);
		} catch (e) {
			errors.push(`${id}: ${(e as Error).message}`);
		}
	}

	if (errors.length > 0 && closed.length === 0) {
		const msg = errors.join("; ");
		if (json) jsonError("close", msg);
		else printError(msg);
		process.exit(1);
	}

	if (json) {
		jsonSuccess("close", { closed, errors: errors.length ? errors : undefined });
	} else {
		for (const id of closed) printSuccess(`Closed ${id}`);
		for (const err of errors) printError(err);
	}
}
