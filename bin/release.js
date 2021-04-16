#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const release_1 = require("../lib/release");
release_1.release().catch(error => {
    process.exitCode = 1;
    console.error(error.message);
});
//# sourceMappingURL=release.js.map