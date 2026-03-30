import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        process: "readonly",
        console: "readonly",
      },
    },
    rules: {
      curly: ["error", "multi-line", "consistent"],
      "no-empty-function": "error",
      "no-shadow": ["error", { allow: ["err", "resolve", "reject"] }],
      "no-var": "error",
      "prefer-const": "error",
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1, maxBOF: 0 }],
      "no-trailing-spaces": "error",
      semi: ["error", "always"],
    },
  },
];
