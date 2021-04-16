"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bumpVersion = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("./cli-utils");
/**
 * Bump a new version.
 *
 * 1. Read the version from `./package.json`.
 * 2. Read the commit log between that version and HEAD.
 * 3. Run `npm version <mode>`. The `<mode>` is:
 *    - `major` if the commit log contained `💥` character.
 *    - `minor` if the commit log contained `✨` character.
 *    - `patch` otherwise.
 */
async function bumpVersion() {
    const packageJsonPath = path_1.default.join(process.cwd(), "package.json");
    const { version } = JSON.parse(await fs_1.promises.readFile(packageJsonPath, "utf8"));
    // Get git-logs since the previous version tag.
    const prevHash = await getHashOfTag(`v${version}`);
    const range = prevHash && `${prevHash}..HEAD`;
    const subjects = await cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} log ${range} --format="%s"`);
    if (subjects.trim() === "") {
        throw new Error(`No commits exist between ${prevHash} and HEAD.`);
    }
    // Bump version
    const mode = detectMode(subjects, typeof version === "string" && version.startsWith("0"));
    await cli_utils_1.sh(`${cli_utils_1.NpmProgram} version ${mode}`);
}
exports.bumpVersion = bumpVersion;
async function getHashOfTag(tag) {
    const subject = await cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} log "${tag}" -1 --format="%s"`);
    const match = /\(built with ([0-9a-z]+)\)$/u.exec(subject);
    return match
        ? match[1]
        : cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} log "${tag}" -1 --format="%h"`);
}
function detectMode(subjects, isExperimental) {
    if (subjects.includes("💥")) {
        return isExperimental ? "minor" : "major";
    }
    if (subjects.includes("✨")) {
        return isExperimental ? "patch" : "minor";
    }
    return "patch";
}
//# sourceMappingURL=bump-version.js.map