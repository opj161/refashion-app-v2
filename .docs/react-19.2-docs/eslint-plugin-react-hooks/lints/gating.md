[API Reference](/reference/react)

[Lints](/reference/eslint-plugin-react-hooks)

# gating

Validates configuration of [gating mode](/reference/react-compiler/gating).

## Rule Details

Gating mode lets you gradually adopt React Compiler by marking specific components for optimization. This rule ensures your gating configuration is valid so the compiler knows which components to process.

### Invalid

Examples of incorrect code for this rule:

```jsx
// ❌ Missing required fields
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        gating: {
          importSpecifierName: "__experimental_useCompiler",
          // Missing 'source' field
        },
      },
    ],
  ],
};
// ❌ Invalid gating type
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        gating: "__experimental_useCompiler", // Should be object
      },
    ],
  ],
};
```

### Valid

Examples of correct code for this rule:

```jsx
// ✅ Complete gating configuration
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        gating: {
          importSpecifierName: "isCompilerEnabled", // exported function name
          source: "featureFlags", // module name
        },
      },
    ],
  ],
};
// featureFlags.js
export function isCompilerEnabled() {
  // ...
}
// ✅ No gating (compile everything)
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        // No gating field - compiles all components
      },
    ],
  ],
};
```

[Previouserror-boundaries](/reference/eslint-plugin-react-hooks/lints/error-boundaries)[Nextglobals](/reference/eslint-plugin-react-hooks/lints/globals)
