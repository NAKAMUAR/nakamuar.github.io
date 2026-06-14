import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/types";

/**
 * Supabase client for use in Client Components ("use client").
 * Uses only the public anon key. All access is constrained by RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
