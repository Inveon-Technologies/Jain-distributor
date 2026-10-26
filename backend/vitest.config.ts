import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Integration tests share one database, so run files sequentially.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://jain:jain@localhost:5432/jain_test",
      JWT_SECRET: "test-secret-test-secret-test-secret",
      ADMIN_EMAIL: "admin@jain.com",
      ADMIN_PASSWORD: "admin123",
      STT_PROVIDER: "mock",
    },
  },
});
