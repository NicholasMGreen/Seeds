import { randomBytes } from "node:crypto";

/**
 * Generate a collision-checked ID.
 * Issues: "{project}-{4hex}"  e.g. "seeds-a1b2"
 * Templates: "tpl-{4hex}"     e.g. "tpl-b2c9"
 */
export function generateId(prefix: string, existingIds: Set<string>): string {
	let attempts = 0;
	while (attempts < 100) {
		const hex = randomBytes(2).toString("hex");
		const id = `${prefix}-${hex}`;
		if (!existingIds.has(id)) return id;
		attempts++;
	}
	// Fallback to 8 hex chars after 100 collisions
	const hex = randomBytes(4).toString("hex");
	return `${prefix}-${hex}`;
}

export function generateIssueId(project: string, existingIds: Set<string>): string {
	return generateId(project, existingIds);
}

export function generateTemplateId(existingIds: Set<string>): string {
	return generateId("tpl", existingIds);
}
