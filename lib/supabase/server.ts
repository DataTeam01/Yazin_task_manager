import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

export type DbClient = SupabaseClient<Database>;

/**
 * Server-only client using the service-role key (bypasses RLS).
 * Never import this from a Client Component.
 */
export function createClient(): DbClient {
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
