#!/usr/bin/env node
import { bumpVersion } from "../lib/bump-version"

bumpVersion().catch(error => {
    process.exitCode = 1
    console.error(error.message)
})
