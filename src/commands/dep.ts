import { jsonError, jsonSuccess, printError, printIssueRow, printSuccess } from "../output.js";
import { readIssues, updateIssue } from "../store.js";

export async function cmdDep(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();
	const sub = args[0];

	switch (sub) {
		case "add":
			return depAdd(args.slice(1), opts, json, cwd);
		case "remove":
			return depRemove(args.slice(1), opts, json, cwd);
		case "list":
			return depList(args.slice(1), opts, json, cwd);
		default: {
			const msg = `Unknown dep subcommand '${sub}'. Use: add, remove, list`;
			if (json) jsonError("dep", msg);
			else printError(msg);
			process.exit(1);
		}
	}
}

async function depAdd(
	args: string[],
	opts: Record<string, string>,
	json: boolean,
	cwd: string,
): Promise<void> {
	const [issueId, dependsOn] = args;
	if (!issueId || !dependsOn) {
		const msg = "Usage: sd dep add <issue> <depends-on>";
		if (json) jsonError("dep add", msg);
		else printError(msg);
		process.exit(1);
	}

	const issues = await readIssues(cwd);
	const issue = issues.find((i) => i.id === issueId);
	const dep = issues.find((i) => i.id === dependsOn);

	if (!issue) {
		const msg = `Issue not found: ${issueId}`;
		if (json) jsonError("dep add", msg);
		else printError(msg);
		process.exit(1);
	}
	if (!dep) {
		const msg = `Issue not found: ${dependsOn}`;
		if (json) jsonError("dep add", msg);
		else printError(msg);
		process.exit(1);
	}

	const blockedBy = [...new Set([...(issue.blockedBy ?? []), dependsOn])];
	const blocks = [...new Set([...(dep.blocks ?? []), issueId])];

	await updateIssue(issueId, { blockedBy }, cwd);
	await updateIssue(dependsOn, { blocks }, cwd);

	if (json) {
		jsonSuccess("dep add", { issue: issueId, dependsOn });
	} else {
		printSuccess(`${issueId} now depends on ${dependsOn}`);
	}
}

async function depRemove(
	args: string[],
	opts: Record<string, string>,
	json: boolean,
	cwd: string,
): Promise<void> {
	const [issueId, dependsOn] = args;
	if (!issueId || !dependsOn) {
		const msg = "Usage: sd dep remove <issue> <depends-on>";
		if (json) jsonError("dep remove", msg);
		else printError(msg);
		process.exit(1);
	}

	const issues = await readIssues(cwd);
	const issue = issues.find((i) => i.id === issueId);
	const dep = issues.find((i) => i.id === dependsOn);

	if (!issue) {
		const msg = `Issue not found: ${issueId}`;
		if (json) jsonError("dep remove", msg);
		else printError(msg);
		process.exit(1);
	}

	const blockedBy = (issue.blockedBy ?? []).filter((id) => id !== dependsOn);
	await updateIssue(issueId, { blockedBy: blockedBy.length ? blockedBy : undefined }, cwd);

	if (dep) {
		const blocks = (dep.blocks ?? []).filter((id) => id !== issueId);
		await updateIssue(dependsOn, { blocks: blocks.length ? blocks : undefined }, cwd);
	}

	if (json) {
		jsonSuccess("dep remove", { issue: issueId, dependsOn });
	} else {
		printSuccess(`Removed dependency: ${issueId} no longer depends on ${dependsOn}`);
	}
}

async function depList(
	args: string[],
	opts: Record<string, string>,
	json: boolean,
	cwd: string,
): Promise<void> {
	const issueId = args[0];
	if (!issueId) {
		const msg = "Usage: sd dep list <issue>";
		if (json) jsonError("dep list", msg);
		else printError(msg);
		process.exit(1);
	}

	const issues = await readIssues(cwd);
	const issue = issues.find((i) => i.id === issueId);

	if (!issue) {
		const msg = `Issue not found: ${issueId}`;
		if (json) jsonError("dep list", msg);
		else printError(msg);
		process.exit(1);
	}

	const blockedBy = issue.blockedBy ?? [];
	const blocks = issue.blocks ?? [];

	if (json) {
		jsonSuccess("dep list", { issue: issueId, blockedBy, blocks });
	} else {
		console.log(`\nDependencies for ${issueId}:`);
		if (blockedBy.length === 0 && blocks.length === 0) {
			console.log("  No dependencies.");
			return;
		}
		if (blockedBy.length) {
			console.log("  Blocked by:");
			for (const id of blockedBy) {
				const dep = issues.find((i) => i.id === id);
				if (dep) printIssueRow(dep);
				else console.log(`    ${id} (not found)`);
			}
		}
		if (blocks.length) {
			console.log("  Blocks:");
			for (const id of blocks) {
				const dep = issues.find((i) => i.id === id);
				if (dep) printIssueRow(dep);
				else console.log(`    ${id} (not found)`);
			}
		}
	}
}
