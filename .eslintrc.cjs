/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  ignorePatterns: ["node_modules", "dist", ".next", "build", "*.cjs", "*.mjs"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-require-imports": "off",
        "padding-line-between-statements": [
          "error",
          { blankLine: "always", prev: "*", next: "return" },
          { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
          { blankLine: "any", prev: ["const", "let", "var"], next: ["const", "let", "var"] },
          { blankLine: "always", prev: "*", next: ["if", "switch", "for", "while", "try", "throw"] },
        ],
      },
    },
  ],
};
