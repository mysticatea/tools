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
export declare function release({ artifactRootPath, noPublish, }?: release.Options): Promise<void>;
export declare namespace release {
    type Options = {
        artifactRootPath?: string;
        noPublish?: boolean;
    };
}
