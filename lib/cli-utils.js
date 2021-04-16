"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stdoutOf = exports.sh = exports.rm = exports.cd = exports.wrapNode = exports.quote = exports.NpmProgram = exports.NodeProgram = exports.GitProgram = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
/**
 * `git` command.
 *
 * This is `process.env.npm_config_git` or `"git"`.
 */
exports.GitProgram = quote(process.env.npm_config_git || "git");
/**
 * `node` command.
 *
 * This is `process.execPath`.
 */
exports.NodeProgram = quote(process.execPath);
/**
 * `npm` command.
 *
 * This is `process.env.npm_execpath` or `"npm"`.
 */
exports.NpmProgram = wrapNode(quote(process.env.npm_execpath || "npm"));
/**
 * Enclose a string with double quotes if the string contains whitespaces.
 * @param s The string to address.
 * @returns Addressed string.
 */
function quote(s) {
    return s.includes(" ") && !(s.startsWith('"') && s.endsWith('"'))
        ? `"${s}"`
        : s;
}
exports.quote = quote;
/**
 * Prepend `process.execPath` to a string if the string is a path to JavaScript file.
 * @param s The string to address.
 * @returns Addressed string.
 */
function wrapNode(s) {
    const filePath = s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s;
    if (/\.[cm]?js$/u.test(filePath)) {
        return `${exports.NodeProgram} ${quote(filePath)}`;
    }
    return filePath;
}
exports.wrapNode = wrapNode;
/**
 * Move the current working directory.
 * @param dirPath The path to move.
 */
function cd(dirPath) {
    console.log("$ cd", dirPath);
    process.chdir(dirPath);
}
exports.cd = cd;
/**
 * Remove a directory (recursively).
 * @param dirPath The path to a directory to remove.
 */
function rm(dirPath) {
    console.log("$ rm -rf", dirPath);
    return fs_1.promises.rmdir(dirPath, { recursive: true });
}
exports.rm = rm;
/**
 * Execute a command as a child process.
 * @param command The command to execute.
 * @param options Options.
 */
function sh(command, { cwd, env, mask = x => x } = {}) {
    return new Promise((resolve, reject) => {
        const maskedCommand = mask(command);
        console.log("$", maskedCommand);
        child_process_1.spawn(command, [], { cwd, env, shell: true, stdio: "inherit" })
            .on("error", reject)
            .on("close", (exitCode, signal) => {
            if (exitCode || signal) {
                const error = Object.assign(new Error(`Command Failed: ${maskedCommand}`), { command, exitCode, signal });
                reject(error);
            }
            else {
                resolve();
            }
        });
    });
}
exports.sh = sh;
/**
 * Execute a command as a child process and return the stdout of that.
 * @param command The command to execute.
 * @param options Options.
 * @returns The stdout of the command.
 */
function stdoutOf(command, { cwd, env, mask = x => x } = {}) {
    return new Promise((resolve, reject) => {
        const maskedCommand = mask(command);
        let rawStdout = "";
        console.log("$", maskedCommand, "> self");
        child_process_1.spawn(command, [], {
            cwd,
            env,
            shell: true,
            stdio: ["inherit", "pipe", "inherit"],
        })
            .on("error", reject)
            .on("close", (exitCode, signal) => {
            const stdout = rawStdout.trim();
            if (exitCode || signal) {
                const error = Object.assign(new Error(`Command Failed: ${maskedCommand}`), { command, exitCode, signal, stdout });
                reject(error);
            }
            else {
                resolve(stdout);
            }
        })
            .stdout.setEncoding("utf8")
            .on("data", chunk => {
            console.log(chunk);
            rawStdout += chunk;
        });
    });
}
exports.stdoutOf = stdoutOf;
//# sourceMappingURL=cli-utils.js.map