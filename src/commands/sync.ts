import { jsonError, jsonSuccess, printError, printSuccess } from "../output.js";

export async function cmdSync(args: string[], opts: Record<string, string>): Promise<void> {
	const json = "--json" in opts;
	const statusOnly = "--status" in opts;

	// Check for uncommitted changes
	const statusResult = Bun.spawnSync(["git", "status", "--porcelain", ".seeds/"], {
		cwd: process.cwd(),
	});
	const statusOutput = new TextDecoder().decode(statusResult.stdout).trim();
	const hasChanges = statusOutput.length > 0;

	if (statusOnly) {
		if (json) {
			jsonSuccess("sync", { hasChanges, status: statusOutput || null });
		} else {
			if (hasChanges) {
				console.log("Uncommitted Seeds changes:");
				console.log(statusOutput);
			} else {
				console.log("Seeds is up to date (no uncommitted changes).");
			}
		}
		return;
	}

	if (!hasChanges) {
		if (json) {
			jsonSuccess("sync", { committed: false, message: "Nothing to commit" });
		} else {
			console.log("Nothing to commit.");
		}
		return;
	}

	// Stage .seeds/ changes
	const addResult = Bun.spawnSync(["git", "add", ".seeds/"], { cwd: process.cwd() });
	if (addResult.exitCode !== 0) {
		const msg = `git add failed: ${new TextDecoder().decode(addResult.stderr)}`;
		if (json) jsonError("sync", msg);
		else printError(msg);
		process.exit(1);
	}

	// Commit
	const commitResult = Bun.spawnSync(["git", "commit", "-m", "chore: sync seeds issue data"], {
		cwd: process.cwd(),
	});
	if (commitResult.exitCode !== 0) {
		const msg = `git commit failed: ${new TextDecoder().decode(commitResult.stderr)}`;
		if (json) jsonError("sync", msg);
		else printError(msg);
		process.exit(1);
	}

	if (json) {
		jsonSuccess("sync", { committed: true });
	} else {
		printSuccess("Committed .seeds/ changes.");
	}
}
