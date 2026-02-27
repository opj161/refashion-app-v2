[API Reference](/reference/react)

[Legacy React APIs](/reference/react/legacy)

# forwardRef

### Deprecated

In React 19, `forwardRef` is no longer necessary. Pass `ref` as a prop instead.

`forwardRef` will be deprecated in a future release. Learn more [here](/blog/2024/04/25/react-19#ref-as-a-prop).

`forwardRef` lets your component expose a DOM node to the parent component with a [ref.](/learn/manipulating-the-dom-with-refs)

```jsx
const SomeComponent = forwardRef(render);
```

- [Reference](#reference)
  - [`forwardRef(render)`](#forwardref)
  - [`render` function](#render-function)
- [Usage](#usage)
  - [Exposing a DOM node to the parent component](#exposing-a-dom-node-to-the-parent-component)
  - [Forwarding a ref through multiple components](#forwarding-a-ref-through-multiple-components)
  - [Exposing an imperative handle instead of a DOM node](#exposing-an-imperative-handle-instead-of-a-dom-node)
- [Troubleshooting](#troubleshooting)
  - [My component is wrapped in `forwardRef`, but the `ref` to it is always `null`](#my-component-is-wrapped-in-forwardref-but-the-ref-to-it-is-always-null)

---

## Reference

### `forwardRef(render)`

Call `forwardRef()` to let your component receive a ref and forward it to a child component:

```jsx
import { forwardRef } from "react";
const MyInput = forwardRef(function MyInput(props, ref) {
  // ...
});
```

[See more examples below.](#usage)

#### Parameters

- `render`: The render function for your component. React calls this function with the props and `ref` that your component received from its parent. The JSX you return will be the output of your component.

#### Returns

`forwardRef` returns a React component that you can render in JSX. Unlike React components defined as plain functions, a component returned by `forwardRef` is also able to receive a `ref` prop.

#### Caveats

- In Strict Mode, React will **call your render function twice** in order to [help you find accidental impurities.](/reference/react/useState#my-initializer-or-updater-function-runs-twice) This is development-only behavior and does not affect production. If your render function is pure (as it should be), this should not affect the logic of your component. The result from one of the calls will be ignored.

---

### `render` function

`forwardRef` accepts a render function as an argument. React calls this function with `props` and `ref`:

```jsx
const MyInput = forwardRef(function MyInput(props, ref) {
  return (
    <label>
      {props.label}
      <input ref={ref} />
    </label>
  );
});
```

#### Parameters

- `props`: The props passed by the parent component.
- `ref`: The `ref` attribute passed by the parent component. The `ref` can be an object or a function. If the parent component has not passed a ref, it will be `null`. You should either pass the `ref` you receive to another component, or pass it to [`useImperativeHandle`.](/reference/react/useImperativeHandle)

#### Returns

`forwardRef` returns a React component that you can render in JSX. Unlike React components defined as plain functions, the component returned by `forwardRef` is able to take a `ref` prop.

---

## Usage

### Exposing a DOM node to the parent component

By default, each component’s DOM nodes are private. However, sometimes it’s useful to expose a DOM node to the parent—for example, to allow focusing it. To opt in, wrap your component definition into `forwardRef()`:

```jsx
import { forwardRef } from "react";
const MyInput = forwardRef(function MyInput(props, ref) {
  const { label, ...otherProps } = props;
  return (
    <label>
      {label}
      <input {...otherProps} />
    </label>
  );
});
```

You will receive a ref as the second argument after props. Pass it to the DOM node that you want to expose:

```jsx
import { forwardRef } from "react";
const MyInput = forwardRef(function MyInput(props, ref) {
  const { label, ...otherProps } = props;
  return (
    <label>
      {label}
      <input {...otherProps} ref={ref} />
    </label>
  );
});
```

This lets the parent `Form` component access the `<input>` DOM node exposed by `MyInput`:

```jsx
function Form() {
  const ref = useRef(null);
  function handleClick() {
    ref.current.focus();
  }
  return (
    <form>
      <MyInput label="Enter your name:" ref={ref} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}
```

This `Form` component [passes a ref](/reference/react/useRef#manipulating-the-dom-with-a-ref) to `MyInput`. The `MyInput` component _forwards_ that ref to the `<input>` browser tag. As a result, the `Form` component can access that `<input>` DOM node and call [`focus()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) on it.

Keep in mind that exposing a ref to the DOM node inside your component makes it harder to change your component’s internals later. You will typically expose DOM nodes from reusable low-level components like buttons or text inputs, but you won’t do it for application-level components like an avatar or a comment.

#### Examples of forwarding a ref

1. Focusing a text input 2. Playing and pausing a video

#### Example 1 of 2: Focusing a text input

Clicking the button will focus the input. The `Form` component defines a ref and passes it to the `MyInput` component. The `MyInput` component forwards that ref to the browser `<input>`. This lets the `Form` component focus the `<input>`.

App.jsMyInput.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useRef } from "react";
import MyInput from "./MyInput.js";
export default function Form() {
  const ref = useRef(null);
  function handleClick() {
    ref.current.focus();
  }
  return (
    <form>
      <MyInput label="Enter your name:" ref={ref} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}
```

Show more

Next Example

---

### Forwarding a ref through multiple components

Instead of forwarding a `ref` to a DOM node, you can forward it to your own component like `MyInput`:

```jsx
const FormField = forwardRef(function FormField(props, ref) {
  // ...
  return (
    <>
      <MyInput ref={ref} />
      ...
    </>
  );
});
```

If that `MyInput` component forwards a ref to its `<input>`, a ref to `FormField` will give you that `<input>`:

```jsx
function Form() {
  const ref = useRef(null);
  function handleClick() {
    ref.current.focus();
  }
  return (
    <form>
      <FormField label="Enter your name:" ref={ref} isRequired={true} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}
```

The `Form` component defines a ref and passes it to `FormField`. The `FormField` component forwards that ref to `MyInput`, which forwards it to a browser `<input>` DOM node. This is how `Form` accesses that DOM node.

App.jsFormField.jsMyInput.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useRef } from "react";
import FormField from "./FormField.js";
export default function Form() {
  const ref = useRef(null);
  function handleClick() {
    ref.current.focus();
  }
  return (
    <form>
      <FormField label="Enter your name:" ref={ref} isRequired={true} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}
```

Show more

---

### Exposing an imperative handle instead of a DOM node

Instead of exposing an entire DOM node, you can expose a custom object, called an _imperative handle,_ with a more constrained set of methods. To do this, you’d need to define a separate ref to hold the DOM node:

```jsx
const MyInput = forwardRef(function MyInput(props, ref) {
  const inputRef = useRef(null);
  // ...
  return <input {...props} ref={inputRef} />;
});
```

Pass the `ref` you received to [`useImperativeHandle`](/reference/react/useImperativeHandle) and specify the value you want to expose to the `ref`:

```jsx
import { forwardRef, useRef, useImperativeHandle } from "react";
const MyInput = forwardRef(function MyInput(props, ref) {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => {
    return {
      focus() {
        inputRef.current.focus();
      },
      scrollIntoView() {
        inputRef.current.scrollIntoView();
      },
    };
  }, []);
  return <input {...props} ref={inputRef} />;
});
```

If some component gets a ref to `MyInput`, it will only receive your `{ focus, scrollIntoView }` object instead of the DOM node. This lets you limit the information you expose about your DOM node to the minimum.

App.jsMyInput.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useRef } from "react";
import MyInput from "./MyInput.js";
export default function Form() {
  const ref = useRef(null);
  function handleClick() {
    ref.current.focus();
    // This won't work because the DOM node isn't exposed:
    // ref.current.style.opacity = 0.5;
  }
  return (
    <form>
      <MyInput placeholder="Enter your name" ref={ref} />
      <button type="button" onClick={handleClick}>
        Edit
      </button>
    </form>
  );
}
```

Show more

[Read more about using imperative handles.](/reference/react/useImperativeHandle)

### Pitfall

**Do not overuse refs.** You should only use refs for _imperative_ behaviors that you can’t express as props: for example, scrolling to a node, focusing a node, triggering an animation, selecting text, and so on.

**If you can express something as a prop, you should not use a ref.** For example, instead of exposing an imperative handle like `{ open, close }` from a `Modal` component, it is better to take `isOpen` as a prop like `<Modal isOpen={isOpen} />`. [Effects](/learn/synchronizing-with-effects) can help you expose imperative behaviors via props.

---

## Troubleshooting

### My component is wrapped in `forwardRef`, but the `ref` to it is always `null`

This usually means that you forgot to actually use the `ref` that you received.

For example, this component doesn’t do anything with its `ref`:

```jsx
const MyInput = forwardRef(function MyInput({ label }, ref) {
  return (
    <label>
      {label}
      <input />
    </label>
  );
});
```

To fix it, pass the `ref` down to a DOM node or another component that can accept a ref:

```jsx
const MyInput = forwardRef(function MyInput({ label }, ref) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
});
```

The `ref` to `MyInput` could also be `null` if some of the logic is conditional:

```jsx
const MyInput = forwardRef(function MyInput({ label, showInput }, ref) {
  return (
    <label>
      {label}
      {showInput && <input ref={ref} />}
    </label>
  );
});
```

If `showInput` is `false`, then the ref won’t be forwarded to any node, and a ref to `MyInput` will remain empty. This is particularly easy to miss if the condition is hidden inside another component, like `Panel` in this example:

```jsx
const MyInput = forwardRef(function MyInput({ label, showInput }, ref) {
  return (
    <label>
      {label}
      <Panel isExpanded={showInput}>
        <input ref={ref} />
      </Panel>
    </label>
  );
});
```

[PreviouscreateRef](/reference/react/createRef)[NextisValidElement](/reference/react/isValidElement)
