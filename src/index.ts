import { Databases, Models } from "node-appwrite";
import { z, ZodObject, ZodTypeAny } from "zod";

export interface ZodToAppwriteOptions {
  databases: Databases;
  databaseId: string;
  collectionId: string;
  collectionName: string;
  permissions?: (string | { permission: string; role: string })[];
  logLevel?: "silent" | "info" | "verbose";
  enumSizeLimit?: number;
  stringDefaultSize?: number;
  skipExisting?: boolean;
}

interface ZodFieldInfo {
  type: string;
  isOptional: boolean;
  isNullable: boolean;
  metadata: any;
}

type AttributeCreationResult = {
  created: string[];
  skipped: string[];
  failed: { key: string; error: string }[];
};

type ZodTypeName = ReturnType<ZodTypeAny["_def"]["typeName"]>;

const ZOD_TYPES = {
  STRING: "ZodString",
  NUMBER: "ZodNumber",
  BOOLEAN: "ZodBoolean",
  DATE: "ZodDate",
  ENUM: "ZodEnum",
  NATIVE_ENUM: "ZodNativeEnum",
  LITERAL: "ZodLiteral",
  ARRAY: "ZodArray",
  OBJECT: "ZodObject",
  OPTIONAL: "ZodOptional",
  NULLABLE: "ZodNullable",
  DEFAULT: "ZodDefault",
} as const;

export async function zodToAppwrite(
  schema: ZodObject<any>,
  options: ZodToAppwriteOptions,
): Promise<AttributeCreationResult> {
  const {
    databases,
    databaseId,
    collectionId,
    collectionName,
    permissions = [{ permission: "read", role: "any" }],
    logLevel = "verbose",
    enumSizeLimit = 100,
    stringDefaultSize = 255,
    skipExisting = true,
  } = options;

  // Logging utility
  const log = (message: string, level: "info" | "warn" | "error" = "info") => {
    if (logLevel === "silent") return;
    if (logLevel === "verbose" || level !== "info") {
      console[level](`[zodToAppwrite] ${message}`);
    }
  };

  log(`Starting collection creation for '${collectionName}' with ${Object.keys(schema.shape).length} fields`, "info");

  // Create collection
  try {
    await databases.createCollection(
      databaseId,
      collectionId,
      collectionName,
      permissions?.map(p => typeof p === 'string' ? p : `${p.permission}("${p.role}")`),
    );
    log(`Collection '${collectionName}' created successfully.`);
  } catch (err: any) {
    if (err.message?.includes("already exists")) {
      log(
        `Collection '${collectionName}' already exists, proceeding with attributes.`,
      );
    } else {
      throw new Error(`Failed to create collection: ${err.message}`);
    }
  }

  const shape = schema.shape;
  const results: AttributeCreationResult = {
    created: [],
    skipped: [],
    failed: [],
  };

  // Process each field in the schema
  for (const [key, field] of Object.entries<ZodTypeAny>(shape)) {
    try {
      log(`Processing field '${key}'...`, "info");
      const attributeInfo = analyzeZodField(field);
      const {
        type: baseType,
        isOptional,
        isNullable,
        metadata,
      } = attributeInfo;
      const required = !(isOptional || isNullable);

      // Skip existing attributes if enabled
      if (skipExisting) {
        try {
          await databases.getAttribute(databaseId, collectionId, key);
          log(`Attribute '${key}' already exists, skipping.`);
          results.skipped.push(key);
          continue;
        } catch {
          // Attribute doesn't exist, proceed with creation
        }
      }

      // Create the attribute
      await createAppwriteAttribute(
        databases,
        databaseId,
        collectionId,
        key,
        baseType,
        required,
        metadata,
        { enumSizeLimit, stringDefaultSize, log },
      );

      log(`Created attribute '${key}' (${baseType})`);
      results.created.push(key);
    } catch (err: any) {
      const errorMsg = err.message || "Unknown error";
      log(`Failed to create attribute '${key}': ${errorMsg}`, "error");
      results.failed.push({ key, error: errorMsg });
    }
  }

  // Summary log
  const summary = [
    `Created: ${results.created.length}`,
    `Skipped: ${results.skipped.length}`,
    `Failed: ${results.failed.length}`,
  ].join(", ");

  log(summary);
  return results;
}

