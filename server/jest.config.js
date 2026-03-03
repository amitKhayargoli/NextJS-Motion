/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  detectOpenHandles: true,

  testMatch: ["**/__tests__/**/*.test.ts"],

  transform: {
    "^.+\\.ts$": "ts-jest",
  },

  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],

  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@generated/prisma/client$": "<rootDir>/src/generated/prisma/client",
  },
};
