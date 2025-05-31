import { Client, Databases } from "node-appwrite";
import { z } from "zod";
import { zodToAppwrite } from "../src/index.js";

// Load environment variables
const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

// Validate required environment variables
if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  throw new Error(
    "Missing required environment variables. Please set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY in your .env.test file"
  );
}

describe("zodToAppwrite", () => {
  let client: Client;
  let databases: Databases;
  const TEST_DATABASE_ID = "test_db_" + Date.now();

  beforeAll(async () => {
    client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    databases = new Databases(client);

    // Create test database
    try {
      await databases.create(TEST_DATABASE_ID, "Test Database");
      console.info(`created a database named: ${TEST_DATABASE_ID}`);
    } catch (error) {
      console.error("Failed to create test database:", error);
    }
  }, 10000);

  afterAll(async () => {
    // Clean up test database
    try {
      await databases.delete(TEST_DATABASE_ID);
      console.info(`cleaned up database named:${TEST_DATABASE_ID}`);
    } catch (error) {
      console.error("Failed to delete test database:", error);
    }
  });

  // Basic type tests
  describe("Basic Types", () => {
    it("should create collection with basic string fields", async () => {
      const userSchema = z.object({
        name: z.string().max(100),
        email: z.string().email(),
      });

      await zodToAppwrite(userSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "users",
        collectionName: "Users",
      });
    }, 10000);

    it("should handle numeric fields", async () => {
      const productSchema = z.object({
        name: z.string(),
        price: z.number().min(0),
        quantity: z.number().int().positive(),
      });

      await zodToAppwrite(productSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "products",
        collectionName: "Products",
      });
    }, 10000);

    it("should handle boolean fields", async () => {
      const settingsSchema = z.object({
        isActive: z.boolean(),
        notifications: z.boolean().default(true),
      });

      await zodToAppwrite(settingsSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "settings",
        collectionName: "Settings",
      });
    }, 10000);

    it("should handle date fields", async () => {
      const eventSchema = z.object({
        title: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      });

      await zodToAppwrite(eventSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "events",
        collectionName: "Events",
      });
    }, 10000);
  });

  // Complex type tests
  describe("Complex Types", () => {
    it("should handle nested objects", async () => {
      const addressSchema = z.object({
        street: z.string(),
        city: z.string(),
        country: z.string(),
      });

      const userSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        address: addressSchema,
      });

      await zodToAppwrite(userSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "users_nested",
        collectionName: "Users with Address",
      });
    }, 10000);

    it("should handle arrays", async () => {
      const postSchema = z.object({
        title: z.string(),
        tags: z.array(z.string()),
        ratings: z.array(z.number().min(1).max(5)),
      });

      await zodToAppwrite(postSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "posts",
        collectionName: "Posts",
      });
    }, 10000);

    it("should handle optional fields", async () => {
      const profileSchema = z.object({
        name: z.string(),
        bio: z.string().optional(),
        website: z.string().url().optional(),
      });

      await zodToAppwrite(profileSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "profiles",
        collectionName: "Profiles",
      });
    }, 10000);

    it("should handle default values", async () => {
      const configSchema = z.object({
        theme: z.enum(["light", "dark"]).default("light"),
        language: z.string().default("en"),
      });

      await zodToAppwrite(configSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "configs",
        collectionName: "Configs",
      });
    }, 10000);
  });

  // Edge cases
  describe("Edge Cases", () => {
    it("should handle long strings", async () => {
      const longTextSchema = z.object({
        title: z.string().max(1000),
        description: z.string().max(10000),
      });

      await zodToAppwrite(longTextSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "long_text",
        collectionName: "Long Text",
      });
    }, 10000);

    it("should handle special characters", async () => {
      const specialCharsSchema = z.object({
        name: z.string().regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/),
        description: z.string(),
      });

      await zodToAppwrite(specialCharsSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "special_chars",
        collectionName: "Special Characters",
      });
    }, 10000);

    it("should handle complex nested arrays", async () => {
      const complexSchema = z.object({
        name: z.string(),
        matrix: z.array(z.array(z.number())),
        nestedObjects: z.array(z.object({
          id: z.number(),
          data: z.array(z.string())
        }))
      });

      await zodToAppwrite(complexSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "complex_nested",
        collectionName: "Complex Nested",
      });
    }, 10000);
  });

  // Error cases
  describe("Error Cases", () => {
    it("should handle invalid schema gracefully", async () => {
      const invalidSchema = z.object({
        name: z.any(), // Appwrite does not support 'any' type
        email: z.string(),
      });

      const result = await zodToAppwrite(invalidSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "invalid_schema",
        collectionName: "Invalid Schema"
      });
      expect(result.failed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "name" })
        ])
      );
    });

    it("should handle missing required fields", async () => {
      const requiredSchema = z.object({
        name: z.string(),
        email: z.string().email(),
      }).strict();

      await expect(zodToAppwrite(requiredSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "required_fields",
        collectionName: "Required Fields",
      })).resolves.not.toThrow();
    }, 10000);

    it("should handle invalid collection ID", async () => {
      const validSchema = z.object({
        name: z.string(),
      });

      await expect(zodToAppwrite(validSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "invalid/id", // Invalid: contains forward slash
        collectionName: "Invalid ID",
      })).rejects.toThrow();
    }, 10000);
  });

  // Complex validation tests
  describe("Complex Validations", () => {
    it("should handle custom validations", async () => {
      const customSchema = z.object({
        password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/),
        age: z.number().int().min(0).max(150),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
      });

      await zodToAppwrite(customSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "custom_validation",
        collectionName: "Custom Validation",
      });
    }, 10000);

    it("should handle conditional fields", async () => {
      const baseSchema = z.object({
        type: z.enum(["individual", "company"]),
        name: z.string(),
        companyName: z.string().optional(),
        taxId: z.string().optional(),
      });

      const conditionalSchema = baseSchema.superRefine((data, ctx) => {
        if (data.type === "company") {
          if (!data.companyName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Company name is required for company type",
              path: ["companyName"],
            });
          }
          if (!data.taxId) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Tax ID is required for company type",
              path: ["taxId"],
            });
          }
        }
      });

      await zodToAppwrite(baseSchema, {
        databases,
        databaseId: TEST_DATABASE_ID,
        collectionId: "conditional_fields",
        collectionName: "Conditional Fields",
      });
    }, 10000);
  });
});
