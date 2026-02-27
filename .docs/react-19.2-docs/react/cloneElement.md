[API Reference](/reference/react)

[Legacy React APIs](/reference/react/legacy)

# cloneElement

### Pitfall

Using `cloneElement` is uncommon and can lead to fragile code. [See common alternatives.](#alternatives)

`cloneElement` lets you create a new React element using another element as a starting point.

```jsx
const clonedElement = cloneElement(element, props, ...children);
```

- [Reference](#reference)
  - [`cloneElement(element, props, ...children)`](#cloneelement)
- [Usage](#usage)
  - [Overriding props of an element](#overriding-props-of-an-element)
- [Alternatives](#alternatives)
  - [Passing data with a render prop](#passing-data-with-a-render-prop)
  - [Passing data through context](#passing-data-through-context)
  - [Extracting logic into a custom Hook](#extracting-logic-into-a-custom-hook)

---

## Reference

### `cloneElement(element, props, ...children)`

Call `cloneElement` to create a React element based on the `element`, but with different `props` and `children`:

```jsx
import { cloneElement } from "react";
// ...
const clonedElement = cloneElement(
  <Row title="Cabbage">Hello</Row>,
  { isHighlighted: true },
  "Goodbye",
);
console.log(clonedElement); // <Row title="Cabbage" isHighlighted={true}>Goodbye</Row>
```

[See more examples below.](#usage)

#### Parameters

- `element`: The `element` argument must be a valid React element. For example, it could be a JSX node like `<Something />`, the result of calling [`createElement`](/reference/react/createElement), or the result of another `cloneElement` call.
- `props`: The `props` argument must either be an object or `null`. If you pass `null`, the cloned element will retain all of the original `element.props`. Otherwise, for every prop in the `props` object, the returned element will “prefer” the value from `props` over the value from `element.props`. The rest of the props will be filled from the original `element.props`. If you pass `props.key` or `props.ref`, they will replace the original ones.
- **optional** `...children`: Zero or more child nodes. They can be any React nodes, including React elements, strings, numbers, [portals](/reference/react-dom/createPortal), empty nodes (`null`, `undefined`, `true`, and `false`), and arrays of React nodes. If you don’t pass any `...children` arguments, the original `element.props.children` will be preserved.

#### Returns

`cloneElement` returns a React element object with a few properties:

- `type`: Same as `element.type`.
- `props`: The result of shallowly merging `element.props` with the overriding `props` you have passed.
- `ref`: The original `element.ref`, unless it was overridden by `props.ref`.
- `key`: The original `element.key`, unless it was overridden by `props.key`.

Usually, you’ll return the element from your component or make it a child of another element. Although you may read the element’s properties, it’s best to treat every element as opaque after it’s created, and only render it.

#### Caveats

- Cloning an element **does not modify the original element.**
- You should only **pass children as multiple arguments to `cloneElement` if they are all statically known,** like `cloneElement(element, null, child1, child2, child3)`. If your children are dynamic, pass the entire array as the third argument: `cloneElement(element, null, listItems)`. This ensures that React will [warn you about missing `key`s](/learn/rendering-lists#keeping-list-items-in-order-with-key) for any dynamic lists. For static lists this is not necessary because they never reorder.
- `cloneElement` makes it harder to trace the data flow, so **try the [alternatives](#alternatives) instead.**

---

## Usage

### Overriding props of an element

To override the props of some React element, pass it to `cloneElement` with the props you want to override:

```jsx
import { cloneElement } from "react";
// ...
const clonedElement = cloneElement(<Row title="Cabbage" />, {
  isHighlighted: true,
});
```

Here, the resulting cloned element will be `<Row title="Cabbage" isHighlighted={true} />`.

**Let’s walk through an example to see when it’s useful.**

Imagine a `List` component that renders its [`children`](/learn/passing-props-to-a-component#passing-jsx-as-children) as a list of selectable rows with a “Next” button that changes which row is selected. The `List` component needs to render the selected `Row` differently, so it clones every `<Row>` child that it has received, and adds an extra `isHighlighted: true` or `isHighlighted: false` prop:

```jsx
export default function List({ children }) {
const [selectedIndex, setSelectedIndex] = useState(0);
return (
<div className="List">
{Children.map(children, (child, index) =>
cloneElement(child, {
isHighlighted: index === selectedIndex
})
)}
```

Let’s say the original JSX received by `List` looks like this:

```jsx
<List>
  <Row title="Cabbage" />
  <Row title="Garlic" />
  <Row title="Apple" />
</List>
```

By cloning its children, the `List` can pass extra information to every `Row` inside. The result looks like this:

```jsx
<List>
  <Row title="Cabbage" isHighlighted={true} />
  <Row title="Garlic" isHighlighted={false} />
  <Row title="Apple" isHighlighted={false} />
</List>
```

Notice how pressing “Next” updates the state of the `List`, and highlights a different row:

App.jsList.jsRow.jsdata.js

List.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { Children, cloneElement, useState } from "react";
export default function List({ children }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <div className="List">
      {Children.map(children, (child, index) =>
        cloneElement(child, {
          isHighlighted: index === selectedIndex,
        }),
      )}
      <hr />
      <button
        onClick={() => {
          setSelectedIndex((i) => (i + 1) % Children.count(children));
        }}
      >
        Next
      </button>
    </div>
  );
}
```

Show more

To summarize, the `List` cloned the `<Row />` elements it received and added an extra prop to them.

### Pitfall

Cloning children makes it hard to tell how the data flows through your app. Try one of the [alternatives.](#alternatives)

---

## Alternatives

### Passing data with a render prop

Instead of using `cloneElement`, consider accepting a _render prop_ like `renderItem`. Here, `List` receives `renderItem` as a prop. `List` calls `renderItem` for every item and passes `isHighlighted` as an argument:

```jsx
export default function List({ items, renderItem }) {
const [selectedIndex, setSelectedIndex] = useState(0);
return (
<div className="List">
{items.map((item, index) => {
const isHighlighted = index === selectedIndex;
return renderItem(item, isHighlighted);
})}
```

The `renderItem` prop is called a “render prop” because it’s a prop that specifies how to render something. For example, you can pass a `renderItem` implementation that renders a `<Row>` with the given `isHighlighted` value:

```jsx
<List
  items={products}
  renderItem={(product, isHighlighted) => (
    <Row key={product.id} title={product.title} isHighlighted={isHighlighted} />
  )}
/>
```

The end result is the same as with `cloneElement`:

```jsx
<List>
  <Row title="Cabbage" isHighlighted={true} />
  <Row title="Garlic" isHighlighted={false} />
  <Row title="Apple" isHighlighted={false} />
</List>
```

However, you can clearly trace where the `isHighlighted` value is coming from.

App.jsList.jsRow.jsdata.js

List.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useState } from "react";
export default function List({ items, renderItem }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <div className="List">
      {items.map((item, index) => {
        const isHighlighted = index === selectedIndex;
        return renderItem(item, isHighlighted);
      })}
      <hr />
      <button
        onClick={() => {
          setSelectedIndex((i) => (i + 1) % items.length);
        }}
      >
        Next
      </button>
    </div>
  );
}
```

Show more

This pattern is preferred to `cloneElement` because it is more explicit.

---

### Passing data through context

Another alternative to `cloneElement` is to [pass data through context.](/learn/passing-data-deeply-with-context)

For example, you can call [`createContext`](/reference/react/createContext) to define a `HighlightContext`:

```jsx
export const HighlightContext = createContext(false);
```

Your `List` component can wrap every item it renders into a `HighlightContext` provider:

```jsx
export default function List({ items, renderItem }) {
const [selectedIndex, setSelectedIndex] = useState(0);
return (
<div className="List">
{items.map((item, index) => {
const isHighlighted = index === selectedIndex;
return (
<HighlightContext key={item.id} value={isHighlighted}>
{renderItem(item)}
</HighlightContext>
);
})}
```

With this approach, `Row` does not need to receive an `isHighlighted` prop at all. Instead, it reads the context:

```jsx
export default function Row({ title }) {
const isHighlighted = useContext(HighlightContext);
// ...
```

This allows the calling component to not know or worry about passing `isHighlighted` to `<Row>`:

```jsx
<List
  items={products}
  renderItem={(product) => <Row title={product.title} />}
/>
```

Instead, `List` and `Row` coordinate the highlighting logic through context.

App.jsList.jsRow.jsHighlightContext.jsdata.js

List.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { useState } from "react";
import { HighlightContext } from "./HighlightContext.js";
export default function List({ items, renderItem }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  return (
    <div className="List">
      {items.map((item, index) => {
        const isHighlighted = index === selectedIndex;
        return (
          <HighlightContext key={item.id} value={isHighlighted}>
            {renderItem(item)}
          </HighlightContext>
        );
      })}
      <hr />
      <button
        onClick={() => {
          setSelectedIndex((i) => (i + 1) % items.length);
        }}
      >
        Next
      </button>
    </div>
  );
}
```

Show more

[Learn more about passing data through context.](/reference/react/useContext#passing-data-deeply-into-the-tree)

---

### Extracting logic into a custom Hook

Another approach you can try is to extract the “non-visual” logic into your own Hook, and use the information returned by your Hook to decide what to render. For example, you could write a `useList` custom Hook like this:

```jsx
import { useState } from "react";
export default function useList(items) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  function onNext() {
    setSelectedIndex((i) => (i + 1) % items.length);
  }
  const selected = items[selectedIndex];
  return [selected, onNext];
}
```

Then you could use it like this:

```jsx
export default function App() {
  const [selected, onNext] = useList(products);
  return (
    <div className="List">
      {products.map((product) => (
        <Row
          key={product.id}
          title={product.title}
          isHighlighted={selected === product}
        />
      ))}
      <hr />
      <button onClick={onNext}>Next</button>
    </div>
  );
}
```

The data flow is explicit, but the state is inside the `useList` custom Hook that you can use from any component:

App.jsuseList.jsRow.jsdata.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import Row from "./Row.js";
import useList from "./useList.js";
import { products } from "./data.js";
export default function App() {
  const [selected, onNext] = useList(products);
  return (
    <div className="List">
      {products.map((product) => (
        <Row
          key={product.id}
          title={product.title}
          isHighlighted={selected === product}
        />
      ))}
      <hr />
      <button onClick={onNext}>Next</button>
    </div>
  );
}
```

Show more

This approach is particularly useful if you want to reuse this logic between different components.

[PreviousChildren](/reference/react/Children)[NextComponent](/reference/react/Component)
