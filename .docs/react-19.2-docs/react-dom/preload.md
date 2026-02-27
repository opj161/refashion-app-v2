[API Reference](/reference/react)

[APIs](/reference/react-dom)

# preload

### Note

[React-based frameworks](/learn/creating-a-react-app) frequently handle resource loading for you, so you might not have to call this API yourself. Consult your framework’s documentation for details.

`preload` lets you eagerly fetch a resource such as a stylesheet, font, or external script that you expect to use.

```jsx
preload("https://example.com/font.woff2", { as: "font" });
```

- [Reference](#reference)
  - [`preload(href, options)`](#preload)
- [Usage](#usage)
  - [Preloading when rendering](#preloading-when-rendering)
  - [Preloading in an event handler](#preloading-in-an-event-handler)

---

## Reference

### `preload(href, options)`

To preload a resource, call the `preload` function from `react-dom`.

```jsx
import { preload } from "react-dom";
function AppRoot() {
  preload("https://example.com/font.woff2", { as: "font" });
  // ...
}
```

[See more examples below.](#usage)

The `preload` function provides the browser with a hint that it should start downloading the given resource, which can save time.

#### Parameters

- `href`: a string. The URL of the resource you want to download.
- `options`: an object. It contains the following properties:
  - `as`: a required string. The type of resource. Its [possible values](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#as) are `audio`, `document`, `embed`, `fetch`, `font`, `image`, `object`, `script`, `style`, `track`, `video`, `worker`.
  - `crossOrigin`: a string. The [CORS policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) to use. Its possible values are `anonymous` and `use-credentials`. It is required when `as` is set to `"fetch"`.
  - `referrerPolicy`: a string. The [Referrer header](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#referrerpolicy) to send when fetching. Its possible values are `no-referrer-when-downgrade` (the default), `no-referrer`, `origin`, `origin-when-cross-origin`, and `unsafe-url`.
  - `integrity`: a string. A cryptographic hash of the resource, to [verify its authenticity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity).
  - `type`: a string. The MIME type of the resource.
  - `nonce`: a string. A cryptographic [nonce to allow the resource](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce) when using a strict Content Security Policy.
  - `fetchPriority`: a string. Suggests a relative priority for fetching the resource. The possible values are `auto` (the default), `high`, and `low`.
  - `imageSrcSet`: a string. For use only with `as: "image"`. Specifies the [source set of the image](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images).
  - `imageSizes`: a string. For use only with `as: "image"`. Specifies the [sizes of the image](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images).

#### Returns

`preload` returns nothing.

#### Caveats

- Multiple equivalent calls to `preload` have the same effect as a single call. Calls to `preload` are considered equivalent according to the following rules:
  - Two calls are equivalent if they have the same `href`, except:
  - If `as` is set to `image`, two calls are equivalent if they have the same `href`, `imageSrcSet`, and `imageSizes`.
- In the browser, you can call `preload` in any situation: while rendering a component, in an Effect, in an event handler, and so on.
- In server-side rendering or when rendering Server Components, `preload` only has an effect if you call it while rendering a component or in an async context originating from rendering a component. Any other calls will be ignored.

---

## Usage

### Preloading when rendering

Call `preload` when rendering a component if you know that it or its children will use a specific resource.

#### Examples of preloading

1. Preloading an external script 2. Preloading a stylesheet 3. Preloading a font 4. Preloading an image

#### Example 1 of 4: Preloading an external script

```jsx
import { preload } from 'react-dom';
function AppRoot() {
preload("https://example.com/script.js", {as: "script"});
return ...;
}
```

If you want the browser to start executing the script immediately (rather than just downloading it), use [`preinit`](/reference/react-dom/preinit) instead. If you want to load an ESM module, use [`preloadModule`](/reference/react-dom/preloadModule).

Next Example

### Preloading in an event handler

Call `preload` in an event handler before transitioning to a page or state where external resources will be needed. This gets the process started earlier than if you call it during the rendering of the new page or state.

```jsx
import { preload } from "react-dom";
function CallToAction() {
  const onClick = () => {
    preload("https://example.com/wizardStyles.css", { as: "style" });
    startWizard();
  };
  return <button onClick={onClick}>Start Wizard</button>;
}
```

[PreviouspreinitModule](/reference/react-dom/preinitModule)[NextpreloadModule](/reference/react-dom/preloadModule)
