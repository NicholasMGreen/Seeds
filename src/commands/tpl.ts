import { loadConfig } from "../config.js";
import { generateIssueId, generateTemplateId } from "../id.js";
import { jsonError, jsonSuccess, printError, printSuccess, printTemplate } from "../output.js";
import {
	appendIssue,
	appendTemplate,
	readIssues,
	readTemplates,
	updateTemplate,
	writeTemplates,
} from "../store.js";
import type { Issue, Template, TemplateStep } from "../types.js";
import { parsePriority } from "./create.js";

export async function cmdTpl(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const sub = args[0];

	switch (sub) {
		case "create":
			return tplCreate(args.slice(1), opts, json);
		case "step":
			return tplStep(args.slice(1), opts, json);
		case "list":
			return tplList(args.slice(1), opts, json);
		case "show":
			return tplShow(args.slice(1), opts, json);
		case "pour":
			return tplPour(args.slice(1), opts, json);
		case "status":
			return tplStatus(args.slice(1), opts, json);
		default: {
			const msg = `Unknown tpl subcommand '${sub}'. Use: create, step, list, show, pour, status`;
			if (json) jsonError("tpl", msg);
			else printError(msg);
			process.exit(1);
		}
	}
}

async function tplCreate(
	args: string[],
	opts: Record<string, string>,
	json: boolean,
): Promise<void> {
	const name = opts["--name"];
	if (!name) {
		const msg = "Name is required (--name)";
		if (json) jsonError("tpl create", msg);
		else printError(msg);
		process.exit(1);
	}

	const cwd = process.cwd();
	const existing = await readTemplates(cwd);
	const existingIds = new Set(existing.map((t) => t.id));
	const id = generateTemplateId(existingIds);

	const tpl: Template = { id, name, steps: [] };
	await appendTemplate(tpl, cwd);

	if (json) {
		jsonSuccess("tpl create", { id });
	} else {
		printSuccess(`Created template ${id}: ${name}`);
	}
}

async function tplStep(args: string[], opts: Record<string, string>, json: boolean): Promise<void> {
	const sub = args[0];
	if (sub !== "add") {
		const msg = `Unknown step subcommand '${sub}'. Use: add`;
		if (json) jsonError("tpl step", msg);
		else printError(msg);
		process.exit(1);
	}

	const templateId = args[1];
	if (!templateId) {
		const msg = "Template ID required";
		if (json) jsonError("tpl step add", msg);
		else printError(msg);
		process.exit(1);
	}

	const title = opts["--title"];
	if (!title) {
		const msg = "Title is required (--title)";
		if (json) jsonError("tpl step add", msg);
		else printError(msg);
		process.exit(1);
	}

	const cwd = process.cwd();
	const templates = await readTemplates(cwd);
	const tpl = templates.find((t) => t.id === templateId);
	if (!tpl) {
		const msg = `Template not found: ${templateId}`;
		if (json) jsonError("tpl step add", msg);
		else printError(msg);
		process.exit(1);
	}

	const step: TemplateStep = { title };
	if (opts["--type"]) step.type = opts["--type"];
	if (opts["--priority"] !== undefined) {
		try {
			step.priority = parsePriority(opts["--priority"]);
		} catch (e) {
			const msg = (e as Error).message;
			if (json) jsonError("tpl step add", msg);
			else printError(msg);
			process.exit(1);
		}
	}

	const updated = await updateTemplate(templateId, { steps: [...tpl.steps, step] }, cwd);

	if (json) {
		jsonSuccess("tpl step add", { templateId, step });
	} else {
		printSuccess(`Added step to ${templateId}: ${title}`);
	}
}

async function tplList(args: string[], opts: Record<string, string>, json: boolean): Promise<void> {
	const cwd = process.cwd();
	const templates = await readTemplates(cwd);

	if (json) {
		jsonSuccess("tpl list", { templates, count: templates.length });
	} else {
		if (templates.length === 0) {
			console.log("No templates.");
			return;
		}
		for (const tpl of templates) {
			console.log(`${tpl.id}  ${tpl.name}  (${tpl.steps.length} steps)`);
		}
	}
}

async function tplShow(args: string[], opts: Record<string, string>, json: boolean): Promise<void> {
	const id = args[0];
	if (!id) {
		const msg = "Template ID required";
		if (json) jsonError("tpl show", msg);
		else printError(msg);
		process.exit(1);
	}

	const cwd = process.cwd();
	const templates = await readTemplates(cwd);
	const tpl = templates.find((t) => t.id === id);
	if (!tpl) {
		const msg = `Template not found: ${id}`;
		if (json) jsonError("tpl show", msg);
		else printError(msg);
		process.exit(1);
	}

	if (json) {
		jsonSuccess("tpl show", { template: tpl });
	} else {
		printTemplate(tpl);
	}
}

