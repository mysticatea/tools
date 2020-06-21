export declare function quote(s: string): string;
export declare function cd(dirPath: string): void;
export declare function rm(dirPath: string): Promise<void>;
export declare function sh(command: string): Promise<void>;
export declare function stdoutOf(command: string): Promise<string>;
