import type { Issue, Template } from "./types.js";
import { PRIORITY_LABELS, STATUS_LABELS } from "./types.js";

const NO_COLOR = process.env.NO_COLOR !== undefined || !process.stdout.isTTY;

function color(code: string, text: string): string {
	if (NO_COLOR) return text;
	return `\x1b[${code}m${text}\x1b[0m`;
}

const c = {
	bold: (s: string) => color("1", s),
	dim: (s: string) => color("2", s),
	green: (s: string) => color("32", s),
	yellow: (s: string) => color("33", s),
	blue: (s: string) => color("34", s),
	cyan: (s: string) => color("36", s),
	red: (s: string) => color("31", s),
	gray: (s: string) => color("90", s),
};

// ─── JSON output ─────────────────────────────────────────────────────────────

export function jsonSuccess(command: string, data: Record<string, unknown>): void {
	console.log(JSON.stringify({ success: true, command, ...data }));
}

export function jsonError(command: string, error: string): void {
	console.log(JSON.stringify({ success: false, command, error }));
}

// ─── Human output ─────────────────────────────────────────────────────────────

function priorityLabel(p: number): string {
	return PRIORITY_LABELS[p] ?? String(p);
}

function statusLabel(s: string): string {
	return STATUS_LABELS[s] ?? s;
}

function statusColor(s: string): string {
	switch (s) {
		case "open":
			return c.green(statusLabel(s));
		case "in_progress":
			return c.yellow(statusLabel(s));
		case "closed":
			return c.gray(statusLabel(s));
		default:
			return statusLabel(s);
	}
}

function priorityColor(p: number): string {
	switch (p) {
		case 0:
			return c.red(priorityLabel(p));
		case 1:
			return c.yellow(priorityLabel(p));
		case 2:
			return c.cyan(priorityLabel(p));
		default:
			return c.dim(priorityLabel(p));
	}
}

export function printIssue(issue: Issue): void {
	console.log(`\n${c.bold(issue.id)}  ${issue.title}`);
	console.log(`  Status:   ${statusColor(issue.status)}`);
	console.log(`  Type:     ${issue.type}`);
	console.log(`  Priority: ${priorityColor(issue.priority)}`);
	if (issue.assignee) console.log(`  Assignee: ${issue.assignee}`);
	if (issue.description) console.log(`  Description: ${issue.description}`);
	if (issue.blockedBy?.length) console.log(`  Blocked by: ${issue.blockedBy.join(", ")}`);
	if (issue.blocks?.length) console.log(`  Blocks: ${issue.blocks.join(", ")}`);
	if (issue.closeReason) console.log(`  Reason: ${issue.closeReason}`);
	console.log(`  Created: ${c.dim(issue.createdAt)}`);
	console.log(`  Updated: ${c.dim(issue.updatedAt)}`);
	if (issue.closedAt) console.log(`  Closed:  ${c.dim(issue.closedAt)}`);
}

export function printIssueRow(issue: Issue): void {
	const id = c.cyan(issue.id.padEnd(16));
	const status = statusColor(issue.status).padEnd(NO_COLOR ? 12 : 22);
	const priority = `P${issue.priority}`;
	console.log(`${id}  ${status}  ${priority}  ${issue.title}`);
}

export function printTemplate(tpl: Template): void {
	console.log(`\n${c.bold(tpl.id)}  ${tpl.name}`);
	tpl.steps.forEach((s, i) => {
		const type = s.type ?? "task";
		const pri = s.priority ?? 2;
		console.log(`  ${c.dim(`${i + 1}.`)} ${s.title}  ${c.dim(`[${type}, P${pri}]`)}`);
	});
}

export function printError(msg: string): void {
	console.error(c.red(`Error: ${msg}`));
}

export function printSuccess(msg: string): void {
	console.log(c.green(msg));
}
