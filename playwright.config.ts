import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3100",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
  },
  webServer: {
    command: "npm start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    env: { COPTLE_DEV_FIXTURES: "1" },
    timeout: 60_000,
  },
});
