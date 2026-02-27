[API Reference](/reference/react)

# Directives

React Compiler directives are special string literals that control whether specific functions are compiled.

```jsx
function MyComponent() {
  "use memo"; // Opt this component into compilation
  return <div>{/* ... */}</div>;
}
```

- [Overview](#overview)
  - [Available directives](#available-directives)
  - [Quick comparison](#quick-comparison)
- [Usage](#usage)
  - [Function-level directives](#function-level)
  - [Module-level directives](#module-level)
  - [Compilation modes interaction](#compilation-modes)
- [Best practices](#best-practices)
  - [Use directives sparingly](#use-sparingly)
  - [Document directive usage](#document-usage)
  - [Plan for removal](#plan-removal)
- [Common patterns](#common-patterns)
  - [Gradual adoption](#gradual-adoption)
- [Troubleshooting](#troubleshooting)
  - [Common issues](#common-issues)
- [See also](#see-also)

---

## Overview

React Compiler directives provide fine-grained control over which functions are optimized by the compiler. They are string literals placed at the beginning of a function body or at the top of a module.

### Available directives

- **[`"use memo"`](/reference/react-compiler/directives/use-memo)** - Opts a function into compilation
- **[`"use no memo"`](/reference/react-compiler/directives/use-no-memo)** - Opts a function out of compilation

### Quick comparison

| Directive                                                           | Purpose             | When to use                                                         |
| ------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| [`"use memo"`](/reference/react-compiler/directives/use-memo)       | Force compilation   | When using `annotation` mode or to override `infer` mode heuristics |
| [`"use no memo"`](/reference/react-compiler/directives/use-no-memo) | Prevent compilation | Debugging issues or working with incompatible code                  |

---

## Usage

### Function-level directives

Place directives at the beginning of a function to control its compilation:

```jsx
// Opt into compilation
function OptimizedComponent() {
  "use memo";
  return <div>This will be optimized</div>;
}
// Opt out of compilation
function UnoptimizedComponent() {
  "use no memo";
  return <div>This won't be optimized</div>;
}
```

### Module-level directives

Place directives at the top of a file to affect all functions in that module:

```jsx
// At the very top of the file
"use memo";
// All functions in this file will be compiled
function Component1() {
  return <div>Compiled</div>;
}
function Component2() {
  return <div>Also compiled</div>;
}
// Can be overridden at function level
function Component3() {
  "use no memo"; // This overrides the module directive
  return <div>Not compiled</div>;
}
```

### Compilation modes interaction

Directives behave differently depending on your [`compilationMode`](/reference/react-compiler/compilationMode):

- **`annotation` mode**: Only functions with `"use memo"` are compiled
- **`infer` mode**: Compiler decides what to compile, directives override decisions
- **`all` mode**: Everything is compiled, `"use no memo"` can exclude specific functions

---

## Best practices

### Use directives sparingly

Directives are escape hatches. Prefer configuring the compiler at the project level:

```jsx
// ✅ Good - project-wide configuration
{
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        compilationMode: "infer",
      },
    ],
  ];
}
// ⚠️ Use directives only when needed
function SpecialCase() {
  "use no memo"; // Document why this is needed
  // ...
}
```

### Document directive usage

Always explain why a directive is used:

```jsx
// ✅ Good - clear explanation
function DataGrid() {
  "use no memo"; // TODO: Remove after fixing issue with dynamic row heights (JIRA-123)
  // Complex grid implementation
}
// ❌ Bad - no explanation
function Mystery() {
  "use no memo";
  // ...
}
```

### Plan for removal

Opt-out directives should be temporary:

1. Add the directive with a TODO comment
2. Create a tracking issue
3. Fix the underlying problem
4. Remove the directive

```jsx
function TemporaryWorkaround() {
  "use no memo"; // TODO: Remove after upgrading ThirdPartyLib to v2.0
  return <ThirdPartyComponent />;
}
```

---

## Common patterns

### Gradual adoption

When adopting the React Compiler in a large codebase:

```jsx
// Start with annotation mode
{
  compilationMode: "annotation";
}
// Opt in stable components
function StableComponent() {
  "use memo";
  // Well-tested component
}
// Later, switch to infer mode and opt out problematic ones
function ProblematicComponent() {
  "use no memo"; // Fix issues before removing
  // ...
}
```

---

## Troubleshooting

For specific issues with directives, see the troubleshooting sections in:

- [`"use memo"` troubleshooting](/reference/react-compiler/directives/use-memo#troubleshooting)
- [`"use no memo"` troubleshooting](/reference/react-compiler/directives/use-no-memo#troubleshooting)

### Common issues

1. **Directive ignored**: Check placement (must be first) and spelling
2. **Compilation still happens**: Check `ignoreUseNoForget` setting
3. **Module directive not working**: Ensure it’s before all imports

---

## See also

- [`compilationMode`](/reference/react-compiler/compilationMode) - Configure how the compiler chooses what to optimize
- [`Configuration`](/reference/react-compiler/configuration) - Full compiler configuration options
- [React Compiler documentation](https://react.dev/learn/react-compiler) - Getting started guide

[Previoustarget](/reference/react-compiler/target)[Next"use memo"](/reference/react-compiler/directives/use-memo)
