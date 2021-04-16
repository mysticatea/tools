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
export declare function bumpVersion(): Promise<void>;
