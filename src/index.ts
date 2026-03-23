#!/usr/bin/env bun

import { cmdBlocked } from "./commands/blocked.js";
import { cmdClose } from "./commands/close.js";
import { cmdCreate } from "./commands/create.js";
import { cmdDep } from "./commands/dep.js";
import { cmdInit } from "./commands/init.js";
import { cmdList } from "./commands/list.js";
import { cmdMigrate } from "./commands/migrate.js";
import { cmdReady } from "./commands/ready.js";
import { cmdShow } from "./commands/show.js";
import { cmdStats } from "./commands/stats.js";
import { cmdSync } from "./commands/sync.js";
import { cmdTpl } from "./commands/tpl.js";
import { cmdUpdate } from "./commands/update.js";
import { jsonError, printError } from "./output.js";

export const VERSION = "0.1.0";

function parseArgs(argv: string[]): {
	command: string;
	args: string[];
	opts: Record<string, string>;
} {
	const opts: Record<string, string> = {};
	const args: string[] = [];
	let command = "";

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (!arg) continue;
		if (arg.startsWith("--") || arg.startsWith("-")) {
			if (arg === "--json" || arg === "-j") {
				opts["--json"] = "true";
			} else if (arg === "--status" && argv[i + 1] && !argv[i + 1]?.startsWith("-")) {
				i++;
				opts["--status"] = argv[i] ?? "";
			} else if (arg.includes("=")) {
				const eqIdx = arg.indexOf("=");
				opts[arg.slice(0, eqIdx)] = arg.slice(eqIdx + 1);
			} else if (argv[i + 1] && !argv[i + 1]?.startsWith("-")) {
				i++;
				opts[arg] = argv[i] ?? "";
			} else {
				opts[arg] = "true";
			}
		} else if (!command) {
			command = arg;
		} else {
			args.push(arg);
		}
	}

	return { command, args, opts };
}

async function main(): Promise<void> {
	const argv = process.argv.slice(2);

	if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
		printHelp();
		return;
	}

	if (argv[0] === "--version" || argv[0] === "-v") {
		console.log(VERSION);
		return;
	}

	const { command, args, opts } = parseArgs(argv);
	const json = "--json" in opts;

	try {
		switch (command) {
			case "init":
				await cmdInit(args, opts);
				break;
			case "create":
				await cmdCreate(args, opts);
				break;
			case "show":
				await cmdShow(args, opts);
				break;
			case "list":
				await cmdList(args, opts);
				break;
			case "ready":
				await cmdReady(args, opts);
				break;
			case "update":
				await cmdUpdate(args, opts);
				break;
			case "close":
				await cmdClose(args, opts);
				break;
			case "dep":
				await cmdDep(args, opts);
				break;
			case "blocked":
				await cmdBlocked(args, opts);
				break;
			case "stats":
				await cmdStats(args, opts);
				break;
			case "sync":
				await cmdSync(args, opts);
				break;
			case "tpl":
				await cmdTpl(args, opts);
				break;
			case "migrate-from-beads":
				await cmdMigrate(args, opts);
				break;
			default: {
				const msg = `Unknown command '${command}'. Run 'sd --help' for usage.`;
				if (json) jsonError("unknown", msg);
				else printError(msg);
				process.exit(1);
			}
		}
	} catch (e) {
		const msg = (e as Error).message ?? String(e);
		if (json) jsonError(command, msg);
		else printError(msg);
		process.exit(1);
	}
}

function printHelp(): void {
	console.log(`sd v${VERSION} — Git-native issue tracker

Usage: sd <command> [options]

Issue commands:
  init [project]           Initialize .seeds/ in current directory
  create                   Create a new issue (--title required)
  show <id>                Show issue details
  list                     List issues (--status, --type, --assignee, --limit)
  ready                    Show issues with no unresolved blockers
  update <id>              Update issue fields
  close <id> [id2...]      Close one or more issues (--reason)
  dep add <issue> <dep>    Add dependency
  dep remove <issue> <dep> Remove dependency
  dep list <issue>         List dependencies
  blocked                  Show blocked issues
  stats                    Project statistics
  sync                     Stage and commit .seeds/ changes

Template commands:
  tpl create               Create a template (--name required)
  tpl step add <id>        Add step to template (--title required)
  tpl list                 List templates
  tpl show <id>            Show template
  tpl pour <id>            Instantiate template into issues (--prefix)
  tpl status <id>          Show convoy status

Migration:
  migrate-from-beads       Migrate from beads .beads/issues.jsonl

Global flags:
  --json                   Output as JSON
  --version                Show version
  --help                   Show this help
`);
}

main();
