import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "python3 scripts/start-test-api.py",
      url: "http://127.0.0.1:8100/health",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npm run start -- --hostname 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100/login",
      env: {
        BACKEND_URL: "http://127.0.0.1:8100",
        APP_ORIGIN: "http://127.0.0.1:3100",
      },
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
