// 앱은 HTML 한 파일이라, tools/extract_js.cjs가 스크립트를 .lint/app.js로 모은 뒤 검사한다.
import globals from "globals";
export default [{
  files: [".lint/app.js"],
  languageOptions: { ecmaVersion: 2022, sourceType: "script",
    globals: { ...globals.browser, html2canvas: "readonly", jspdf: "readonly" } },
  rules: {
    "no-undef": "error", "no-unused-vars": ["warn", { args: "none", caughtErrors: "none" }],
    "no-redeclare": "error", "no-dupe-keys": "error", "no-unreachable": "error", "no-self-assign": "error",
    "no-cond-assign": ["error", "except-parens"], "no-fallthrough": "error", "use-isnan": "error",
    "valid-typeof": "error", "no-dupe-else-if": "error", "no-duplicate-case": "error", "no-sparse-arrays": "error",
    "no-loss-of-precision": "error", "no-unsafe-optional-chaining": "error", "no-self-compare": "error",
    "no-unsafe-finally": "error", "no-empty": ["error", { allowEmptyCatch: true }], "no-func-assign": "error",
    "no-global-assign": "error", "no-unsafe-negation": "error", "no-async-promise-executor": "error",
    "no-constant-binary-expression": "error", "no-constant-condition": ["error", { checkLoops: false }],
  }
}];
