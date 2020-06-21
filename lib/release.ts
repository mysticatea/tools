import { promises as fs } from "fs"
import path from "path"
import { cd, quote, rm, sh, stdoutOf } from "./util"

export async function release() {
    const packageJsonPath = path.join(process.cwd(), "package.json")
    const npmPath = wrapNode(quote(process.env.npm_execpath || "npm"))
    const gitPath = quote(process.env.npm_config_git || "git")
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
    const originUrl = await stdoutOf(`${gitPath} remote get-url origin`)
    const originBranch = await stdoutOf(
        `${gitPath} symbolic-ref --short refs/remotes/origin/HEAD`,
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
    const branch = await stdoutOf(`${gitPath} symbolic-ref --short HEAD`)
    const isDefaultBranch = branch === defaultBranch
    const version = isDefaultBranch ? rawVersion : `${rawVersion}-${branch}`
    const sha1 = await stdoutOf(`${gitPath} log -1 --format="%h"`)
    const commitMessage = `🔖 ${version} (built with ${sha1})`

    // Push
    await sh(`${gitPath} push`)

    // Delete the tag `npm version` created to use it for the release commit.
    try {
        await sh(`${gitPath} tag -d "v${rawVersion}"`)
    } catch (ignore) {
        // Ignore
    }

    // Make the release commit that contains only `dist` directory.
    cd("dist")
    await sh(`${gitPath} init`)
    try {
        await sh(`${gitPath} add .`)
        await sh(`${gitPath} commit -m "${commitMessage}"`)
        await sh(`${gitPath} tag "v${version}"`)
        await sh(`${gitPath} push "${originUrl}" "v${version}"`)
        if (isDefaultBranch) {
            await sh(`${npmPath} publish`)
        }
    } finally {
        // Clean
        await rm(".git")
        cd("..")

        // Fetch the new tag.
        await sh(`${gitPath} fetch --tags`)
    }
}

function wrapNode(s: string): string {
    if (/\.[cm]?js"?$/u.test(s)) {
        return `${quote(process.execPath)} ${s}`
    }
    return s
}
