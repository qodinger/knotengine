module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  ignorePatterns: ["**/dist/**", "**/node_modules/**", "**/.next/**"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unescaped-entities": "off",
  },
  env: {
    node: true,
    es2020: true,
    serviceworker: true,
  },
  overrides: [
    {
      files: ["**/public/sw.js"],
      globals: {
        self: "readonly",
        caches: "readonly",
        clients: "readonly",
      },
    },
  ],
};
