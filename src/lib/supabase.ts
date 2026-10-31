import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes Supabase project URL by removing redundant /rest/v1 path segments
 * or trailing slashes that may be accidentally supplied in environment variables.
 */
function normalizeSupabaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * Validates and retrieves the public Supabase URL.
 */
function getSupabaseUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl || rawUrl.trim() === '') {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Please ensure your environment is configured with a valid Supabase project URL.'
    );
  }
  return normalizeSupabaseUrl(rawUrl);
}

/**
 * Validates and retrieves the public Supabase Anon Key.
 */
function getSupabaseAnonKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey || anonKey.trim() === '') {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please ensure your environment is configured with a valid Supabase anonymous key.'
    );
  }
  return anonKey.trim();
}

/**
 * Singleton Supabase client for client-side reads and Realtime WebSocket subscriptions.
 * Safe to import and use in Browser / React Client Components.
 */
export const supabaseBrowser: SupabaseClient = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey(),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

let cachedServiceAdmin: SupabaseClient | null = null;

/**
 * Administrative Supabase client with elevated Service Role privileges.
 * Strictly checks that execution is occurring within a server-side runtime,
 * validates the service role secret, and disables session persistence.
 */
export function getSupabaseServiceAdmin(): SupabaseClient {
  // Guard against accidental bundling or invocation within browser/client contexts
  if (typeof window !== 'undefined') {
    throw new Error(
      'Security Exception: getSupabaseServiceAdmin() must only be invoked in server-side runtimes (Node.js/Edge). Never expose SUPABASE_SERVICE_ROLE_KEY to the client.'
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.trim() === '') {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Administrative server operations require a valid service role secret.'
    );
  }

  if (!cachedServiceAdmin) {
    const supabaseUrl = getSupabaseUrl();
    cachedServiceAdmin = createClient(supabaseUrl, serviceRoleKey.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedServiceAdmin;
}

