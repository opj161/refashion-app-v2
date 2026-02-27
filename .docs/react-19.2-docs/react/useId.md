[API Reference](/reference/react)

[Hooks](/reference/react/hooks)

# useId

`useId` is a React Hook for generating unique IDs that can be passed to accessibility attributes.

```jsx
const id = useId();
```

- [Reference](#reference)
  - [`useId()`](#useid)
- [Usage](#usage)
  - [Generating unique IDs for accessibility attributes](#generating-unique-ids-for-accessibility-attributes)
  - [Generating IDs for several related elements](#generating-ids-for-several-related-elements)
  - [Specifying a shared prefix for all generated IDs](#specifying-a-shared-prefix-for-all-generated-ids)
  - [Using the same ID prefix on the client and the server](#using-the-same-id-prefix-on-the-client-and-the-server)

---

## Reference

### `useId()`

Call `useId` at the top level of your component to generate a unique ID:

```jsx
import { useId } from 'react';
function PasswordField() {
const passwordHintId = useId();
// ...
```

[See more examples below.](#usage)

#### Parameters

`useId` does not take any parameters.

#### Returns

`useId` returns a unique ID string associated with this particular `useId` call in this particular component.

#### Caveats

- `useId` is a Hook, so you can only call it **at the top level of your component** or your own Hooks. You can’t call it inside loops or conditions. If you need that, extract a new component and move the state into it.
- `useId` **should not be used to generate cache keys** for [use()](/reference/react/use). The ID is stable when a component is mounted but may change during rendering. Cache keys should be generated from your data.
- `useId` **should not be used to generate keys** in a list. [Keys should be generated from your data.](/learn/rendering-lists#where-to-get-your-key)
- `useId` currently cannot be used in [async Server Components](/reference/rsc/server-components#async-components-with-server-components).

---

## Usage

### Pitfall

**Do not call `useId` to generate keys in a list.** [Keys should be generated from your data.](/learn/rendering-lists#where-to-get-your-key)

### Generating unique IDs for accessibility attributes

Call `useId` at the top level of your component to generate a unique ID:

```jsx
import { useId } from 'react';
function PasswordField() {
const passwordHintId = useId();
// ...
```

You can then pass the generated ID to different attributes:

```jsx
<>
<input type="password" aria-describedby={passwordHintId} />
<p id={passwordHintId}>
</>
```

**Let’s walk through an example to see when this is useful.**

[HTML accessibility attributes](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) like [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby) let you specify that two tags are related to each other. For example, you can specify that an element (like an input) is described by another element (like a paragraph).

In regular HTML, you would write it like this:

```jsx
<label>
Password:
<input
type="password"
aria-describedby="password-hint"
/>
</label>
<p id="password-hint">
The password should contain at least 18 characters
</p>
```

However, hardcoding IDs like this is not a good practice in React. A component may be rendered more than once on the page—but IDs have to be unique! Instead of hardcoding an ID, generate a unique ID with `useId`:

```jsx
import { useId } from "react";
function PasswordField() {
  const passwordHintId = useId();
  return (
    <>
      <label>
        Password:
        <input type="password" aria-describedby={passwordHintId} />
      </label>
      <p id={passwordHintId}>
        The password should contain at least 18 characters
      </p>
    </>
  );
}
```

Now, even if `PasswordField` appears multiple times on the screen, the generated IDs won’t clash.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useId } from "react";
function PasswordField() {
  const passwordHintId = useId();
  return (
    <>
      <label>
        Password:
        <input type="password" aria-describedby={passwordHintId} />
      </label>
      <p id={passwordHintId}>
        The password should contain at least 18 characters
      </p>
    </>
  );
}
export default function App() {
  return (
    <>
      <h2>Choose password</h2>
      <PasswordField />
      <h2>Confirm password</h2>
      <PasswordField />
    </>
  );
}
```

Show more

[Watch this video](https://www.youtube.com/watch?v=0dNzNcuEuOo) to see the difference in the user experience with assistive technologies.

### Pitfall

With [server rendering](/reference/react-dom/server), **`useId` requires an identical component tree on the server and the client**. If the trees you render on the server and the client don’t match exactly, the generated IDs won’t match.

##### Deep Dive

#### Why is useId better than an incrementing counter?

Show Details

You might be wondering why `useId` is better than incrementing a global variable like `nextId++`.

The primary benefit of `useId` is that React ensures that it works with [server rendering.](/reference/react-dom/server) During server rendering, your components generate HTML output. Later, on the client, [hydration](/reference/react-dom/client/hydrateRoot) attaches your event handlers to the generated HTML. For hydration to work, the client output must match the server HTML.

This is very difficult to guarantee with an incrementing counter because the order in which the Client Components are hydrated may not match the order in which the server HTML was emitted. By calling `useId`, you ensure that hydration will work, and the output will match between the server and the client.

Inside React, `useId` is generated from the “parent path” of the calling component. This is why, if the client and the server tree are the same, the “parent path” will match up regardless of rendering order.

---

### Generating IDs for several related elements

If you need to give IDs to multiple related elements, you can call `useId` to generate a shared prefix for them:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useId } from "react";
export default function Form() {
  const id = useId();
  return (
    <form>
      <label htmlFor={id + "-firstName"}>First Name:</label>
      <input id={id + "-firstName"} type="text" />
      <hr />
      <label htmlFor={id + "-lastName"}>Last Name:</label>
      <input id={id + "-lastName"} type="text" />
    </form>
  );
}
```

This lets you avoid calling `useId` for every single element that needs a unique ID.

---

### Specifying a shared prefix for all generated IDs

If you render multiple independent React applications on a single page, pass `identifierPrefix` as an option to your [`createRoot`](/reference/react-dom/client/createRoot#parameters) or [`hydrateRoot`](/reference/react-dom/client/hydrateRoot) calls. This ensures that the IDs generated by the two different apps never clash because every identifier generated with `useId` will start with the distinct prefix you’ve specified.

index.jsindex.htmlApp.js

index.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./styles.css";
const root1 = createRoot(document.getElementById("root1"), {
  identifierPrefix: "my-first-app-",
});
root1.render(<App />);
const root2 = createRoot(document.getElementById("root2"), {
  identifierPrefix: "my-second-app-",
});
root2.render(<App />);
```

---

### Using the same ID prefix on the client and the server

If you [render multiple independent React apps on the same page](#specifying-a-shared-prefix-for-all-generated-ids), and some of these apps are server-rendered, make sure that the `identifierPrefix` you pass to the [`hydrateRoot`](/reference/react-dom/client/hydrateRoot) call on the client side is the same as the `identifierPrefix` you pass to the [server APIs](/reference/react-dom/server) such as [`renderToPipeableStream`.](/reference/react-dom/server/renderToPipeableStream)

```jsx
// Server
import { renderToPipeableStream } from "react-dom/server";
const { pipe } = renderToPipeableStream(<App />, {
  identifierPrefix: "react-app1",
});
```

```jsx
// Client
import { hydrateRoot } from "react-dom/client";
const domNode = document.getElementById("root");
const root = hydrateRoot(domNode, reactNode, {
  identifierPrefix: "react-app1",
});
```

You do not need to pass `identifierPrefix` if you only have one React app on the page.

[PrevioususeEffectEvent](/reference/react/useEffectEvent)[NextuseImperativeHandle](/reference/react/useImperativeHandle)
