import { dirname } from "path";
import { createRequire } from "module";
import nextParser from "eslint-config-next/parser.js";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const require = createRequire(import.meta.url);
const { version: nextConfigVersion } = require("eslint-config-next/package.json");

// ESLint 9 needs parser metadata to serialize the cache used by next build.
// This legacy Next.js parser exports only its parsing functions.
const cacheableNextParser = {
  ...nextParser,
  meta: { name: "eslint-config-next/parser", version: nextConfigVersion },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**"] },
  ...compat.extends("next/core-web-vitals").map((config) => {
    if (config.languageOptions?.parser !== nextParser) return config;
    return {
      ...config,
      languageOptions: {
        ...config.languageOptions,
        parser: cacheableNextParser,
      },
    };
  }),
];

export default eslintConfig;
