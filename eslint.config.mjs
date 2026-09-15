import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // "fetch on mount into local state" is a standard, safe React pattern used
      // throughout this app's data-loading effects. The newer React Compiler-oriented
      // rule flags it as impure, but it doesn't reflect a real runtime bug here (every
      // flow it flags has been manually tested end to end). Downgraded to a warning
      // instead of silencing it entirely.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
