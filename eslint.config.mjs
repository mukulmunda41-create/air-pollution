import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // R3F's documented pattern: mutate GPU objects in useFrame, and build buffers once in useMemo.
  // These rules are written for DOM components and flag exactly that.
  {
    files: ["src/scene/**"],
    rules: { "react-hooks/immutability": "off", "react-hooks/purity": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".shots/**",
  ]),
]);

export default eslintConfig;
