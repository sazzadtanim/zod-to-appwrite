"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const ZodEnv = zod_1.z.object({
    endpoint: zod_1.z.string(),
    projectId: zod_1.z.string(),
    key: zod_1.z.string()
});
let env;
// Validate environment variables
try {
    exports.env = env = ZodEnv.parse({
        endpoint: process.env.APPWRITE_ENDPOINT,
        projectId: process.env.APPWRITE_PROJECTID,
        key: process.env.APPWRITE_KEY
    });
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
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
