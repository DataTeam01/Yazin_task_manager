import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine((u) => !/\/(rest|auth)\/v1/.test(u), "Use the bare project URL, without /rest/v1"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export const env = schema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});
