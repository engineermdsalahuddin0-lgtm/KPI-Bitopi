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
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{
  connected: boolean;
  url: string;
  projectId: string;
  error?: string;
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
    };
  }

  try {
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
      projectId,
      error: err.message || 'Network error reaching Supabase',
    };
  }
}
