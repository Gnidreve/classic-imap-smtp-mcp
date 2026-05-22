// Integration-Test-Konfiguration: läuft test/integration/*.int.test.ts gegen lokales Dovecot+Mailpit (docker-compose.test.yml).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.int.test.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
