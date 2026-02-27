[API Reference](/reference/react)

[APIs](/reference/react-dom)

# preinit

### Note

[React-based frameworks](/learn/creating-a-react-app) frequently handle resource loading for you, so you might not have to call this API yourself. Consult your framework’s documentation for details.

`preinit` lets you eagerly fetch and evaluate a stylesheet or external script.

```jsx
preinit("https://example.com/script.js", { as: "script" });
```

- [Reference](#reference)
  - [`preinit(href, options)`](#preinit)
- [Usage](#usage)
  - [Preiniting when rendering](#preiniting-when-rendering)
  - [Preiniting in an event handler](#preiniting-in-an-event-handler)

---

## Reference

### `preinit(href, options)`

To preinit a script or stylesheet, call the `preinit` function from `react-dom`.

```jsx
import { preinit } from "react-dom";
function AppRoot() {
  preinit("https://example.com/script.js", { as: "script" });
  // ...
}
```

[See more examples below.](#usage)

The `preinit` function provides the browser with a hint that it should start downloading and executing the given resource, which can save time. Scripts that you `preinit` are executed when they finish downloading. Stylesheets that you preinit are inserted into the document, which causes them to go into effect right away.

#### Parameters

- `href`: a string. The URL of the resource you want to download and execute.
- `options`: an object. It contains the following properties:
  - `as`: a required string. The type of resource. Its possible values are `script` and `style`.
  - `precedence`: a string. Required with stylesheets. Says where to insert the stylesheet relative to others. Stylesheets with higher precedence can override those with lower precedence. The possible values are `reset`, `low`, `medium`, `high`.
  - `crossOrigin`: a string. The [CORS policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) to use. Its possible values are `anonymous` and `use-credentials`.
  - `integrity`: a string. A cryptographic hash of the resource, to [verify its authenticity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity).
  - `nonce`: a string. A cryptographic [nonce to allow the resource](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce) when using a strict Content Security Policy.
  - `fetchPriority`: a string. Suggests a relative priority for fetching the resource. The possible values are `auto` (the default), `high`, and `low`.

#### Returns

`preinit` returns nothing.

#### Caveats

- Multiple calls to `preinit` with the same `href` have the same effect as a single call.
- In the browser, you can call `preinit` in any situation: while rendering a component, in an Effect, in an event handler, and so on.
- In server-side rendering or when rendering Server Components, `preinit` only has an effect if you call it while rendering a component or in an async context originating from rendering a component. Any other calls will be ignored.

---

## Usage

### Preiniting when rendering

Call `preinit` when rendering a component if you know that it or its children will use a specific resource, and you’re OK with the resource being evaluated and thereby taking effect immediately upon being downloaded.

#### Examples of preiniting

1. Preiniting an external script 2. Preiniting a stylesheet

#### Example 1 of 2: Preiniting an external script

```jsx
import { preinit } from 'react-dom';
function AppRoot() {
preinit("https://example.com/script.js", {as: "script"});
return ...;
}
```

If you want the browser to download the script but not to execute it right away, use [`preload`](/reference/react-dom/preload) instead. If you want to load an ESM module, use [`preinitModule`](/reference/react-dom/preinitModule).

Next Example

### Preiniting in an event handler

Call `preinit` in an event handler before transitioning to a page or state where external resources will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

```jsx
import { preinit } from "react-dom";
function CallToAction() {
  const onClick = () => {
    preinit("https://example.com/wizardStyles.css", { as: "style" });
    startWizard();
  };
  return <button onClick={onClick}>Start Wizard</button>;
}
```

[PreviousprefetchDNS](/reference/react-dom/prefetchDNS)[NextpreinitModule](/reference/react-dom/preinitModule)
