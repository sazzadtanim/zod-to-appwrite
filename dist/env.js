import { z } from "zod";
import { config } from 'dotenv';
config();
const ZodEnv = z.object({
    endpoint: z.string(),
    projectId: z.string(),
    key: z.string()
});
let env;
// Validate environment variables
try {
    env = ZodEnv.parse({
        endpoint: process.env.APPWRITE_ENDPOINT,
        projectId: process.env.APPWRITE_PROJECTID,
        key: process.env.APPWRITE_KEY
    });
}
catch (error) {
    if (error instanceof z.ZodError) {
        console.error('❌ Environment variables validation failed:');
        error.errors.forEach((err) => {
            console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
        console.error('\nPlease check your .env file and ensure all required variables are set:');
        console.error('  APPWRITE_ENDPOINT=your_endpoint');
        console.error('  APPWRITE_PROJECTID=your_project_id');
        console.error('  APPWRITE_KEY=your_api_key');
    }
    else {
        console.error('❌ Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    process.exit(1);
}
export { env };
