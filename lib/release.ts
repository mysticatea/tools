import { promises as fs } from "fs"
import path from "path"
import { GitProgram, NpmProgram, cd, rm, sh, stdoutOf } from "./cli-utils"

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
export async function release({
    artifactRootPath = "dist",
    noPublish = false,
}: release.Options = {}) {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const npmLifecycleEvent = process.env.npm_lifecycle_event

    // Ensure this is in the postversion script.
    if (npmLifecycleEvent !== "postversion") {
        console.error('This script must be run in the "postversion" script.')
    }

    // Read version.
    const { version: rawVersion } = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8"),
    )

    // Read origin.
    const originUrl = await stdoutOf(`${GitProgram} remote get-url origin`)
    const originBranch = await stdoutOf(
        `${GitProgram} symbolic-ref --short refs/remotes/origin/HEAD`,
    )
    if (!originUrl) {
        throw new Error('Remote "origin" must be set.')
    }
    if (!originBranch.startsWith("origin/")) {
        throw new Error(
            `Invalid default branch of origin: ${JSON.stringify(originBranch)}`,
        )
    }

    // Read git information.
    const defaultBranch = originBranch.slice("origin/".length)
    const branch = await stdoutOf(`${GitProgram} symbolic-ref --short HEAD`)
    const isDefaultBranch = branch === defaultBranch
    const version = isDefaultBranch ? rawVersion : `${rawVersion}-${branch}`
    const sha1 = await stdoutOf(`${GitProgram} log -1 --format="%h"`)
    const commitMessage = `🔖 ${version} (built with ${sha1})`

    // Push
    await sh(`${GitProgram} push origin "${branch}"`)

    // Delete the tag `npm version` created to use it for the release commit.
    try {
        await sh(`${GitProgram} tag -d "v${rawVersion}"`)
    } catch (ignore) {
        // Ignore
    }

    // Make the release commit that contains only `dist` directory.
    cd(artifactRootPath)
    await sh(`${GitProgram} init`)
    try {
        await sh(`${GitProgram} add .`)
        await sh(`${GitProgram} commit -m "${commitMessage}"`)
        await sh(`${GitProgram} tag "v${version}"`)
        await sh(`${GitProgram} push "${originUrl}" "v${version}"`)
        if (isDefaultBranch && !noPublish) {
            await sh(`${NpmProgram} publish`)
        }
    } finally {
        // Clean
        await rm(".git")
        cd("..")

        // Fetch the new tag.
        await sh(`${GitProgram} fetch --tags`)
    }
}

export namespace release {
    export type Options = {
        artifactRootPath?: string
        noPublish?: boolean
    }
}
