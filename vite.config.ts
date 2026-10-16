import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  let devEnv: Record<string, string> = {};
  try {
    if (fs.existsSync('/app/.dev.env.json')) {
      devEnv = JSON.parse(fs.readFileSync('/app/.dev.env.json', 'utf8'));
    }
  } catch (e) {
    // ignore
  }

  return {
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(
        process.env.NEXT_PUBLIC_SUPABASE_URL || devEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://nzqfceokfhzwlxihvjhr.supabase.co'
      ),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || devEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      ),
      'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(
        process.env.SUPABASE_SERVICE_ROLE_KEY || devEnv.SUPABASE_SERVICE_ROLE_KEY || ''
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
