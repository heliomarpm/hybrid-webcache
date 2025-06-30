import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom", // Use jsdom for browser-like tests
		//reporters: ["verbose"], // Use verbose reporter for detailed output
		coverage: {
			reporter: ["text", "text-summary", "lcov", "json-summary", "json", "html"],
			reportsDirectory: "./coverage",
			include: ["src"],
			exclude: ["src/**/*.d.ts", "src/core/models/**"],
		},
	},
});
