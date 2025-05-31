"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_appwrite_1 = require("node-appwrite");
const zod_1 = require("zod");
const index_js_1 = require("../src/index.js");
const env_js_1 = require("../env.js");
const productSchema = zod_1.z.object({
    name: zod_1.z.string().max(255),
    slug: zod_1.z.string().max(255),
    description: zod_1.z.string().max(10000),
    shortDescription: zod_1.z.string().max(500).optional(),
    price: zod_1.z.number(),
    originalPrice: zod_1.z.number().optional(),
    discount: zod_1.z.number().optional(),
    image: zod_1.z.string().url(),
    images: zod_1.z.array(zod_1.z.string().url()).optional(),
    category: zod_1.z.string().max(255),
    subcategory: zod_1.z.string().max(255).optional(),
    tags: zod_1.z.array(zod_1.z.string().max(50)).optional(),
    brand: zod_1.z.string().max(255).optional(),
    inStock: zod_1.z.boolean(),
    stockQuantity: zod_1.z.number().int().optional(),
    sku: zod_1.z.string().max(100).optional(),
    barcode: zod_1.z.string().max(100).optional(),
    rating: zod_1.z.number(),
    reviews: zod_1.z.number().int(),
    isNew: zod_1.z.boolean().optional(),
    isFeatured: zod_1.z.boolean().optional(),
    isBestSeller: zod_1.z.boolean().optional(),
    metaTitle: zod_1.z.string().max(255).optional(),
    metaDescription: zod_1.z.string().max(500).optional(),
    metaKeywords: zod_1.z.array(zod_1.z.string().max(50)).optional(),
    createdAt: zod_1.z.string().max(100),
    updatedAt: zod_1.z.string().max(100).optional(),
});
const client = new node_appwrite_1.Client()
    .setEndpoint(env_js_1.env.endpoint)
    .setProject(env_js_1.env.projectId)
    .setKey(env_js_1.env.key);
const databases = new node_appwrite_1.Databases(client);
// Create database first
await databases.create("ecommerce", "E-commerce Database");
// Define schemas
const userSchema = zod_1.z.object({
    name: zod_1.z.string().max(100),
    email: zod_1.z.string().email(),
    age: zod_1.z.number().int().min(0).max(150),
    isActive: zod_1.z.boolean().default(true),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    preferences: zod_1.z.object({
        theme: zod_1.z.enum(["light", "dark"]),
        notifications: zod_1.z.boolean(),
    }),
});
// Create single collection
await (0, index_js_1.zodToAppwrite)(userSchema, {
    databases,
    databaseId: "ecommerce",
    collectionId: "users",
    collectionName: "Users",
    permissions: [{ permission: "read", role: "any" }],
    logLevel: "verbose",
});
// Use collection definition
const productCollection = (0, index_js_1.defineCollection)(productSchema, {
    databaseId: "ecommerce",
    collectionId: "products",
    collectionName: "Products",
    permissions: [{ permission: "read", role: "any" }],
    logLevel: "verbose",
});
await productCollection.create(databases);
// Batch creation
await (0, index_js_1.createCollections)(databases, [
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
