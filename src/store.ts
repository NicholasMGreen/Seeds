import { existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { getIssuesPath, getSeedsDir, getTemplatesPath } from "./config.js";
import type { Issue, Template } from "./types.js";

const LOCK_STALE_MS = 30_000;
const LOCK_RETRY_MS = 50;
const LOCK_TIMEOUT_MS = 5_000;

function lockPath(filePath: string): string {
	return `${filePath}.lock`;
}

async function acquireLock(filePath: string): Promise<void> {
	const lockFile = lockPath(filePath);
	const deadline = Date.now() + LOCK_TIMEOUT_MS;

	while (Date.now() < deadline) {
		try {
			// O_CREAT | O_EXCL: atomic, fails if exists
			const fd = Bun.file(lockFile);
			const exists = existsSync(lockFile);
			if (!exists) {
				await Bun.write(lockFile, String(Date.now()));
				return;
			}
			// Check if stale
			const stat = await fd.stat?.();
			const mtime = stat?.mtime?.getTime?.() ?? 0;
			if (Date.now() - mtime > LOCK_STALE_MS) {
				try {
					unlinkSync(lockFile);
				} catch {
					// Another process may have deleted it
				}
				continue;
			}
		} catch {
			// Lock creation failed — another process beat us
		}
		await new Promise((r) => setTimeout(r, LOCK_RETRY_MS));
	}
	throw new Error(`Timeout acquiring lock on ${filePath}`);
}

function releaseLock(filePath: string): void {
	try {
		unlinkSync(lockPath(filePath));
	} catch {
		// Best-effort
	}
}

async function withLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
	await acquireLock(filePath);
	try {
		return await fn();
	} finally {
		releaseLock(filePath);
	}
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export async function readIssues(cwd = process.cwd()): Promise<Issue[]> {
	const path = getIssuesPath(cwd);
	if (!existsSync(path)) return [];
	const text = await Bun.file(path).text();
	const seen = new Map<string, Issue>();
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			const issue = JSON.parse(trimmed) as Issue;
			if (issue.id) seen.set(issue.id, issue); // last occurrence wins
		} catch {
			// Skip malformed lines
		}
	}
	return Array.from(seen.values());
}

export async function appendIssue(issue: Issue, cwd = process.cwd()): Promise<void> {
	const path = getIssuesPath(cwd);
	await withLock(path, async () => {
		const line = `${JSON.stringify(issue)}\n`;
		const existing = existsSync(path) ? await Bun.file(path).text() : "";
		await Bun.write(path, existing + line);
	});
}

export async function writeIssues(issues: Issue[], cwd = process.cwd()): Promise<void> {
	const path = getIssuesPath(cwd);
	await withLock(path, async () => {
		await atomicWrite(path, `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`);
	});
}

export async function updateIssue(
	id: string,
	patch: Partial<Issue>,
	cwd = process.cwd(),
): Promise<Issue> {
	const path = getIssuesPath(cwd);
	return withLock(path, async () => {
		const issues = await readIssues(cwd);
		const idx = issues.findIndex((i) => i.id === id);
		if (idx === -1) throw new Error(`Issue not found: ${id}`);
		const updated = { ...issues[idx], ...patch, updatedAt: new Date().toISOString() } as Issue;
		issues[idx] = updated;
		await atomicWrite(path, `${issues.map((i) => JSON.stringify(i)).join("\n")}\n`);
		return updated;
	});
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function readTemplates(cwd = process.cwd()): Promise<Template[]> {
	const path = getTemplatesPath(cwd);
	if (!existsSync(path)) return [];
	const text = await Bun.file(path).text();
	const seen = new Map<string, Template>();
	for (const line of text.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		try {
			const tpl = JSON.parse(trimmed) as Template;
			if (tpl.id) seen.set(tpl.id, tpl);
		} catch {
			// Skip malformed lines
		}
	}
	return Array.from(seen.values());
}

export async function appendTemplate(tpl: Template, cwd = process.cwd()): Promise<void> {
	const path = getTemplatesPath(cwd);
	await withLock(path, async () => {
		const line = `${JSON.stringify(tpl)}\n`;
		const existing = existsSync(path) ? await Bun.file(path).text() : "";
		await Bun.write(path, existing + line);
	});
}

export async function writeTemplates(templates: Template[], cwd = process.cwd()): Promise<void> {
	const path = getTemplatesPath(cwd);
	await withLock(path, async () => {
		await atomicWrite(path, `${templates.map((t) => JSON.stringify(t)).join("\n")}\n`);
	});
}

export async function updateTemplate(
	id: string,
	patch: Partial<Template>,
	cwd = process.cwd(),
): Promise<Template> {
	const path = getTemplatesPath(cwd);
	return withLock(path, async () => {
		const templates = await readTemplates(cwd);
		const idx = templates.findIndex((t) => t.id === id);
		if (idx === -1) throw new Error(`Template not found: ${id}`);
		const updated = { ...templates[idx], ...patch } as Template;
		templates[idx] = updated;
		await atomicWrite(path, `${templates.map((t) => JSON.stringify(t)).join("\n")}\n`);
		return updated;
	});
}

// ─── Atomic write helper ──────────────────────────────────────────────────────

async function atomicWrite(targetPath: string, content: string): Promise<void> {
	const dir = getSeedsDir(process.cwd());
	// Ensure dir exists
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	const tmpPath = join(dir, `${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
	await Bun.write(tmpPath, content);
	renameSync(tmpPath, targetPath);
}

// Export for tests
export { withLock, acquireLock, releaseLock };
