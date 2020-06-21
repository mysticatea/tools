#!/usr/bin/env node
import { release } from "../lib/release"

release().catch(error => {
    process.exitCode = 1
    console.error(error.message)
})
