import { Client, Databases } from "node-appwrite";
import { z } from "zod";
import { zodToAppwrite, defineCollection, createCollections, } from "../src/index.js";
import { env } from "../env.js";
const productSchema = z.object({
    name: z.string().max(255),
    slug: z.string().max(255),
    description: z.string().max(10000),
    shortDescription: z.string().max(500).optional(),
    price: z.number(),
    originalPrice: z.number().optional(),
    discount: z.number().optional(),
    image: z.string().url(),
    images: z.array(z.string().url()).optional(),
    category: z.string().max(255),
    subcategory: z.string().max(255).optional(),
    tags: z.array(z.string().max(50)).optional(),
    brand: z.string().max(255).optional(),
    inStock: z.boolean(),
    stockQuantity: z.number().int().optional(),
    sku: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    rating: z.number(),
    reviews: z.number().int(),
    isNew: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(500).optional(),
    metaKeywords: z.array(z.string().max(50)).optional(),
    createdAt: z.string().max(100),
    updatedAt: z.string().max(100).optional(),
});
const client = new Client()
    .setEndpoint(env.endpoint)
    .setProject(env.projectId)
    .setKey(env.key);
const databases = new Databases(client);
// Create database first
await databases.create("ecommerce", "E-commerce Database");
// Define schemas
const userSchema = z.object({
    name: z.string().max(100),
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
    isActive: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
    preferences: z.object({
        theme: z.enum(["light", "dark"]),
        notifications: z.boolean(),
    }),
});
// Create single collection
await zodToAppwrite(userSchema, {
    databases,
    databaseId: "ecommerce",
    collectionId: "users",
    collectionName: "Users",
    permissions: [{ permission: "read", role: "any" }],
    logLevel: "verbose",
});
// Use collection definition
const productCollection = defineCollection(productSchema, {
    databaseId: "ecommerce",
    collectionId: "products",
    collectionName: "Products",
    permissions: [{ permission: "read", role: "any" }],
    logLevel: "verbose",
});
await productCollection.create(databases);
// Batch creation
await createCollections(databases, [
    {
        schema: userSchema,
        options: {
            databaseId: "ecommerce",
            collectionId: "users",
            collectionName: "Users",
            permissions: [{ permission: "read", role: "any" }],
            logLevel: "verbose",
        },
    },
    {
        schema: productSchema,
        options: {
            databaseId: "ecommerce",
            collectionId: "products",
            collectionName: "Products",
            permissions: [{ permission: "read", role: "any" }],
            logLevel: "verbose",
        },
    },
]);
