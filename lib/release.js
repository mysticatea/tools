"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.release = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const util_1 = require("./util");
async function release() {
    const packageJsonPath = path_1.default.join(process.cwd(), "package.json");
    const npmPath = wrapNode(util_1.quote(process.env.npm_execpath || "npm"));
    const gitPath = util_1.quote(process.env.npm_config_git || "git");
    const npmLifecycleEvent = process.env.npm_lifecycle_event;
    // Ensure this is in the postversion script.
    if (npmLifecycleEvent !== "postversion") {
        console.error('This script must be run in the "postversion" script.');
    }
    // Read version.
    const { version: rawVersion } = JSON.parse(await fs_1.promises.readFile(packageJsonPath, "utf8"));
    // Read origin.
    const originUrl = await util_1.stdoutOf(`${gitPath} remote get-url origin`);
    const originBranch = await util_1.stdoutOf(`${gitPath} symbolic-ref --short refs/remotes/origin/HEAD`);
    if (!originUrl) {
        throw new Error('Remote "origin" must be set.');
    }
    if (!originBranch.startsWith("origin/")) {
        throw new Error(`Invalid default branch of origin: ${JSON.stringify(originBranch)}`);
    }
    // Read git information.
    const defaultBranch = originBranch.slice("origin/".length);
    const branch = await util_1.stdoutOf(`${gitPath} symbolic-ref --short HEAD`);
    const isDefaultBranch = branch === defaultBranch;
    const version = isDefaultBranch ? rawVersion : `${rawVersion}-${branch}`;
    const sha1 = await util_1.stdoutOf(`${gitPath} log -1 --format="%h"`);
    const commitMessage = `🔖 ${version} (built with ${sha1})`;
    // Push
    await util_1.sh(`${gitPath} push`);
    // Delete the tag `npm version` created to use it for the release commit.
    try {
        await util_1.sh(`${gitPath} tag -d "v${rawVersion}"`);
    }
    catch (ignore) {
        // Ignore
    }
    // Make the release commit that contains only `dist` directory.
    util_1.cd("dist");
    await util_1.sh(`${gitPath} init`);
    try {
        await util_1.sh(`${gitPath} add .`);
        await util_1.sh(`${gitPath} commit -m "${commitMessage}"`);
        await util_1.sh(`${gitPath} tag "v${version}"`);
        await util_1.sh(`${gitPath} push "${originUrl}" "v${version}"`);
        if (isDefaultBranch) {
            await util_1.sh(`${npmPath} publish`);
        }
    }
    finally {
        // Clean
        await util_1.rm(".git");
        util_1.cd("..");
        // Fetch the new tag.
        await util_1.sh(`${gitPath} fetch --tags`);
    }
}
exports.release = release;
function wrapNode(s) {
    if (/\.[cm]?js"?$/u.test(s)) {
        return `${util_1.quote(process.execPath)} ${s}`;
    }
    return s;
}
//# sourceMappingURL=release.js.map