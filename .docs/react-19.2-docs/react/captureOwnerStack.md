[API Reference](/reference/react)

[APIs](/reference/react/apis)

# captureOwnerStack

`captureOwnerStack` reads the current Owner Stack in development and returns it as a string if available.

```jsx
const stack = captureOwnerStack();
```

- [Reference](#reference)
  - [`captureOwnerStack()`](#captureownerstack)
- [Usage](#usage)
  - [Enhance a custom error overlay](#enhance-a-custom-error-overlay)
- [Troubleshooting](#troubleshooting)
  - [The Owner Stack is `null`](#the-owner-stack-is-null)
  - [`captureOwnerStack` is not available](#captureownerstack-is-not-available)

---

## Reference

### `captureOwnerStack()`

Call `captureOwnerStack` to get the current Owner Stack.

```jsx
import * as React from "react";
function Component() {
  if (process.env.NODE_ENV !== "production") {
    const ownerStack = React.captureOwnerStack();
    console.log(ownerStack);
  }
}
```

#### Parameters

`captureOwnerStack` does not take any parameters.

#### Returns

`captureOwnerStack` returns `string | null`.

Owner Stacks are available in

- Component render
- Effects (e.g. `useEffect`)
- React’s event handlers (e.g. `<button onClick={...} />`)
- React error handlers ([React Root options](/reference/react-dom/client/createRoot#parameters) `onCaughtError`, `onRecoverableError`, and `onUncaughtError`)

If no Owner Stack is available, `null` is returned (see [Troubleshooting: The Owner Stack is `null`](#the-owner-stack-is-null)).

#### Caveats

- Owner Stacks are only available in development. `captureOwnerStack` will always return `null` outside of development.

##### Deep Dive

#### Owner Stack vs Component Stack

Show Details

The Owner Stack is different from the Component Stack available in React error handlers like [`errorInfo.componentStack` in `onUncaughtError`](/reference/react-dom/client/hydrateRoot#error-logging-in-production).

For example, consider the following code:

index.jsApp.js

index.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { captureOwnerStack } from "react";
import { createRoot } from "react-dom/client";
import App, { Component } from "./App.js";
import "./styles.css";
createRoot(document.createElement("div"), {
  onUncaughtError: (error, errorInfo) => {
    // The stacks are logged instead of showing them in the UI directly to
    // highlight that browsers will apply sourcemaps to the logged stacks.
    // Note that sourcemapping is only applied in the real browser console not
    // in the fake one displayed on this page.
    // Press "fork" to be able to view the sourcemapped stack in a real console.
    console.log(errorInfo.componentStack);
    console.log(captureOwnerStack());
  },
}).render(
  <App>
    <Component label="disabled" />
  </App>,
);
```

Show more

`SubComponent` would throw an error.
The Component Stack of that error would be

```jsx
at SubComponent
at fieldset
at Component
at main
at React.Suspense
at App
```

However, the Owner Stack would only read

```jsx
at Component
```

Neither `App` nor the DOM components (e.g. `fieldset`) are considered Owners in this Stack since they didn’t contribute to “creating” the node containing `SubComponent`. `App` and DOM components only forwarded the node. `App` just rendered the `children` node as opposed to `Component` which created a node containing `SubComponent` via `<SubComponent />`.

Neither `Navigation` nor `legend` are in the stack at all since it’s only a sibling to a node containing `<SubComponent />`.

`SubComponent` is omitted because it’s already part of the callstack.

## Usage

### Enhance a custom error overlay

```jsx
import { captureOwnerStack } from "react";
import { instrumentedConsoleError } from "./errorOverlay";
const originalConsoleError = console.error;
console.error = function patchedConsoleError(...args) {
  originalConsoleError.apply(console, args);
  const ownerStack = captureOwnerStack();
  onConsoleError({
    // Keep in mind that in a real application, console.error can be
    // called with multiple arguments which you should account for.
    consoleMessage: args[0],
    ownerStack,
  });
};
```

If you intercept `console.error` calls to highlight them in an error overlay, you can call `captureOwnerStack` to include the Owner Stack.

index.jserrorOverlay.jsApp.js

index.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { captureOwnerStack } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { onConsoleError } from "./errorOverlay";
import "./styles.css";
const originalConsoleError = console.error;
console.error = function patchedConsoleError(...args) {
  originalConsoleError.apply(console, args);
  const ownerStack = captureOwnerStack();
  onConsoleError({
    // Keep in mind that in a real application, console.error can be
    // called with multiple arguments which you should account for.
    consoleMessage: args[0],
    ownerStack,
  });
};
const container = document.getElementById("root");
createRoot(container).render(<App />);
```

Show more

## Troubleshooting

### The Owner Stack is `null`

The call of `captureOwnerStack` happened outside of a React controlled function e.g. in a `setTimeout` callback, after a `fetch` call or in a custom DOM event handler. During render, Effects, React event handlers, and React error handlers (e.g. `hydrateRoot#options.onCaughtError`) Owner Stacks should be available.

In the example below, clicking the button will log an empty Owner Stack because `captureOwnerStack` was called during a custom DOM event handler. The Owner Stack must be captured earlier e.g. by moving the call of `captureOwnerStack` into the Effect body.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { captureOwnerStack, useEffect } from "react";
export default function App() {
  useEffect(() => {
    // Should call `captureOwnerStack` here.
    function handleEvent() {
      // Calling it in a custom DOM event handler is too late.
      // The Owner Stack will be `null` at this point.
      console.log("Owner Stack: ", captureOwnerStack());
    }
    document.addEventListener("click", handleEvent);
    return () => {
      document.removeEventListener("click", handleEvent);
    };
  });
  return (
    <button>
      Click me to see that Owner Stacks are not available in custom DOM event
      handlers
    </button>
  );
}
```

Show more

### `captureOwnerStack` is not available

`captureOwnerStack` is only exported in development builds. It will be `undefined` in production builds. If `captureOwnerStack` is used in files that are bundled for production and development, you should conditionally access it from a namespace import.

```jsx
// Don't use named imports of `captureOwnerStack` in files that are bundled for development and production.
import { captureOwnerStack } from "react";
// Use a namespace import instead and access `captureOwnerStack` conditionally.
import * as React from "react";
if (process.env.NODE_ENV !== "production") {
  const ownerStack = React.captureOwnerStack();
  console.log("Owner Stack", ownerStack);
}
```

[PreviouscacheSignal](/reference/react/cacheSignal)[NextcreateContext](/reference/react/createContext)
