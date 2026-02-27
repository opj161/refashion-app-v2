[API Reference](/reference/react)

# Configuration

This page lists all configuration options available in React Compiler.

### Note

For most apps, the default options should work out of the box. If you have a special need, you can use these advanced options.

```jsx
// babel.config.js
module.exports = {
  plugins: [
    [
      "babel-plugin-react-compiler",
      {
        // compiler options
      },
    ],
  ],
};
```

---

## Compilation Control

These options control _what_ the compiler optimizes and _how_ it selects components and hooks to compile.

- [`compilationMode`](/reference/react-compiler/compilationMode) controls the strategy for selecting functions to compile (e.g., all functions, only annotated ones, or intelligent detection).

```jsx
{
  compilationMode: "annotation"; // Only compile "use memo" functions
}
```

---

## Version Compatibility

React version configuration ensures the compiler generates code compatible with your React version.

[`target`](/reference/react-compiler/target) specifies which React version you’re using (17, 18, or 19).

```jsx
// For React 18 projects
{
  target: "18"; // Also requires react-compiler-runtime package
}
```

---

## Error Handling

These options control how the compiler responds to code that doesn’t follow the [Rules of React](/reference/rules).

[`panicThreshold`](/reference/react-compiler/panicThreshold) determines whether to fail the build or skip problematic components.

```jsx
// Recommended for production
{
  panicThreshold: "none"; // Skip components with errors instead of failing the build
}
```

---

## Debugging

Logging and analysis options help you understand what the compiler is doing.

[`logger`](/reference/react-compiler/logger) provides custom logging for compilation events.

```jsx
{
logger: {
logEvent(filename, event) {
if (event.kind === 'CompileSuccess') {
console.log('Compiled:', filename);
}
}
}
}
```

---

## Feature Flags

Conditional compilation lets you control when optimized code is used.

[`gating`](/reference/react-compiler/gating) enables runtime feature flags for A/B testing or gradual rollouts.

```jsx
{
gating: {
source: 'my-feature-flags',
importSpecifierName: 'isCompilerEnabled'
}
}
```

---

## Common Configuration Patterns

### Default configuration

For most React 19 applications, the compiler works without configuration:

```jsx
// babel.config.js
module.exports = {
  plugins: ["babel-plugin-react-compiler"],
};
```

### React 17/18 projects

Older React versions need the runtime package and target configuration:

```jsx
npm install react-compiler-runtime@latest
```

```jsx
{
  target: "18"; // or '17'
}
```

### Incremental adoption

Start with specific directories and expand gradually:

```jsx
{
  compilationMode: "annotation"; // Only compile "use memo" functions
}
```

[NextcompilationMode](/reference/react-compiler/compilationMode)
