import { Client, Databases } from "node-appwrite";
import { z } from "zod";
import { zodToAppwrite, defineCollection, createCollections } from "../src/index.js";
const client = new Client()
    .setEndpoint('https://bangausptyltd.com.au/v1')
    .setProject('proxima')
    .setKey('standard_ef94383ec205c3dec1c33ca0a9642828e1d1b75c3cf3496bfbb8a6b249ef253b10957cafb04938478e54524b672c8d3457f43d507a773f798e0b866ad3adce1ed272b2fae81f6a0e411abb72a7b3087f66b30d90ffc05b4c667441ca828675cb4b51e288d673ab39ac600d7ff513009315a9659a6f11669342f7ecf7c4b7594e');
const databases = new Databases(client);
// Define schemas
const userSchema = z.object({
    name: z.string().max(100),
    email: z.string().email(),
    age: z.number().int().min(0).max(150),
    isActive: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
    preferences: z.object({
        theme: z.enum(["light", "dark"]),
        notifications: z.boolean()
    })
});
const productSchema = z.object({
    title: z.string().max(200),
    price: z.number().min(0),
    inStock: z.boolean()
});
// Create single collection
await zodToAppwrite(userSchema, {
    databases,
    databaseId: 'ecommerce',
    collectionId: 'users',
    collectionName: 'Users',
    permissions: [{ permission: 'read', role: 'any' }],
    logLevel: 'verbose'
});
// Use collection definition
const productCollection = defineCollection(productSchema, {
    databaseId: 'ecommerce',
    collectionId: 'products',
    collectionName: 'Products',
    permissions: [{ permission: 'read', role: 'any' }]
});
await productCollection.create(databases);
// Batch creation
await createCollections(databases, [
    {
        schema: userSchema,
        options: {
            databaseId: 'ecommerce',
            collectionId: 'users',
            collectionName: 'Users'
        }
    },
    {
        schema: productSchema,
        options: {
            databaseId: 'ecommerce',
            collectionId: 'products',
            collectionName: 'Products'
        }
    }
]);
