import { defineConfig } from '@playwright/test'

// Port mirrors vite.config.ts's server.port — keep these in sync.
const PORT = 5176
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
  },
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
  },
})
