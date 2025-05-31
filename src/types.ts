import { Databases } from "node-appwrite";
import { ZodObject } from "zod";

export interface ZodToAppwriteOptions {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  collectionName: string;
  permissions?: Array<{
    permission: string;
    role: string;
  }>;
  logLevel?: "silent" | "info" | "verbose";
  enumSizeLimit?: number;
  stringDefaultSize?: number;
  skipExisting?: boolean;
}

export interface AttributeCreationResult {
  created: string[];
  skipped: string[];
  failed: string[];
}

export interface CollectionCreationResult {
  success: boolean;
  collectionId: string;
  result?: AttributeCreationResult;
  error?: string;
}

// Helper type for inferring Zod schema types
export type InferZodSchema<T> = T extends ZodObject<infer U> ? U : never;
