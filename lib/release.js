"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const cli_utils_1 = require("./cli-utils");
/**
 * Release an npm package.
 *
 * This function assume to be called in `postversion` script of npm.
 *
 * Does the following steps:
 *
 * 1. Remove the latest version tag.
 * 2. Create an orphan commit with the `dist` directory content.
 * 3. Set the version tag at that orphan commit.
 * 4. Push the version tag and the commit.
 * 5. Run `npm publish` at the `dist` directory.
 *
 * @param options Options.
 */
async function release({ artifactRootPath = "dist", noPublish = false, } = {}) {
    const packageJsonPath = path_1.default.join(process.cwd(), "package.json");
    const npmLifecycleEvent = process.env.npm_lifecycle_event;
    // Ensure this is in the postversion script.
    if (npmLifecycleEvent !== "postversion") {
        console.error('This script must be run in the "postversion" script.');
    }
    // Read version.
    const { version: rawVersion } = JSON.parse(await fs_1.promises.readFile(packageJsonPath, "utf8"));
    // Read origin.
    const originUrl = await cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} remote get-url origin`);
    const originBranch = await cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} symbolic-ref --short refs/remotes/origin/HEAD`);
    if (!originUrl) {
        throw new Error('Remote "origin" must be set.');
    }
    if (!originBranch.startsWith("origin/")) {
        throw new Error(`Invalid default branch of origin: ${JSON.stringify(originBranch)}`);
    }
    // Read git information.
    const defaultBranch = originBranch.slice("origin/".length);
    const branch = await cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} symbolic-ref --short HEAD`);
    const isDefaultBranch = branch === defaultBranch;
    const version = isDefaultBranch ? rawVersion : `${rawVersion}-${branch}`;
    const sha1 = await cli_utils_1.stdoutOf(`${cli_utils_1.GitProgram} log -1 --format="%h"`);
    const commitMessage = `🔖 ${version} (built with ${sha1})`;
    // Push
    await cli_utils_1.sh(`${cli_utils_1.GitProgram} push origin "${branch}"`);
    // Delete the tag `npm version` created to use it for the release commit.
    try {
        await cli_utils_1.sh(`${cli_utils_1.GitProgram} tag -d "v${rawVersion}"`);
    }
    catch (ignore) {
        // Ignore
    }
    // Make the release commit that contains only `dist` directory.
    cli_utils_1.cd(artifactRootPath);
    await cli_utils_1.sh(`${cli_utils_1.GitProgram} init`);
    try {
        await cli_utils_1.sh(`${cli_utils_1.GitProgram} add .`);
        await cli_utils_1.sh(`${cli_utils_1.GitProgram} commit -m "${commitMessage}"`);
        await cli_utils_1.sh(`${cli_utils_1.GitProgram} tag "v${version}"`);
        await cli_utils_1.sh(`${cli_utils_1.GitProgram} push "${originUrl}" "v${version}"`);
        if (isDefaultBranch && !noPublish) {
            await cli_utils_1.sh(`${cli_utils_1.NpmProgram} publish`);
        }
    }
    finally {
        // Clean
        await cli_utils_1.rm(".git");
        cli_utils_1.cd("..");
        // Fetch the new tag.
        await cli_utils_1.sh(`${cli_utils_1.GitProgram} fetch --tags`);
    }
}
exports.release = release;
//# sourceMappingURL=release.js.map