import { createClient } from '@supabase/supabase-js';

// Read from import.meta.env or process.env
const supabaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)) ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://nzqfceokfhzwlxihvjhr.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && (import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  url: string;
  projectId: string;
  error?: string;
}> {
  const projectId = supabaseUrl.replace('https://', '').split('.')[0] || '';
  if (!supabase) {
    return {
      connected: false,
      url: supabaseUrl,
      projectId,
      error: 'Supabase credentials not configured',
    };
  }

  try {
    // Ping Supabase auth/REST health
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      return {
        connected: true,
        url: supabaseUrl,
        projectId,
      };
    } else {
      return {
        connected: false,
        url: supabaseUrl,
        projectId,
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      url: supabaseUrl,
      projectId,
      error: err.message || 'Network error reaching Supabase',
    };
  }
}
