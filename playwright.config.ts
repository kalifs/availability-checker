import { defineConfig, devices } from "@playwright/test";

const BACKEND_PORT = 3101;
const FRONTEND_PORT = 4301;
const DB_PATH = "data/e2e.sqlite";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Each webServer command builds, seeds a fresh e2e-only DB, and starts its app — self-contained for `npm run test:e2e`.
  webServer: [
    {
      command:
        "npm run build --workspace=@monitor/shared && npm run build --workspace=@monitor/worker && npm run build --workspace=@monitor/backend && rm -f data/e2e.sqlite* && node apps/worker/dist/run.js && node apps/backend/dist/server.js",
      url: `http://localhost:${BACKEND_PORT}/health`,
      env: { MONITOR_DB_PATH: DB_PATH, PORT: String(BACKEND_PORT) },
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npm run build --workspace=@monitor/frontend && npm run preview --workspace=@monitor/frontend -- --port ${FRONTEND_PORT} --strictPort`,
      url: `http://localhost:${FRONTEND_PORT}`,
      env: { VITE_API_BASE_URL: `http://localhost:${BACKEND_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
