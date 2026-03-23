import { existsSync } from "node:fs";
import { join } from "node:path";
import { isInitialized } from "../config.js";
import { jsonError, jsonSuccess, printError, printSuccess } from "../output.js";
import { appendIssue } from "../store.js";
import type { Issue } from "../types.js";

interface BeadsIssue {
	id?: string;
	title?: string;
	issue_type?: string;
	type?: string;
	status?: string;
	priority?: number;
	owner?: string;
	assignee?: string;
	description?: string;
	blocks?: string[];
	blockedBy?: string[];
	closeReason?: string;
	close_reason?: string;
	createdAt?: string;
	created_at?: string;
	updatedAt?: string;
	updated_at?: string;
	closedAt?: string;
	closed_at?: string;
}

export async function cmdMigrate(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const cwd = process.cwd();

	if (!isInitialized(cwd)) {
		const msg = "Seeds not initialized. Run 'sd init' first.";
		if (json) jsonError("migrate", msg);
		else printError(msg);
		process.exit(1);
	}

	const beadsPath = join(cwd, ".beads", "issues.jsonl");
	if (!existsSync(beadsPath)) {
		const msg = `Beads issues file not found at ${beadsPath}`;
		if (json) jsonError("migrate", msg);
		else printError(msg);
		process.exit(1);
	}

	const text = await Bun.file(beadsPath).text();
	const lines = text.split("\n").filter((l) => l.trim());
	const migrated: string[] = [];
	const errors: string[] = [];

	for (const line of lines) {
		try {
			const beads = JSON.parse(line) as BeadsIssue;
			if (!beads.id || !beads.title) continue;

			const statusMap: Record<string, Issue["status"]> = {
				open: "open",
				in_progress: "in_progress",
				inprogress: "in_progress",
				closed: "closed",
				done: "closed",
			};

			const status: Issue["status"] = statusMap[beads.status?.toLowerCase() ?? "open"] ?? "open";
			const type = (beads.issue_type ?? beads.type ?? "task") as Issue["type"];
			const now = new Date().toISOString();

			const issue: Issue = {
				id: beads.id,
				title: beads.title,
				status,
				type,
				priority: beads.priority ?? 2,
				createdAt: beads.createdAt ?? beads.created_at ?? now,
				updatedAt: beads.updatedAt ?? beads.updated_at ?? now,
			};

			if (beads.owner ?? beads.assignee) issue.assignee = beads.owner ?? beads.assignee;
			if (beads.description) issue.description = beads.description;
			if (beads.closeReason ?? beads.close_reason)
				issue.closeReason = beads.closeReason ?? beads.close_reason;
			if (beads.closedAt ?? beads.closed_at) issue.closedAt = beads.closedAt ?? beads.closed_at;
			if (beads.blocks?.length) issue.blocks = beads.blocks;
			if (beads.blockedBy?.length) issue.blockedBy = beads.blockedBy;

			await appendIssue(issue, cwd);
			migrated.push(issue.id);
		} catch (e) {
			errors.push((e as Error).message);
		}
	}

	if (json) {
		jsonSuccess("migrate", { migrated: migrated.length, errors: errors.length, ids: migrated });
	} else {
		printSuccess(`Migrated ${migrated.length} issue(s) from beads.`);
		if (errors.length) {
			console.log(`Errors: ${errors.length}`);
			for (const err of errors) console.log(`  ${err}`);
		}
	}
}
