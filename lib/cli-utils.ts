import { spawn } from "child_process"
import { promises as fs } from "fs"

/**
 * `git` command.
 *
 * This is `process.env.npm_config_git` or `"git"`.
 */
export const GitProgram = quote(process.env.npm_config_git || "git")

/**
 * `node` command.
 *
 * This is `process.execPath`.
 */
export const NodeProgram = quote(process.execPath)

/**
 * `npm` command.
 *
 * This is `process.env.npm_execpath` or `"npm"`.
 */
export const NpmProgram = wrapNode(quote(process.env.npm_execpath || "npm"))

/**
 * Enclose a string with double quotes if the string contains whitespaces.
 * @param s The string to address.
 * @returns Addressed string.
 */
export function quote(s: string): string {
    return s.includes(" ") && !(s.startsWith('"') && s.endsWith('"'))
        ? `"${s}"`
        : s
}

/**
 * Prepend `process.execPath` to a string if the string is a path to JavaScript file.
 * @param s The string to address.
 * @returns Addressed string.
 */
export function wrapNode(s: string): string {
    const filePath = s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) : s
    if (/\.[cm]?js$/u.test(filePath)) {
        return `${NodeProgram} ${quote(filePath)}`
    }
    return filePath
}

/**
 * Move the current working directory.
 * @param dirPath The path to move.
 */
export function cd(dirPath: string): void {
    console.log("$ cd", dirPath)
    process.chdir(dirPath)
}

/**
 * Remove a directory (recursively).
 * @param dirPath The path to a directory to remove.
 */
export function rm(dirPath: string): Promise<void> {
    console.log("$ rm -rf", dirPath)
    return fs.rmdir(dirPath, { recursive: true })
}

/**
 * Execute a command as a child process.
 * @param command The command to execute.
 * @param options Options.
 */
export function sh(
    command: string,
    { cwd, env, mask = x => x }: sh.Options = {},
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const maskedCommand = mask(command)

        console.log("$", maskedCommand)
        spawn(command, [], { cwd, env, shell: true, stdio: "inherit" })
            .on("error", reject)
            .on("close", (exitCode, signal) => {
                if (exitCode || signal) {
                    const error = Object.assign(
                        new Error(`Command Failed: ${maskedCommand}`),
                        { command, exitCode, signal },
                    )
                    reject(error)
                } else {
                    resolve()
                }
            })
    })
}

export namespace sh {
    export type Options = {
        cwd?: string
        env?: Record<string, string>
        mask?: (command: string) => string
    }
}

/**
 * Execute a command as a child process and return the stdout of that.
 * @param command The command to execute.
 * @param options Options.
 * @returns The stdout of the command.
 */
export function stdoutOf(
    command: string,
    { cwd, env, mask = x => x }: sh.Options = {},
): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const maskedCommand = mask(command)
        let rawStdout = ""

        console.log("$", maskedCommand, "> self")
        spawn(command, [], {
            cwd,
            env,
            shell: true,
            stdio: ["inherit", "pipe", "inherit"],
        })
            .on("error", reject)
            .on("close", (exitCode, signal) => {
                const stdout = rawStdout.trim()
                if (exitCode || signal) {
                    const error = Object.assign(
                        new Error(`Command Failed: ${maskedCommand}`),
                        { command, exitCode, signal, stdout },
                    )
                    reject(error)
                } else {
                    resolve(stdout)
                }
            })
            .stdout.setEncoding("utf8")
            .on("data", chunk => {
                console.log(chunk)
                rawStdout += chunk
            })
    })
}
