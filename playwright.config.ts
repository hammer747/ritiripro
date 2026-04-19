import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src/test",
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
});
