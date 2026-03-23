/**
 * Minimal YAML parser — handles flat key-value format only.
 * Supports: string values (quoted and unquoted), no nesting, no arrays.
 */

export function parseYaml(content: string): Record<string, string> {
	const result: Record<string, string> = {};
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const colonIdx = trimmed.indexOf(":");
		if (colonIdx === -1) continue;
		const key = trimmed.slice(0, colonIdx).trim();
		let value = trimmed.slice(colonIdx + 1).trim();
		// Strip surrounding quotes
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		result[key] = value;
	}
	return result;
}

export function stringifyYaml(obj: Record<string, string>): string {
	return `${Object.entries(obj)
		.map(([k, v]) => {
			// Quote values that contain special chars or are empty
			const needsQuotes = v === "" || /[:#\[\]{},&*?|<>=!%@`]/.test(v) || v.includes("\n");
			return `${k}: ${needsQuotes ? `"${v}"` : v}`;
		})
		.join("\n")}\n`;
}
