<<<<<<< HEAD
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// LocalStorage keys for optional user-provided Supabase connection
export const SUPABASE_STORAGE_KEYS = {
  URL: 'bitopi_supabase_url',
  ANON_KEY: 'bitopi_supabase_anon_key',
};

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  let storedUrl = '';
  let storedKey = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    storedUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '';
    storedKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.ANON_KEY) || '';
  }

  const envUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL)) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    '';

  const envKey =
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    '';

  const finalUrl = (storedUrl || envUrl || '').trim();
  const finalKey = (storedKey || envKey || '').trim();

  return {
    url: finalUrl,
    anonKey: finalKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url.trim()) {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
    } else {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
    }

    if (anonKey.trim()) {
      localStorage.setItem(SUPABASE_STORAGE_KEYS.ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.ANON_KEY);
    }
  }
}

const { url: initialUrl, anonKey: initialKey } = getStoredSupabaseConfig();

export const isSupabaseConfigured = Boolean(
  initialUrl &&
    initialKey &&
    initialUrl.startsWith('https://') &&
    initialKey.length > 20 &&
    initialUrl !== 'https://nzqfceokfhzwlxihvjhr.supabase.co'
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(initialUrl, initialKey, {
=======
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
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

<<<<<<< HEAD
export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{
=======
export async function testSupabaseConnection(): Promise<{
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
  connected: boolean;
  url: string;
  projectId: string;
  error?: string;
<<<<<<< HEAD
  tablesFound?: string[];
}> {
  const targetUrl = (testUrl || initialUrl || '').trim();
  const targetKey = (testKey || initialKey || '').trim();
  const projectId = targetUrl.replace('https://', '').split('.')[0] || '';

  if (!targetUrl || !targetKey) {
    return {
      connected: false,
      url: targetUrl,
      projectId,
      error: 'Supabase URL and Anon Key are missing.',
=======
}> {
  const projectId = supabaseUrl.replace('https://', '').split('.')[0] || '';
  if (!supabase) {
    return {
      connected: false,
      url: supabaseUrl,
      projectId,
      error: 'Supabase credentials not configured',
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
    };
  }

  try {
<<<<<<< HEAD
    const client = createClient(targetUrl, targetKey);
    const { data, error } = await client.from('kpis').select('id').limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          connected: true,
          url: targetUrl,
          projectId,
          error: "Connected to Supabase, but tables are not yet created! Please execute the SQL tables query.",
        };
      }
      return {
        connected: false,
        url: targetUrl,
        projectId,
        error: `Supabase Error (${error.code || 'API'}): ${error.message}`,
      };
    }

    return {
      connected: true,
      url: targetUrl,
      projectId,
      tablesFound: ['kpis', 'departments'],
    };
  } catch (err: any) {
    return {
      connected: false,
      url: targetUrl,
=======
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
>>>>>>> 7ad21e9e5364190a0bafcdbe5ade16a66209227d
      projectId,
      error: err.message || 'Network error reaching Supabase',
    };
  }
}
