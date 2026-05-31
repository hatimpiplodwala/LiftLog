import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Pure-function/unit tests run fine in Node. Switch to 'jsdom' (and add
    // @testing-library/react) when we start testing components.
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    // Dummy Supabase creds so `createClient` doesn't throw when a tested module
    // transitively imports src/lib/supabase.ts. No network calls happen here.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      // Fixed tz so local date-key logic (e.g. computeStreak) is deterministic.
      TZ: 'UTC',
    },
  },
})
