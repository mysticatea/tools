#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bump_version_1 = require("../lib/bump-version");
bump_version_1.bumpVersion().catch(error => {
    process.exitCode = 1;
    console.error(error.message);
});
//# sourceMappingURL=bump-version.js.map