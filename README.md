# 🧩 Zod to Appwrite

Generate Appwrite database collections directly from Zod schemas. This library provides a type-safe way to create and manage Appwrite collections using Zod's powerful schema validation.

## Features

- 🚀 Type-safe collection creation
- 🔄 Automatic attribute type mapping
- 🛡️ Built-in validation using Zod schemas
- 📝 Support for complex nested objects and arrays
- 🔒 Flexible permission management
- 🎯 Multiple collection creation patterns

## Installation

```bash
npm install zod-to-appwrite
# or
yarn add zod-to-appwrite
# or
pnpm add zod-to-appwrite
```

## Quick Start

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

## Type Mapping

The library automatically maps Zod types to Appwrite attribute types:

| Zod Type | Appwrite Attribute Type |
|----------|------------------------|
| `z.string()` | `string` |
| `z.number()` | `number` |
| `z.boolean()` | `boolean` |
| `z.date()` | `datetime` |
| `z.array()` | `string[]` |
| `z.enum()` | `string` |
| `z.object()` | `string` (JSON) |

## API Reference

### `zodToAppwrite(schema, options)`

Creates an Appwrite collection directly from a Zod schema.

#### Parameters

- `schema`: Zod schema object
- `options`: Configuration object
  - `databases`: Appwrite Databases instance
  - `databaseId`: ID of the target database
  - `collectionId`: ID for the new collection
  - `collectionName`: Display name for the collection
  - `permissions`: Array of permission objects (optional)

### `defineCollection(schema, options)`

Returns a function that creates an Appwrite collection when called with a Databases instance.

#### Parameters

- `schema`: Zod schema object
- `options`: Configuration object
  - `databaseId`: ID of the target database
  - `collectionId`: ID for the new collection
  - `collectionName`: Display name for the collection
  - `permissions`: Array of permission objects (optional)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [SazzadTanim]
