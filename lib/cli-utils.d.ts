/**
 * `git` command.
 *
 * This is `process.env.npm_config_git` or `"git"`.
 */
export declare const GitProgram: string;
/**
 * `node` command.
 *
 * This is `process.execPath`.
 */
export declare const NodeProgram: string;
/**
 * `npm` command.
 *
 * This is `process.env.npm_execpath` or `"npm"`.
 */
export declare const NpmProgram: string;
/**
 * Enclose a string with double quotes if the string contains whitespaces.
 * @param s The string to address.
 * @returns Addressed string.
 */
export declare function quote(s: string): string;
/**
 * Prepend `process.execPath` to a string if the string is a path to JavaScript file.
 * @param s The string to address.
 * @returns Addressed string.
 */
export declare function wrapNode(s: string): string;
/**
 * Move the current working directory.
 * @param dirPath The path to move.
 */
export declare function cd(dirPath: string): void;
/**
 * Remove a directory (recursively).
 * @param dirPath The path to a directory to remove.
 */
export declare function rm(dirPath: string): Promise<void>;
/**
 * Execute a command as a child process.
 * @param command The command to execute.
 * @param options Options.
 */
export declare function sh(command: string, { cwd, env, mask }?: sh.Options): Promise<void>;
export declare namespace sh {
    type Options = {
        cwd?: string;
        env?: Record<string, string>;
        mask?: (command: string) => string;
    };
}
/**
 * Execute a command as a child process and return the stdout of that.
 * @param command The command to execute.
 * @param options Options.
 * @returns The stdout of the command.
 */
export declare function stdoutOf(command: string, { cwd, env, mask }?: sh.Options): Promise<string>;
