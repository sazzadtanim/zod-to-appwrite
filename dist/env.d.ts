import { z } from "zod";
declare const ZodEnv: z.ZodObject<{
    endpoint: z.ZodString;
    projectId: z.ZodString;
    key: z.ZodString;
}, "strip", z.ZodTypeAny, {
    key: string;
    endpoint: string;
    projectId: string;
}, {
    key: string;
    endpoint: string;
    projectId: string;
}>;
declare let env: z.infer<typeof ZodEnv>;
export { env };
