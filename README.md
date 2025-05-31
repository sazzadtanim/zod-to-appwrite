# 🧩 Zod to Appwrite

Generate Appwrite database collections directly from Zod schemas.

## Installation

```bash
npm install zod-to-appwrite
```

Usage:
```ts
import { Client, Databases } from "node-appwrite";
import { z } from "zod";
import { zodToAppwrite, defineCollection } from "zod-to-appwrite";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('<PROJECT_ID>')
  .setKey('<API_KEY>');

const databases = new Databases(client);

// Define your Zod schema
const userSchema = z.object({
  name: z.string().max(100),
  email: z.string().email(),
  age: z.number().int().optional(),
  tags: z.array(z.string()),
  preferences: z.object({
    theme: z.enum(["light", "dark"]),
    notifications: z.boolean()
  }),
  createdAt: z.date(),
  status: z.enum(["active", "pending", "banned"])
});

// Create collection directly
await zodToAppwrite(userSchema, {
  databases,
  databaseId: 'my-database',
  collectionId: 'users',
  collectionName: 'User Profiles',
  permissions: [
    { permission: "read", role: "any" },
    { permission: "create", role: "users" }
  ]
});

// Or use collection definition pattern
const userCollection = defineCollection(userSchema, {
  databaseId: 'my-database',
  collectionId: 'users',
  collectionName: 'User Profiles'
});

await userCollection(databases);
```
