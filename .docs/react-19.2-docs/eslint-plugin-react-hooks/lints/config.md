[API Reference](/reference/react)

[Lints](/reference/eslint-plugin-react-hooks)

# config

Validates the compiler [configuration options](/reference/react-compiler/configuration).

## Rule Details

React Compiler accepts various [configuration options](/reference/react-compiler/configuration) to control its behavior. This rule validates that your configuration uses correct option names and value types, preventing silent failures from typos or incorrect settings.

### Invalid

Examples of incorrect code for this rule:

```jsx
// ❌ Unknown option name
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        compileMode: "all", // Typo: should be compilationMode
      },
    ],
  ],
};
// ❌ Invalid option value
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        compilationMode: "everything", // Invalid: use 'all' or 'infer'
      },
    ],
  ],
};
```

### Valid

Examples of correct code for this rule:

```jsx
// ✅ Valid compiler configuration
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        compilationMode: "infer",
        panicThreshold: "critical_errors",
      },
    ],
  ],
};
```

## Troubleshooting

### Configuration not working as expected

Your compiler configuration might have typos or incorrect values:

```jsx
// ❌ Wrong: Common configuration mistakes
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        // Typo in option name
        compilationMod: "all",
        // Wrong value type
        panicThreshold: true,
        // Unknown option
        optimizationLevel: "max",
      },
    ],
  ],
};
```

Check the [configuration documentation](/reference/react-compiler/configuration) for valid options:

```jsx
// ✅ Better: Valid configuration
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        compilationMode: "all", // or 'infer'
        panicThreshold: "none", // or 'critical_errors', 'all_errors'
        // Only use documented options
      },
    ],
  ],
};
```

[Previouscomponent-hook-factories](/reference/eslint-plugin-react-hooks/lints/component-hook-factories)[Nexterror-boundaries](/reference/eslint-plugin-react-hooks/lints/error-boundaries)
