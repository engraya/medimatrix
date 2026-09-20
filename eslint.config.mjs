import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", ".npm-cache/**", "test-results/**", "playwright-report/**", "next-env.d.ts"]),
]);