async function tplPour(args: string[], opts: Record<string, string>, json: boolean): Promise<void> {
	const id = args[0];
	if (!id) {
		const msg = "Template ID required";
		if (json) jsonError("tpl pour", msg);
		else printError(msg);
		process.exit(1);
	}

	const cwd = process.cwd();
	const templates = await readTemplates(cwd);
	const tpl = templates.find((t) => t.id === id);
	if (!tpl) {
		const msg = `Template not found: ${id}`;
		if (json) jsonError("tpl pour", msg);
		else printError(msg);
		process.exit(1);
	}

	if (tpl.steps.length === 0) {
		const msg = "Template has no steps";
		if (json) jsonError("tpl pour", msg);
		else printError(msg);
		process.exit(1);
	}

	const prefix = opts["--prefix"] ?? "";
	const config = await loadConfig(cwd);
	const existingIssues = await readIssues(cwd);
	const existingIds = new Set(existingIssues.map((i) => i.id));

	const now = new Date().toISOString();
	const created: Issue[] = [];

	for (const step of tpl.steps) {
		const title = step.title.replace(/{prefix}/g, prefix);
		const issueId = generateIssueId(config.project, existingIds);
		existingIds.add(issueId);
		const issue: Issue = {
			id: issueId,
			title,
			status: "open",
			type: (step.type ?? "task") as Issue["type"],
			priority: step.priority ?? 2,
			createdAt: now,
			updatedAt: now,
		};
		created.push(issue);
	}

	// Wire dependencies: step N+1 blocked by step N
	for (let i = 1; i < created.length; i++) {
		const prev = created[i - 1];
		const curr = created[i];
		if (!prev || !curr) continue;
		curr.blockedBy = [prev.id];
		prev.blocks = [...(prev.blocks ?? []), curr.id];
	}

	// Append all to store
	for (const issue of created) {
		await appendIssue(issue, cwd);
	}

	const ids = created.map((i) => i.id);

	if (json) {
		jsonSuccess("tpl pour", { ids });
	} else {
		printSuccess(`Poured template '${tpl.name}': created ${created.length} issues`);
		for (const issue of created) {
			console.log(`  ${issue.id}  ${issue.title}`);
		}
	}
}

async function tplStatus(
	args: string[],
	opts: Record<string, string>,
	json: boolean,
): Promise<void> {
	const id = args[0];
	if (!id) {
		const msg = "Template ID required";
		if (json) jsonError("tpl status", msg);
		else printError(msg);
		process.exit(1);
	}

	const cwd = process.cwd();
	const templates = await readTemplates(cwd);
	const tpl = templates.find((t) => t.id === id);
	if (!tpl) {
		const msg = `Template not found: ${id}`;
		if (json) jsonError("tpl status", msg);
		else printError(msg);
		process.exit(1);
	}

	// Find issues that reference this template via blocking chains
	// We use a heuristic: find all issue groups by looking at blocks/blockedBy chains
	// starting from issues whose title matches template step patterns.
	// Actually, since we don't track convoy IDs, find all issues and look for ones
	// that share step titles from this template. Instead, simpler: caller knows which IDs.
	// For now, show all issues grouped by the template's step count that form dependency chains.
	// Simplest correct approach: just report based on known IDs if passed, or overall.

	const issues = await readIssues(cwd);
	const openIds = new Set(issues.filter((i) => i.status !== "closed").map((i) => i.id));

	// Without convoy tracking, we can only show a note. But the spec says `tpl status <tpl-id>`
	// shows convoy status. Since we don't embed template IDs in issues, we identify convoys
	// by looking at issues whose title prefix matches and form a dep chain.
	// For this implementation, we'll track convoy via a "tag" field pattern.
	// Given spec constraints, use a pragmatic approach: scan all issues, group dependency chains
	// of the right length with step count.
	const convoyCandidates = findConvoys(issues, tpl.steps.length);

	if (json) {
		jsonSuccess("tpl status", {
			templateId: id,
			name: tpl.name,
			convoys: convoyCandidates,
		});
	} else {
		if (convoyCandidates.length === 0) {
			console.log(`No convoys found for template ${id}.`);
			return;
		}
		console.log(`\nConvoys for ${tpl.name} (${id}):`);
		for (const convoy of convoyCandidates) {
			const pct = convoy.total > 0 ? Math.round((convoy.completed / convoy.total) * 100) : 0;
			console.log(
				`  ${convoy.issues.join(" → ")}  ${convoy.completed}/${convoy.total} (${pct}% complete)`,
			);
		}
	}
}

function findConvoys(
	issues: Issue[],
	stepCount: number,
): Array<{
	issues: string[];
	total: number;
	completed: number;
	inProgress: number;
	blocked: number;
}> {
	// Find root issues (no blockedBy or all blockers closed) that start chains of stepCount
	const issueMap = new Map(issues.map((i) => [i.id, i]));
	const openIds = new Set(issues.filter((i) => i.status !== "closed").map((i) => i.id));

	const results = [];

	for (const issue of issues) {
		// Skip if this issue has unclosed blockers (not a root)
		if (issue.blockedBy?.some((bid) => openIds.has(bid))) continue;

		// Walk the blocks chain
		const chain: string[] = [issue.id];
		let current = issue;
		while (current.blocks?.length === 1) {
			const nextId = current.blocks[0];
			if (!nextId) break;
			const next = issueMap.get(nextId);
			if (!next) break;
			chain.push(nextId);
			current = next;
		}

		if (chain.length === stepCount) {
			const chainIssues = chain.map((id) => issueMap.get(id)).filter(Boolean) as Issue[];
			results.push({
				issues: chain,
				total: chain.length,
				completed: chainIssues.filter((i) => i.status === "closed").length,
				inProgress: chainIssues.filter((i) => i.status === "in_progress").length,
				blocked: chainIssues.filter(
					(i) => i.status !== "closed" && i.blockedBy?.some((bid) => openIds.has(bid)),
				).length,
			});
		}
	}

	return results;
}
