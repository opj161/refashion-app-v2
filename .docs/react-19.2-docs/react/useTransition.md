[API Reference](/reference/react)

[Hooks](/reference/react/hooks)

# useTransition

`useTransition` is a React Hook that lets you render a part of the UI in the background.

```jsx
const [isPending, startTransition] = useTransition();
```

- [Reference](#reference)
  - [`useTransition()`](#usetransition)
  - [`startTransition(action)`](#starttransition)
- [Usage](#usage)
  - [Perform non-blocking updates with Actions](#perform-non-blocking-updates-with-actions)
  - [Exposing `action` prop from components](#exposing-action-props-from-components)
  - [Displaying a pending visual state](#displaying-a-pending-visual-state)
  - [Preventing unwanted loading indicators](#preventing-unwanted-loading-indicators)
  - [Building a Suspense-enabled router](#building-a-suspense-enabled-router)
  - [Displaying an error to users with an error boundary](#displaying-an-error-to-users-with-error-boundary)
- [Troubleshooting](#troubleshooting)
  - [Updating an input in a Transition doesn’t work](#updating-an-input-in-a-transition-doesnt-work)
  - [React doesn’t treat my state update as a Transition](#react-doesnt-treat-my-state-update-as-a-transition)
  - [React doesn’t treat my state update after `await` as a Transition](#react-doesnt-treat-my-state-update-after-await-as-a-transition)
  - [I want to call `useTransition` from outside a component](#i-want-to-call-usetransition-from-outside-a-component)
  - [The function I pass to `startTransition` executes immediately](#the-function-i-pass-to-starttransition-executes-immediately)
  - [My state updates in Transitions are out of order](#my-state-updates-in-transitions-are-out-of-order)

---

## Reference

### `useTransition()`

Call `useTransition` at the top level of your component to mark some state updates as Transitions.

```jsx
import { useTransition } from "react";
function TabContainer() {
  const [isPending, startTransition] = useTransition();
  // ...
}
```

[See more examples below.](#usage)

#### Parameters

`useTransition` does not take any parameters.

#### Returns

`useTransition` returns an array with exactly two items:

1. The `isPending` flag that tells you whether there is a pending Transition.
2. The [`startTransition` function](#starttransition) that lets you mark updates as a Transition.

---

### `startTransition(action)`

The `startTransition` function returned by `useTransition` lets you mark an update as a Transition.

```jsx
function TabContainer() {
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState("about");
  function selectTab(nextTab) {
    startTransition(() => {
      setTab(nextTab);
    });
  }
  // ...
}
```

### Note

#### Functions called in `startTransition` are called “Actions”.

The function passed to `startTransition` is called an “Action”. By convention, any callback called inside `startTransition` (such as a callback prop) should be named `action` or include the “Action” suffix:

```jsx
function SubmitButton({ submitAction }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await submitAction();
        });
      }}
    >
      Submit
    </button>
  );
}
```

#### Parameters

- `action`: A function that updates some state by calling one or more [`set` functions](/reference/react/useState#setstate). React calls `action` immediately with no parameters and marks all state updates scheduled synchronously during the `action` function call as Transitions. Any async calls that are awaited in the `action` will be included in the Transition, but currently require wrapping any `set` functions after the `await` in an additional `startTransition` (see [Troubleshooting](#react-doesnt-treat-my-state-update-after-await-as-a-transition)). State updates marked as Transitions will be [non-blocking](#perform-non-blocking-updates-with-actions) and [will not display unwanted loading indicators](#preventing-unwanted-loading-indicators).

#### Returns

`startTransition` does not return anything.

#### Caveats

- `useTransition` is a Hook, so it can only be called inside components or custom Hooks. If you need to start a Transition somewhere else (for example, from a data library), call the standalone [`startTransition`](/reference/react/startTransition) instead.
- You can wrap an update into a Transition only if you have access to the `set` function of that state. If you want to start a Transition in response to some prop or a custom Hook value, try [`useDeferredValue`](/reference/react/useDeferredValue) instead.
- The function you pass to `startTransition` is called immediately, marking all state updates that happen while it executes as Transitions. If you try to perform state updates in a `setTimeout`, for example, they won’t be marked as Transitions.
- You must wrap any state updates after any async requests in another `startTransition` to mark them as Transitions. This is a known limitation that we will fix in the future (see [Troubleshooting](#react-doesnt-treat-my-state-update-after-await-as-a-transition)).
- The `startTransition` function has a stable identity, so you will often see it omitted from Effect dependencies, but including it will not cause the Effect to fire. If the linter lets you omit a dependency without errors, it is safe to do. [Learn more about removing Effect dependencies.](/learn/removing-effect-dependencies#move-dynamic-objects-and-functions-inside-your-effect)
- A state update marked as a Transition will be interrupted by other state updates. For example, if you update a chart component inside a Transition, but then start typing into an input while the chart is in the middle of a re-render, React will restart the rendering work on the chart component after handling the input update.
- Transition updates can’t be used to control text inputs.
- If there are multiple ongoing Transitions, React currently batches them together. This is a limitation that may be removed in a future release.

## Usage

### Perform non-blocking updates with Actions

Call `useTransition` at the top of your component to create Actions, and access the pending state:

```jsx
import { useState, useTransition } from "react";
function CheckoutForm() {
  const [isPending, startTransition] = useTransition();
  // ...
}
```

`useTransition` returns an array with exactly two items:

1. The `isPending` flag that tells you whether there is a pending Transition.
2. The `startTransition` function that lets you create an Action.

To start a Transition, pass a function to `startTransition` like this:

```jsx
import { useState, useTransition } from "react";
import { updateQuantity } from "./api";
function CheckoutForm() {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(1);
  function onSubmit(newQuantity) {
    startTransition(async function () {
      const savedQuantity = await updateQuantity(newQuantity);
      startTransition(() => {
        setQuantity(savedQuantity);
      });
    });
  }
  // ...
}
```

The function passed to `startTransition` is called the “Action”. You can update state and (optionally) perform side effects within an Action, and the work will be done in the background without blocking user interactions on the page. A Transition can include multiple Actions, and while a Transition is in progress, your UI stays responsive. For example, if the user clicks a tab but then changes their mind and clicks another tab, the second click will be immediately handled without waiting for the first update to finish.

To give the user feedback about in-progress Transitions, the `isPending` state switches to `true` at the first call to `startTransition`, and stays `true` until all Actions complete and the final state is shown to the user. Transitions ensure side effects in Actions to complete in order to [prevent unwanted loading indicators](#preventing-unwanted-loading-indicators), and you can provide immediate feedback while the Transition is in progress with `useOptimistic`.

#### The difference between Actions and regular event handling

1. Updating the quantity in an Action 2. Updating the quantity without an Action

#### Example 1 of 2: Updating the quantity in an Action

In this example, the `updateQuantity` function simulates a request to the server to update the item’s quantity in the cart. This function is _artificially slowed down_ so that it takes at least a second to complete the request.

Update the quantity multiple times quickly. Notice that the pending “Total” state is shown while any requests are in progress, and the “Total” updates only after the final request is complete. Because the update is in an Action, the “quantity” can continue to be updated while the request is in progress.

App.jsItem.jsTotal.jsapi.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useState, useTransition } from "react";
import { updateQuantity } from "./api";
import Item from "./Item";
import Total from "./Total";
export default function App({}) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const updateQuantityAction = async (newQuantity) => {
    // To access the pending state of a transition,
    // call startTransition again.
    startTransition(async () => {
      const savedQuantity = await updateQuantity(newQuantity);
      startTransition(() => {
        setQuantity(savedQuantity);
      });
    });
  };
  return (
    <div>
      <h1>Checkout</h1>
      <Item action={updateQuantityAction} />
      <hr />
      <Total quantity={quantity} isPending={isPending} />
    </div>
  );
}
```

Show more

This is a basic example to demonstrate how Actions work, but this example does not handle requests completing out of order. When updating the quantity multiple times, it’s possible for the previous requests to finish after later requests causing the quantity to update out of order. This is a known limitation that we will fix in the future (see [Troubleshooting](#my-state-updates-in-transitions-are-out-of-order) below).

For common use cases, React provides built-in abstractions such as:

- [`useActionState`](/reference/react/useActionState)
- [`<form>` actions](/reference/react-dom/components/form)
- [Server Functions](/reference/rsc/server-functions)

These solutions handle request ordering for you. When using Transitions to build your own custom hooks or libraries that manage async state transitions, you have greater control over the request ordering, but you must handle it yourself.

Next Example

---

### Exposing `action` prop from components

You can expose an `action` prop from a component to allow a parent to call an Action.

For example, this `TabButton` component wraps its `onClick` logic in an `action` prop:

```jsx
export default function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>;
  }
  return (
    <button
      onClick={() => {
        startTransition(async () => {
          // await the action that's passed in.
          // This allows it to be either sync or async.
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
```

Because the parent component updates its state inside the `action`, that state update gets marked as a Transition. This means you can click on “Posts” and then immediately click “Contact” and it does not block user interactions:

App.jsTabButton.jsAboutTab.jsPostsTab.jsContactTab.js

TabButton.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useTransition } from "react";
export default function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>;
  }
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  return (
    <button
      onClick={async () => {
        startTransition(async () => {
          // await the action that's passed in.
          // This allows it to be either sync or async.
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
```

Show more

### Note

When exposing an `action` prop from a component, you should `await` it inside the transition.

This allows the `action` callback to be either synchronous or asynchronous without requiring an additional `startTransition` to wrap the `await` in the action.

---

### Displaying a pending visual state

You can use the `isPending` boolean value returned by `useTransition` to indicate to the user that a Transition is in progress. For example, the tab button can have a special “pending” visual state:

```jsx
function TabButton({ action, children, isActive }) {
const [isPending, startTransition] = useTransition();
// ...
if (isPending) {
return <b className="pending">{children}</b>;
}
// ...
```

Notice how clicking “Posts” now feels more responsive because the tab button itself updates right away:

App.jsTabButton.jsAboutTab.jsPostsTab.jsContactTab.js

TabButton.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useTransition } from "react";
export default function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>;
  }
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
```

Show more

---

### Preventing unwanted loading indicators

In this example, the `PostsTab` component fetches some data using [use](/reference/react/use). When you click the “Posts” tab, the `PostsTab` component _suspends_, causing the closest loading fallback to appear:

App.jsTabButton.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { Suspense, useState } from "react";
import TabButton from "./TabButton.js";
import AboutTab from "./AboutTab.js";
import PostsTab from "./PostsTab.js";
import ContactTab from "./ContactTab.js";
export default function TabContainer() {
  const [tab, setTab] = useState("about");
  return (
    <Suspense fallback={<h1>🌀 Loading...</h1>}>
      <TabButton isActive={tab === "about"} action={() => setTab("about")}>
        About
      </TabButton>
      <TabButton isActive={tab === "posts"} action={() => setTab("posts")}>
        Posts
      </TabButton>
      <TabButton isActive={tab === "contact"} action={() => setTab("contact")}>
        Contact
      </TabButton>
      <hr />
      {tab === "about" && <AboutTab />}
      {tab === "posts" && <PostsTab />}
      {tab === "contact" && <ContactTab />}
    </Suspense>
  );
}
```

Show more

Hiding the entire tab container to show a loading indicator leads to a jarring user experience. If you add `useTransition` to `TabButton`, you can instead display the pending state in the tab button instead.

Notice that clicking “Posts” no longer replaces the entire tab container with a spinner:

App.jsTabButton.js

TabButton.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useTransition } from "react";
export default function TabButton({ action, children, isActive }) {
  const [isPending, startTransition] = useTransition();
  if (isActive) {
    return <b>{children}</b>;
  }
  if (isPending) {
    return <b className="pending">{children}</b>;
  }
  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
```

Show more

[Read more about using Transitions with Suspense.](/reference/react/Suspense#preventing-already-revealed-content-from-hiding)

### Note

Transitions only “wait” long enough to avoid hiding _already revealed_ content (like the tab container). If the Posts tab had a [nested `<Suspense>` boundary,](/reference/react/Suspense#revealing-nested-content-as-it-loads) the Transition would not “wait” for it.

---

### Building a Suspense-enabled router

If you’re building a React framework or a router, we recommend marking page navigations as Transitions.

```jsx
function Router() {
const [page, setPage] = useState('/');
const [isPending, startTransition] = useTransition();
function navigate(url) {
startTransition(() => {
setPage(url);
});
}
// ...
```

This is recommended for three reasons:

- [Transitions are interruptible,](#perform-non-blocking-updates-with-actions) which lets the user click away without waiting for the re-render to complete.
- [Transitions prevent unwanted loading indicators,](#preventing-unwanted-loading-indicators) which lets the user avoid jarring jumps on navigation.
- [Transitions wait for all pending actions](#perform-non-blocking-updates-with-actions) which lets the user wait for side effects to complete before the new page is shown.

Here is a simplified router example using Transitions for navigations.

App.jsLayout.jsIndexPage.jsArtistPage.jsAlbums.jsBiography.jsPanel.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { Suspense, useState, useTransition } from "react";
import IndexPage from "./IndexPage.js";
import ArtistPage from "./ArtistPage.js";
import Layout from "./Layout.js";
export default function App() {
  return (
    <Suspense fallback={<BigSpinner />}>
      <Router />
    </Suspense>
  );
}
function Router() {
  const [page, setPage] = useState("/");
  const [isPending, startTransition] = useTransition();
  function navigate(url) {
    startTransition(() => {
      setPage(url);
    });
  }
  let content;
  if (page === "/") {
    content = <IndexPage navigate={navigate} />;
  } else if (page === "/the-beatles") {
    content = (
      <ArtistPage
        artist={{
          id: "the-beatles",
          name: "The Beatles",
        }}
      />
    );
  }
  return <Layout isPending={isPending}>{content}</Layout>;
}
function BigSpinner() {
  return <h2>🌀 Loading...</h2>;
}
```

Show more

### Note

[Suspense-enabled](/reference/react/Suspense) routers are expected to wrap the navigation updates into Transitions by default.

---

### Displaying an error to users with an error boundary

If a function passed to `startTransition` throws an error, you can display an error to your user with an [error boundary](/reference/react/Component#catching-rendering-errors-with-an-error-boundary). To use an error boundary, wrap the component where you are calling the `useTransition` in an error boundary. Once the function passed to `startTransition` errors, the fallback for the error boundary will be displayed.

AddCommentContainer.js

AddCommentContainer.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useTransition } from "react";
import { ErrorBoundary } from "react-error-boundary";
export function AddCommentContainer() {
  return (
    <ErrorBoundary fallback={<p>⚠️Something went wrong</p>}>
      <AddCommentButton />
    </ErrorBoundary>
  );
}
function addComment(comment) {
  // For demonstration purposes to show Error Boundary
  if (comment == null) {
    throw new Error("Example Error: An error thrown to trigger error boundary");
  }
}
function AddCommentButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          // Intentionally not passing a comment
          // so error gets thrown
          addComment();
        });
      }}
    >
      Add comment
    </button>
  );
}
```

Show more

---

## Troubleshooting

### Updating an input in a Transition doesn’t work

You can’t use a Transition for a state variable that controls an input:

```jsx
const [text, setText] = useState("");
// ...
function handleChange(e) {
  // ❌ Can't use Transitions for controlled input state
  startTransition(() => {
    setText(e.target.value);
  });
}
// ...
return <input value={text} onChange={handleChange} />;
```

This is because Transitions are non-blocking, but updating an input in response to the change event should happen synchronously. If you want to run a Transition in response to typing, you have two options:

1. You can declare two separate state variables: one for the input state (which always updates synchronously), and one that you will update in a Transition. This lets you control the input using the synchronous state, and pass the Transition state variable (which will “lag behind” the input) to the rest of your rendering logic.
2. Alternatively, you can have one state variable, and add [`useDeferredValue`](/reference/react/useDeferredValue) which will “lag behind” the real value. It will trigger non-blocking re-renders to “catch up” with the new value automatically.

---

### React doesn’t treat my state update as a Transition

When you wrap a state update in a Transition, make sure that it happens _during_ the `startTransition` call:

```jsx
startTransition(() => {
  // ✅ Setting state *during* startTransition call
  setPage("/about");
});
```

The function you pass to `startTransition` must be synchronous. You can’t mark an update as a Transition like this:

```jsx
startTransition(() => {
  // ❌ Setting state *after* startTransition call
  setTimeout(() => {
    setPage("/about");
  }, 1000);
});
```

Instead, you could do this:

```jsx
setTimeout(() => {
  startTransition(() => {
    // ✅ Setting state *during* startTransition call
    setPage("/about");
  });
}, 1000);
```

---

### React doesn’t treat my state update after `await` as a Transition

When you use `await` inside a `startTransition` function, the state updates that happen after the `await` are not marked as Transitions. You must wrap state updates after each `await` in a `startTransition` call:

```jsx
startTransition(async () => {
  await someAsyncFunction();
  // ❌ Not using startTransition after await
  setPage("/about");
});
```

However, this works instead:

```jsx
startTransition(async () => {
  await someAsyncFunction();
  // ✅ Using startTransition *after* await
  startTransition(() => {
    setPage("/about");
  });
});
```

This is a JavaScript limitation due to React losing the scope of the async context. In the future, when [AsyncContext](https://github.com/tc39/proposal-async-context) is available, this limitation will be removed.

---

### I want to call `useTransition` from outside a component

You can’t call `useTransition` outside a component because it’s a Hook. In this case, use the standalone [`startTransition`](/reference/react/startTransition) method instead. It works the same way, but it doesn’t provide the `isPending` indicator.

---

### The function I pass to `startTransition` executes immediately

If you run this code, it will print 1, 2, 3:

```jsx
console.log(1);
startTransition(() => {
  console.log(2);
  setPage("/about");
});
console.log(3);
```

**It is expected to print 1, 2, 3.** The function you pass to `startTransition` does not get delayed. Unlike with the browser `setTimeout`, it does not run the callback later. React executes your function immediately, but any state updates scheduled _while it is running_ are marked as Transitions. You can imagine that it works like this:

```jsx
// A simplified version of how React works
let isInsideTransition = false;
function startTransition(scope) {
  isInsideTransition = true;
  scope();
  isInsideTransition = false;
}
function setState() {
  if (isInsideTransition) {
    // ... schedule a Transition state update ...
  } else {
    // ... schedule an urgent state update ...
  }
}
```

### My state updates in Transitions are out of order

If you `await` inside `startTransition`, you might see the updates happen out of order.

In this example, the `updateQuantity` function simulates a request to the server to update the item’s quantity in the cart. This function _artificially returns every other request after the previous_ to simulate race conditions for network requests.

Try updating the quantity once, then update it quickly multiple times. You might see the incorrect total:

App.jsItem.jsTotal.jsapi.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useState, useTransition } from "react";
import { updateQuantity } from "./api";
import Item from "./Item";
import Total from "./Total";
export default function App({}) {
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  // Store the actual quantity in separate state to show the mismatch.
  const [clientQuantity, setClientQuantity] = useState(1);
  const updateQuantityAction = (newQuantity) => {
    setClientQuantity(newQuantity);
    // Access the pending state of the transition,
    // by wrapping in startTransition again.
    startTransition(async () => {
      const savedQuantity = await updateQuantity(newQuantity);
      startTransition(() => {
        setQuantity(savedQuantity);
      });
    });
  };
  return (
    <div>
      <h1>Checkout</h1>
      <Item action={updateQuantityAction} />
      <hr />
      <Total
        clientQuantity={clientQuantity}
        savedQuantity={quantity}
        isPending={isPending}
      />
    </div>
  );
}
```

Show more

When clicking multiple times, it’s possible for previous requests to finish after later requests. When this happens, React currently has no way to know the intended order. This is because the updates are scheduled asynchronously, and React loses context of the order across the async boundary.

This is expected, because Actions within a Transition do not guarantee execution order. For common use cases, React provides higher-level abstractions like [`useActionState`](/reference/react/useActionState) and [`<form>` actions](/reference/react-dom/components/form) that handle ordering for you. For advanced use cases, you’ll need to implement your own queuing and abort logic to handle this.

Example of `useActionState` handling execution order:

App.jsItem.jsTotal.jsapi.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useState, useActionState } from "react";
import { updateQuantity } from "./api";
import Item from "./Item";
import Total from "./Total";
export default function App({}) {
  // Store the actual quantity in separate state to show the mismatch.
  const [clientQuantity, setClientQuantity] = useState(1);
  const [quantity, updateQuantityAction, isPending] = useActionState(
    async (prevState, payload) => {
      setClientQuantity(payload);
      const savedQuantity = await updateQuantity(payload);
      return savedQuantity; // Return the new quantity to update the state
    },
    1, // Initial quantity
  );
  return (
    <div>
      <h1>Checkout</h1>
      <Item action={updateQuantityAction} />
      <hr />
      <Total
        clientQuantity={clientQuantity}
        savedQuantity={quantity}
        isPending={isPending}
      />
    </div>
  );
}
```

Show more

[PrevioususeSyncExternalStore](/reference/react/useSyncExternalStore)[NextComponents](/reference/react/components)
