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
 * Extracts and decodes the JWT role payload to safeguard against using an 'anon' key
 * where an elevated 'service_role' secret is required.
 */
function parseJwtRole(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    return json.role || null;
  } catch {
    return null;
  }
}

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

  const detectedRole = parseJwtRole(serviceRoleKey.trim());
  if (detectedRole === 'anon') {
    console.error(
      '🚨 [CivicPulse Security Alert]: SUPABASE_SERVICE_ROLE_KEY is set to an ANON key instead of the secret SERVICE_ROLE key!\n' +
      'Administrative database writes and storage uploads will fail or hit Postgres Row Level Security (RLS) policies.\n' +
      'Please copy the secret "service_role" key from Supabase Dashboard -> Project Settings -> API and update SUPABASE_SERVICE_ROLE_KEY in your hosting environment variables (e.g. Render).'
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

