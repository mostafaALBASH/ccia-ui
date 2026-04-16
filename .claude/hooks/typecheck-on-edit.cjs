#!/usr/bin/env node
// Claude Code PostToolUse hook: runs `npm run typecheck` after Claude edits
// a TypeScript file and surfaces any errors back to the model via asyncRewake.
// Non-blocking: edits proceed immediately, typecheck runs in the background.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function exitSilently() {
  process.exit(0);
}

let raw = "";
try {
  raw = fs.readFileSync(0, "utf8");
} catch {
  exitSilently();
}

let filePath = "";
try {
  const data = JSON.parse(raw);
  filePath =
    (data && data.tool_input && data.tool_input.file_path) ||
    (data && data.tool_response && data.tool_response.filePath) ||
    "";
} catch {
  exitSilently();
}

if (!filePath || !/\.(ts|tsx|mts|cts)$/.test(filePath)) {
  exitSilently();
}

const repoRoot = path.resolve(__dirname, "..", "..");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const result = spawnSync(npmCmd, ["run", "typecheck", "--silent"], {
  cwd: repoRoot,
  stdio: ["ignore", "pipe", "pipe"],
  shell: true,
});

if (result.status === 0) {
  exitSilently();
}

const combined =
  (result.stdout ? result.stdout.toString() : "") +
  (result.stderr ? result.stderr.toString() : "");

const tail = combined.split(/\r?\n/).slice(-60).join("\n");

const payload = {
  systemMessage: `Typecheck failed after editing ${path.basename(filePath)}`,
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext:
      "`npm run typecheck` failed after your last edit. Fix these TypeScript errors before continuing:\n\n" +
      tail,
  },
};

process.stdout.write(JSON.stringify(payload));
process.exit(2);
