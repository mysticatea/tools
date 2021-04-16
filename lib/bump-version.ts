import { promises as fs } from "fs"
import path from "path"
import { GitProgram, NpmProgram, sh, stdoutOf } from "./cli-utils"

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
export async function bumpVersion(): Promise<void> {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const { version } = JSON.parse(await fs.readFile(packageJsonPath, "utf8"))

    // Get git-logs since the previous version tag.
    const prevHash = await getHashOfTag(`v${version}`)
    const range = prevHash && `${prevHash}..HEAD`
    const subjects = await stdoutOf(`${GitProgram} log ${range} --format="%s"`)
    if (subjects.trim() === "") {
        throw new Error(`No commits exist between ${prevHash} and HEAD.`)
    }

    // Bump version
    const mode = detectMode(
        subjects,
        typeof version === "string" && version.startsWith("0"),
    )
    await sh(`${NpmProgram} version ${mode}`)
}

async function getHashOfTag(tag: string): Promise<string> {
    const subject = await stdoutOf(
        `${GitProgram} log "${tag}" -1 --format="%s"`,
    )
    const match = /\(built with ([0-9a-z]+)\)$/u.exec(subject)
    return match
        ? match[1]
        : stdoutOf(`${GitProgram} log "${tag}" -1 --format="%h"`)
}

function detectMode(subjects: string, isExperimental: boolean): string {
    if (subjects.includes("💥")) {
        return isExperimental ? "minor" : "major"
    }
    if (subjects.includes("✨")) {
        return isExperimental ? "patch" : "minor"
    }
    return "patch"
}
