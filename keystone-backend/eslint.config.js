export default [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly",
        console: "readonly",
        // Jest globals for test files
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      }
    },
    rules: {
      // Basic rules
      "no-unused-vars": "warn",
      "no-console": "off", // Allow console statements in backend
      "semi": ["error", "always"],
      "quotes": ["error", "single"],
      "indent": ["error", 2],
      "comma-dangle": ["error", "never"],
      "eol-last": "error",
      "no-trailing-spaces": "error",
      
      // Best practices
      "no-var": "error",
      "prefer-const": "error",
      "no-undef": "error",
      "no-duplicate-imports": "error"
    }
  }
];
