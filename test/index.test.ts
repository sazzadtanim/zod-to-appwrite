import { Client, Databases } from "node-appwrite";
import { z } from "zod";
import { zodToAppwrite, defineCollection } from "../dist";

describe("zodToAppwrite", () => {
  it("should create collection from schema", async () => {
    const client = new Client()
      .setEndpoint("https://cloud.appwrite.io/v1")
      .setProject("test")
      .setKey("test");

    const databases = new Databases(client);

    const userSchema = z.object({
      name: z.string().max(100),
      email: z.string().email(),
    });

    await zodToAppwrite(userSchema, {
      databases,
      databaseId: "test",
      collectionId: "users",
      collectionName: "Users",
    });
  });
});
