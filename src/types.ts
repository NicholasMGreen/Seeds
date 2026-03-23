export interface Issue {
	// Identity
	id: string; // "{project}-{4hex}"

	// Core
	title: string;
	status: "open" | "in_progress" | "closed";
	type: "task" | "bug" | "feature" | "epic";
	priority: number; // 0=critical, 1=high, 2=medium, 3=low, 4=backlog

	// Optional
	assignee?: string;
	description?: string;
	closeReason?: string;

	// Dependencies
	blocks?: string[];
	blockedBy?: string[];

	// Timestamps
	createdAt: string;
	updatedAt: string;
	closedAt?: string;
}

export interface TemplateStep {
	title: string; // Supports {prefix} interpolation
	type?: string; // Default: "task"
	priority?: number; // Default: 2
}

export interface Template {
	id: string; // "tpl-{4hex}"
	name: string;
	steps: TemplateStep[];
}

export interface ConvoyStatus {
	templateId: string;
	total: number;
	completed: number;
	inProgress: number;
	blocked: number;
	issues: string[];
}

export interface Config {
	project: string;
	version: string;
}

// Priority constants
export const PRIORITY_LABELS: Record<number, string> = {
	0: "Critical",
	1: "High",
	2: "Medium",
	3: "Low",
	4: "Backlog",
};

export const STATUS_LABELS: Record<string, string> = {
	open: "Open",
	in_progress: "In Progress",
	closed: "Closed",
};

export const VALID_STATUSES = ["open", "in_progress", "closed"] as const;
export const VALID_TYPES = ["task", "bug", "feature", "epic"] as const;
export type IssueStatus = (typeof VALID_STATUSES)[number];
export type IssueType = (typeof VALID_TYPES)[number];
