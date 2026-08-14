import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/index.ts",
        "src/models/**",
        "src/**/types/**",
        "src/**/models/**",
        "src/app/**",
        "src/config/**",
        "src/handlers/**",
        "src/repositories/implementations/DynamoDbPurchaseRequestRepository.ts",
        "src/services/mail/implementations/DynamoDbMailService.ts",
        "src/services/evidence/implementations/S3EvidenceStorage.ts",
      ],
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
});
