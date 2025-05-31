import { Databases } from "node-appwrite";
import { z, ZodObject } from "zod";
export interface ZodToAppwriteOptions {
    databases: Databases;
    databaseId: string;
    collectionId: string;
    collectionName: string;
    permissions?: (string | {
        permission: string;
        role: string;
    })[];
    logLevel?: "silent" | "info" | "verbose";
    enumSizeLimit?: number;
    stringDefaultSize?: number;
    skipExisting?: boolean;
}
type AttributeCreationResult = {
    created: string[];
    skipped: string[];
    failed: {
        key: string;
        error: string;
    }[];
};
export declare function zodToAppwrite(schema: ZodObject<any>, options: ZodToAppwriteOptions): Promise<AttributeCreationResult>;
export declare function defineCollection<T extends ZodObject<any>>(schema: T, options: Omit<ZodToAppwriteOptions, "databases">): {
    schema: T;
    create: (databases: Databases) => Promise<AttributeCreationResult>;
    infer: z.infer<T>;
};
export declare function validateForAppwrite<T extends ZodObject<any>>(schema: T, data: unknown): z.infer<T>;
export declare function createCollections(databases: Databases, collections: Array<{
    schema: ZodObject<any>;
    options: Omit<ZodToAppwriteOptions, "databases">;
}>): Promise<({
    success: boolean;
    collectionId: string;
    result: AttributeCreationResult;
    error?: undefined;
} | {
    success: boolean;
    collectionId: string;
    error: any;
    result?: undefined;
})[]>;
export {};
