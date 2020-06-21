import { spawn } from "child_process"
import { promises as fs } from "fs"

export function quote(s: string): string {
    return s.includes(" ") ? `"${s}"` : s
}

export function cd(dirPath: string): void {
    console.log("$ cd", dirPath)
    process.chdir(dirPath)
}

export function rm(dirPath: string): Promise<void> {
    console.log("$ rm -rf", dirPath)
    return fs.rmdir(dirPath, { recursive: true })
}

export function sh(command: string): Promise<void> {
    console.log("$", command)
    return new Promise<void>((resolve, reject) => {
        spawn(command, [], { shell: true, stdio: "inherit" })
            .on("error", reject)
            .on("close", code => {
                if (code) {
                    reject(new Error(`Command Failed: ${command}`))
                } else {
                    resolve()
                }
            })
    })
}

export function stdoutOf(command: string): Promise<string> {
    console.log("$", command, "> self")
    return new Promise<string>((resolve, reject) => {
        let stdout = ""

        spawn(command, [], {
            shell: true,
            stdio: ["inherit", "pipe", "inherit"],
        })
            .on("error", reject)
            .on("close", code => {
                if (code) {
                    reject(new Error(`Command Failed: ${command}`))
                } else {
                    console.log(stdout.trim())
                    resolve(stdout.trim())
                }
            })
            .stdout.setEncoding("utf8")
            .on("data", chunk => (stdout += chunk))
    })
}
