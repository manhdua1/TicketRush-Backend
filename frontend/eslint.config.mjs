import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // NOTE: React 19 + current eslint-config-next emits false positives for
  // react-hooks/refs in common patterns (e.g. objects returned from custom hooks).
  // Keep it off until the upstream rule is fixed.
  {
    rules: {
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
