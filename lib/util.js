"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stdoutOf = exports.sh = exports.rm = exports.cd = exports.quote = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
function quote(s) {
    return s.includes(" ") ? `"${s}"` : s;
}
exports.quote = quote;
function cd(dirPath) {
    console.log("$ cd", dirPath);
    process.chdir(dirPath);
}
exports.cd = cd;
function rm(dirPath) {
    console.log("$ rm -rf", dirPath);
    return fs_1.promises.rmdir(dirPath, { recursive: true });
}
exports.rm = rm;
function sh(command) {
    console.log("$", command);
    return new Promise((resolve, reject) => {
        child_process_1.spawn(command, [], { shell: true, stdio: "inherit" })
            .on("error", reject)
            .on("close", code => {
            if (code) {
                reject(new Error(`Command Failed: ${command}`));
            }
            else {
                resolve();
            }
        });
    });
}
exports.sh = sh;
function stdoutOf(command) {
    console.log("$", command, "> self");
    return new Promise((resolve, reject) => {
        let stdout = "";
        child_process_1.spawn(command, [], {
            shell: true,
            stdio: ["inherit", "pipe", "inherit"],
        })
            .on("error", reject)
            .on("close", code => {
            if (code) {
                reject(new Error(`Command Failed: ${command}`));
            }
            else {
                console.log(stdout.trim());
                resolve(stdout.trim());
            }
        })
            .stdout.setEncoding("utf8")
            .on("data", chunk => (stdout += chunk));
    });
}
exports.stdoutOf = stdoutOf;
//# sourceMappingURL=util.js.map