function analyzeZodField(field: ZodTypeAny): ZodFieldInfo {
  let currentType: ZodTypeAny = field;
  let isOptional = false;
  let isNullable = false;

  // Unwrap optional, nullable, and default layers
  while (
    [ZOD_TYPES.OPTIONAL, ZOD_TYPES.NULLABLE, ZOD_TYPES.DEFAULT].includes(
      currentType._def.typeName as any,
    )
  ) {
    if (currentType._def.typeName === ZOD_TYPES.OPTIONAL) isOptional = true;
    if (currentType._def.typeName === ZOD_TYPES.NULLABLE) isNullable = true;
    if (currentType._def.typeName === ZOD_TYPES.DEFAULT) isOptional = true;

    currentType = currentType._def.innerType;
  }

  return {
    type: currentType._def.typeName as ZodTypeName,
    isOptional,
    isNullable,
    metadata: currentType._def,
  };
}

async function createAppwriteAttribute(
  databases: Databases,
  databaseId: string,
  collectionId: string,
  key: string,
  baseType: ZodTypeName,
  required: boolean,
  metadata: any,
  options: {
    enumSizeLimit: number;
    stringDefaultSize: number;
    log: (message: string, level?: "info" | "warn" | "error") => void;
  },
) {
  const { enumSizeLimit, stringDefaultSize, log } = options;

  switch (baseType) {
    case ZOD_TYPES.STRING: {
      const checks = metadata.checks || [];
      const isEmail = checks.some((c: any) => c.kind === "email");
      const isUrl = checks.some((c: any) => c.kind === "url");
      const isIp = checks.some((c: any) => c.kind === "ip");

      if (isEmail) {
        await databases.createEmailAttribute(
          databaseId,
          collectionId,
          key,
          required,
        );
      } else if (isUrl) {
        await databases.createUrlAttribute(
          databaseId,
          collectionId,
          key,
          required,
        );
      } else if (isIp) {
        await databases.createIpAttribute(
          databaseId,
          collectionId,
          key,
          required,
        );
      } else {
        const maxCheck = checks.find((c: any) => c.kind === "max");
        const minCheck = checks.find((c: any) => c.kind === "min");
        const size = maxCheck?.value || stringDefaultSize;

        if (minCheck && minCheck.value > size) {
          log(
            `Warning: min length (${minCheck.value}) > max length (${size}) for '${key}'`,
            "warn",
          );
        }

        await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          size,
          required,
        );
      }
      break;
    }

    case ZOD_TYPES.NUMBER: {
      const checks = metadata.checks || [];
      const isInt = checks.some((c: any) => c.kind === "int");
      const minCheck = checks.find((c: any) => c.kind === "min");
      const maxCheck = checks.find((c: any) => c.kind === "max");

      if (isInt) {
        const min = minCheck?.value;
        const max = maxCheck?.value;

        // Check 32-bit integer bounds
        if (
          (min !== undefined && min < -2147483648) ||
          (max !== undefined && max > 2147483647)
        ) {
          log(
            `Integer bounds for '${key}' exceed 32-bit limits, using float`,
            "warn",
          );
          await databases.createFloatAttribute(
            databaseId,
            collectionId,
            key,
            required,
          );
        } else {
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            key,
            required,
          );
        }
      } else {
        await databases.createFloatAttribute(
          databaseId,
          collectionId,
          key,
          required,
        );
      }
      break;
    }

    case ZOD_TYPES.BOOLEAN: {
      await databases.createBooleanAttribute(
        databaseId,
        collectionId,
        key,
        required,
      );
      break;
    }

    case ZOD_TYPES.DATE: {
      await databases.createDatetimeAttribute(
        databaseId,
        collectionId,
        key,
        required,
      );
      break;
    }

    case ZOD_TYPES.ENUM: {
      const values = metadata.values;
      if (values.length > enumSizeLimit) {
        log(
          `Enum '${key}' has ${values.length} values (>${enumSizeLimit}), using string`,
          "warn",
        );
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          stringDefaultSize,
          required,
        );
      } else {
        await databases.createEnumAttribute(
          databaseId,
          collectionId,
          key,
          values,
          required,
        );
      }
      break;
    }

    case ZOD_TYPES.NATIVE_ENUM: {
      const enumObj = metadata.values;
      const values = Object.values(enumObj).filter(
        (v) => typeof v === "string",
      ) as string[];

      if (values.length === 0) {
        log(`Native enum '${key}' has no string values, using string`, "warn");
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          stringDefaultSize,
          required,
        );
      } else if (values.length > enumSizeLimit) {
        log(
          `Native enum '${key}' has ${values.length} values (>${enumSizeLimit}), using string`,
          "warn",
        );
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          stringDefaultSize,
          required,
        );
      } else {
        await databases.createEnumAttribute(
          databaseId,
          collectionId,
          key,
          values,
          required,
        );
      }
      break;
    }

    case ZOD_TYPES.LITERAL: {
      const value = metadata.value;

      switch (typeof value) {
        case "string":
          await databases.createEnumAttribute(
            databaseId,
            collectionId,
            key,
            [value],
            required,
          );
          break;
        case "number":
          if (Number.isInteger(value)) {
            await databases.createIntegerAttribute(
              databaseId,
              collectionId,
              key,
              required,
            );
          } else {
            await databases.createFloatAttribute(
              databaseId,
              collectionId,
              key,
              required,
            );
          }
          break;
        case "boolean":
          await databases.createBooleanAttribute(
            databaseId,
            collectionId,
            key,
            required,
          );
          break;
        default:
          log(
            `Literal '${key}' has unsupported type ${typeof value}, using string`,
            "warn",
          );
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            key,
            stringDefaultSize,
            required,
          );
      }
      break;
    }

    case ZOD_TYPES.ARRAY: {
      const itemType = metadata.type;
      const itemTypeName = itemType._def.typeName as ZodTypeName;

      if (itemTypeName === ZOD_TYPES.STRING) {
        const checks = itemType._def.checks || [];
        const maxCheck = checks.find((c: any) => c.kind === "max");
        const size = maxCheck?.value || stringDefaultSize;

        await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          size,
          required,
          undefined, // default value (optional)
          true,      // array flag
        );
      } else {
        // For non-string arrays, store as JSON string (not as array)
        log(
          `Array '${key}' contains non-string items, storing as JSON string`,
          "warn",
        );
        await databases.createStringAttribute(
          databaseId,
          collectionId,
          key,
          stringDefaultSize,
          required,
        );
      }
      break;
    }

    // Complex types → Store as JSON
    case "ZodObject":
    case "ZodRecord":
    case "ZodUnion":
    case "ZodIntersection":
    case "ZodTuple":
    case "ZodMap":
    case "ZodSet":
    case "ZodLazy":
    case "ZodFunction":
    case "ZodPromise":
    case "ZodAny":
    case "ZodUnknown": {
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        key,
        stringDefaultSize,
        required,
      );
      break;
    }

    // Skip unsupported types
    case "ZodNull":
    case "ZodUndefined":
    case "ZodVoid":
    case "ZodNever": {
      throw new Error(
        `Unsupported type '${baseType}' cannot be stored in Appwrite`,
      );
    }

    // Fallback to JSON for unknown types
    default: {
      log(`Unknown type '${baseType}' for field '${key}', using string`, "warn");
      await databases.createStringAttribute(
        databaseId,
        collectionId,
        key,
        stringDefaultSize,
        required,
      );
    }
  }
}

// Collection definition utility
export function defineCollection<T extends ZodObject<any>>(
  schema: T,
  options: Omit<ZodToAppwriteOptions, "databases">,
) {
  return {
    schema,
    create: (databases: Databases) =>
      zodToAppwrite(schema, { databases, ...options }),
    infer: {} as z.infer<T>,
  };
}

// Data validation helper
export function validateForAppwrite<T extends ZodObject<any>>(
  schema: T,
  data: unknown,
): z.infer<T> {
  return schema.parse(data);
}

// Batch collection creator
export async function createCollections(
  databases: Databases,
  collections: Array<{
    schema: ZodObject<any>;
    options: Omit<ZodToAppwriteOptions, "databases">;
  }>,
) {
  const results = [];

  for (const { schema, options } of collections) {
    try {
      const result = await zodToAppwrite(schema, { databases, ...options });
      results.push({
        success: true,
        collectionId: options.collectionId,
        result,
      });
    } catch (error: any) {
      results.push({
        success: false,
        collectionId: options.collectionId,
        error: error.message || "Unknown error",
      });
    }
  }

  return results;
}