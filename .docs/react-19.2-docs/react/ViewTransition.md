[API Reference](/reference/react)

[Components](/reference/react/components)

# <ViewTransition> - This feature is available in the latest Canary version of React

### Canary

**The `<ViewTransition />` API is currently only available in React’s Canary and Experimental channels.**

[Learn more about React’s release channels here.](/community/versioning-policy#all-release-channels)

`<ViewTransition>` lets you animate a component tree with Transitions and Suspense.

```jsx
import { ViewTransition } from "react";
<ViewTransition>
  <div>...</div>
</ViewTransition>;
```

- [Reference](#reference)
  - [`<ViewTransition>`](#viewtransition)
  - [View Transition Class](#view-transition-class)
  - [View Transition Event](#view-transition-event)
- [Styling View Transitions](#styling-view-transitions)
- [Usage](#usage)
  - [Animating an element on enter/exit](#animating-an-element-on-enter)
  - [Animating enter/exit with Activity](#animating-enter-exit-with-activity)
  - [Animating a shared element](#animating-a-shared-element)
  - [Animating reorder of items in a list](#animating-reorder-of-items-in-a-list)
  - [Animating from Suspense content](#animating-from-suspense-content)
  - [Opting-out of an animation](#opting-out-of-an-animation)
  - [Customizing animations](#customizing-animations)
  - [Customizing animations with types](#customizing-animations-with-types)
  - [Animating with JavaScript](#animating-with-javascript)
  - [Animating transition types with JavaScript](#animating-transition-types-with-javascript)
  - [Building View Transition enabled routers](#building-view-transition-enabled-routers)
- [Troubleshooting](#troubleshooting)
  - [My `<ViewTransition>` is not activating](#my-viewtransition-is-not-activating)
  - [I’m getting an error “There are two `<ViewTransition name=%s>` components with the same name mounted at the same time.”](#two-viewtransition-with-same-name)

---

## Reference

### `<ViewTransition>`

Wrap a component tree in `<ViewTransition>` to animate it:

```jsx
<ViewTransition>
  <Page />
</ViewTransition>
```

[See more examples below.](#usage)

##### Deep Dive

#### How does `<ViewTransition>` work?

Show Details

Under the hood, React applies `view-transition-name` to inline styles of the nearest DOM node nested inside the `<ViewTransition>` component. If there are multiple sibling DOM nodes like `<ViewTransition><div /><div /></ViewTransition>` then React adds a suffix to the name to make each unique but conceptually they’re part of the same one. React doesn’t apply these eagerly but only at the time that boundary should participate in an animation.

React automatically calls `startViewTransition` itself behind the scenes so you should never do that yourself. In fact, if you have something else on the page running a ViewTransition React will interrupt it. So it’s recommended that you use React itself to coordinate these. If you had other ways to trigger ViewTransitions in the past, we recommend that you migrate to the built-in way.

If there are other React ViewTransitions already running then React will wait for them to finish before starting the next one. However, importantly if there are multiple updates happening while the first one is running, those will all be batched into one. If you start A->B. Then in the meantime you get an update to go to C and then D. When the first A->B animation finishes the next one will animate from B->D.

The `getSnapshotBeforeUpdate` lifecycle will be called before `startViewTransition` and some `view-transition-name` will update at the same time.

Then React calls `startViewTransition`. Inside the `updateCallback`, React will:

- Apply its mutations to the DOM and invoke `useInsertionEffect`.
- Wait for fonts to load.
- Call `componentDidMount`, `componentDidUpdate`, `useLayoutEffect` and refs.
- Wait for any pending Navigation to finish.
- Then React will measure any changes to the layout to see which boundaries will need to animate.

After the ready Promise of the `startViewTransition` is resolved, React will then revert the `view-transition-name`. Then React will invoke the `onEnter`, `onExit`, `onUpdate` and `onShare` callbacks to allow for manual programmatic control over the animations. This will be after the built-in default ones have already been computed.

If a `flushSync` happens to get in the middle of this sequence, then React will skip the Transition since it relies on being able to complete synchronously.

After the finished Promise of the `startViewTransition` is resolved, React will then invoke `useEffect`. This prevents those from interfering with the performance of the animation. However, this is not a guarantee because if another `setState` happens while the animation is running it’ll still have to invoke the `useEffect` earlier to preserve the sequential guarantees.

#### Props

- **optional** `name`: A string or object. The name of the View Transition used for shared element transitions. If not provided, React will use a unique name for each View Transition to prevent unexpected animations.
- [View Transition Class](#view-transition-class) props.
- [View Transition Event](#view-transition-event) props.

#### Caveats

- Only use `name` for [shared element transitions](#animating-a-shared-element). For all other animations, React automatically generates a unique name to prevent unexpected animations.
- By default, `setState` updates immediately and does not activate `<ViewTransition>`, only updates wrapped in a [Transition](/reference/react/useTransition), [`<Suspense>`](/reference/react/Suspense), or `useDeferredValue` activate ViewTransition.
- `<ViewTransition>` creates an image that can be moved around, scaled and cross-faded. Unlike Layout Animations you may have seen in React Native or Motion, this means that not every individual Element inside of it animates its position. This can lead to better performance and a more continuous feeling, smooth animation compared to animating every individual piece. However, it can also lose continuity in things that should be moving by themselves. So you might have to add more `<ViewTransition>` boundaries manually as a result.
- Currently, `<ViewTransition>` only works in the DOM. We’re working on adding support for React Native and other platforms.

#### Animation triggers

React automatically decides the type of View Transition animation to trigger:

- `enter`: If a `ViewTransition` is the first component inserted in this Transition, then this will activate.
- `exit`: If a `ViewTransition` is the first component deleted in this Transition, then this will activate.
- `update`: If a `ViewTransition` has any DOM mutations inside it that React is doing (such as a prop changing) or if the `ViewTransition` boundary itself changes size or position due to an immediate sibling. If there are nested `ViewTransition` then the mutation applies to them and not the parent.
- `share`: If a named `ViewTransition` is inside a deleted subtree and another named `ViewTransition` with the same name is part of an inserted subtree in the same Transition, they form a Shared Element Transition, and it animates from the deleted one to the inserted one.

By default, `<ViewTransition>` animates with a smooth cross-fade (the browser default view transition).

You can customize the animation by providing a [View Transition Class](#view-transition-class) to the `<ViewTransition>` component for each kind of trigger (see [Styling View Transitions](#styling-view-transitions)), or by using [ViewTransition Events](#view-transition-events) to control the animation with JavaScript using the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API).

### Note

#### Always check `prefers-reduced-motion`

Many users may prefer not having animations on the page. React doesn’t automatically disable animations for this case.

We recommend always using the `@media (prefers-reduced-motion)` media query to disable animations or tone them down based on user preference.

In the future, CSS libraries may have this built-in to their presets.

### View Transition Class

`<ViewTransition>` provides props to define what animations trigger:

```jsx
<ViewTransition default="none" enter="slide-up" exit="slide-down" />
```

#### Props

- **optional** `enter`: `"auto"`, `"none"`, a string, or an object.
- **optional** `exit`: `"auto"`, `"none"`, a string, or an object.
- **optional** `update`: `"auto"`, `"none"`, a string, or an object.
- **optional** `share`: `"auto"`, `"none"`, a string, or an object.
- **optional** `default`: `"auto"`, `"none"`, a string, or an object.

#### Caveats

- If `default` is `"none"` then all other triggers are turned off unless explicitly listed.

#### Values

View Transition class values can be:

- `auto`: the default. Uses the browser default animation.
- `none`: disable animations for this type.
- `<classname>`: a custom CSS class name to use for [customizing View Transitions](#styling-view-transitions).

Object values can be an object with string keys and a value of `auto`, `none` or a custom className:

- `{[type]: value}`: applies `value` if the animation matches the [Transition Type](/reference/react/addTransitionType).
- `{default: value}`: the default value to apply if no [Transition Type](/reference/react/addTransitionType) is matched.

For example, you can define a ViewTransition as:

```jsx
<ViewTransition
/* turn off any animation not defined below */
default="none"
enter={{
/* apply slide-in for Transition Type `forward` */
"forward": 'slide-in',
/* otherwise use the browser default animation */
"default": 'auto'
}}
/* use the browser default for exit animations*/
exit="auto"
/* apply a custom `cross-fade` class for updates */
update="cross-fade"
>
```

See [Styling View Transitions](#styling-view-transitions) for how to define CSS classes for custom animations.

---

### View Transition Event

View Transition Events allow you to control the animation with JavaScript using the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API):

```jsx
<ViewTransition
  onEnter={(instance) => {
    /* ... */
  }}
  onExit={(instance) => {
    /* ... */
  }}
/>
```

#### Props

- **optional** `onEnter`: Called when an “enter” animation is triggered.
- **optional** `onExit`: Called when an “exit” animation is triggered.
- **optional** `onShare`: Called when a “share” animation is triggered.
- **optional** `onUpdate`: Called when an “update” animation is triggered.

#### Caveats

- Only one event fires per `<ViewTransition>` per Transition. `onShare` takes precedence over `onEnter` and `onExit`.
- Each event should return a **cleanup function**. The cleanup function is called when the View Transition finishes, allowing you to cancel or cleanup any animations.

#### Arguments

Each event receives two arguments:

- `instance`: A View Transition instance that provides access to the view transition [pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using#the_view_transition_process)
  - `old`: The `::view-transition-old` pseudo-element.
  - `new`: The `::view-transition-new` pseudo-element.
  - `name`: The `view-transition-name` string for this boundary.
  - `group`: The `::view-transition-group` pseudo-element.
  - `imagePair`: The `::view-transition-image-pair` pseudo-element.
- `types`: An `Array<string>` of [Transition Types](/reference/react/addTransitionType) included in the animation. Empty array if no types were specified.

For example, you can define a `onEnter` event that drives the animation using JavaScript:

```jsx
<ViewTransition
  onEnter={(instance, types) => {
    const anim = instance.new.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 500,
    });
    return () => anim.cancel();
  }}
>
  <div>...</div>
</ViewTransition>
```

See [Animating with JavaScript](#animating-with-javascript) for more examples.

---

## Styling View Transitions

### Note

In many early examples of View Transitions around the web, you’ll have seen using a [`view-transition-name`](https://developer.mozilla.org/en-US/docs/Web/CSS/view-transition-name) and then style it using `::view-transition-...(my-name)` selectors. We don’t recommend that for styling. Instead, we normally recommend using a View Transition Class instead.

To customize the animation for a `<ViewTransition>` you can provide a View Transition Class to one of the activation props. The View Transition Class is a CSS class name that React applies to the child elements when the ViewTransition activates.

For example, to customize an “enter” animation, provide a class name to the `enter` prop:

```jsx
<ViewTransition enter="slide-in">
```

When the `<ViewTransition>` activates an “enter” animation, React will add the class name `slide-in`. Then you can refer to this class using [view transition pseudo selectors](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API#pseudo-elements) to build reusable animations:

```jsx
::view-transition-group(.slide-in) {
}
::view-transition-old(.slide-in) {
}
::view-transition-new(.slide-in) {
}
```

In the future, CSS libraries may add built-in animations using View Transition Classes to make this easier to use.

---

## Usage

### Animating an element on enter/exit

Enter/Exit Transitions trigger when a `<ViewTransition>` is added or removed by a component in a transition:

```jsx
function Child() {
  return (
    <ViewTransition enter="auto" exit="auto" default="none">
      <div>Hi</div>
    </ViewTransition>
  );
}
function Parent() {
  const [show, setShow] = useState();
  if (show) {
    return <Child />;
  }
  return null;
}
```

When `setShow` is called, `show` switches to `true` and the `Child` component is rendered. When `setShow` is called inside `startTransition`, and `Child` renders a `ViewTransition` before any other DOM nodes, an `enter` animation is triggered.

When `show` switches back to `false`, an `exit` animation is triggered.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video } from "./Video";
import videos from "./data";
function Item() {
  return (
    <ViewTransition enter="auto" exit="auto" default="none">
      <Video video={videos[0]} />
    </ViewTransition>
  );
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          startTransition(() => {
            setShowItem((prev) => !prev);
          });
        }}
      >
        {showItem ? "➖" : "➕"}
      </button>
      {showItem ? <Item /> : null}
    </>
  );
}
```

Show more

### Pitfall

#### Only top-level ViewTransitions animate on exit/enter

`<ViewTransition>` only activates exit/enter if it is placed _before_ any DOM nodes.

If there’s a `<div>` above `<ViewTransition>`, no exit/enter animations trigger:

```jsx
function Item() {
  return (
    <div>
      {" "}
      {/* 🚩<div> above <ViewTransition> breaks exit/enter */}
      <ViewTransition enter="auto" exit="auto" default="none">
        <Video video={videos[0]} />
      </ViewTransition>
    </div>
  );
}
```

This constraint prevents subtle bugs where too much or too little animates.

---

### Animating enter/exit with Activity

If you want to animate a component in and out while preserving its state, or pre-rendering content for an animation, you can use [`<Activity>`](/reference/react/Activity). When a `<ViewTransition>` inside an `<Activity>` becomes visible, the `enter` animation activates. When it becomes hidden, the `exit` animation activates:

```jsx
<Activity mode={isVisible ? "visible" : "hidden"}>
  <ViewTransition enter="auto" exit="auto">
    <Counter />
  </ViewTransition>
</Activity>
```

In this example, `Counter` has a counter with internal state. Try incrementing the counter, hiding it, then showing it again. The counter’s value is preserved while the sidebar animates in and out:

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { Activity, ViewTransition, useState, startTransition } from "react";
export default function App() {
  const [show, setShow] = useState(true);
  return (
    <div className="layout">
      <Toggle show={show} setShow={setShow} />
      <Activity mode={show ? "visible" : "hidden"}>
        <ViewTransition enter="auto" exit="auto" default="none">
          <Counter />
        </ViewTransition>
      </Activity>
    </div>
  );
}
function Toggle({ show, setShow }) {
  return (
    <button
      className="toggle"
      onClick={() => {
        startTransition(() => {
          setShow((s) => !s);
        });
      }}
    >
      {show ? "Hide" : "Show"}
    </button>
  );
}
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="counter">
      <h2>Counter</h2>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

Show more

Without `<Activity>`, the counter would reset to `0` every time the sidebar reappears.

---

### Animating a shared element

Normally, we don’t recommend assigning a name to a `<ViewTransition>` and instead let React assign it an automatic name. The reason you might want to assign a name is to animate between completely different components when one tree unmounts and another tree mounts at the same time, to preserve continuity.

```jsx
<ViewTransition name={UNIQUE_NAME}>
  <Child />
</ViewTransition>
```

When one tree unmounts and another mounts, if there’s a pair where the same name exists in the unmounting tree and the mounting tree, they trigger the “share” animation on both. It animates from the unmounting side to the mounting side.

Unlike an exit/enter animation this can be deeply inside the deleted/mounted tree. If a `<ViewTransition>` would also be eligible for exit/enter, then the “share” animation takes precedence.

If Transition first unmounts one side and then leads to a `<Suspense>` fallback being shown before eventually the new name being mounted, then no shared element transition happens.

App.jsVideo.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video, Thumbnail, FullscreenVideo } from "./Video";
import videos from "./data";
export default function Component() {
  const [fullscreen, setFullscreen] = useState(false);
  if (fullscreen) {
    return (
      <FullscreenVideo
        video={videos[0]}
        onExit={() => startTransition(() => setFullscreen(false))}
      />
    );
  }
  return (
    <Video
      video={videos[0]}
      onClick={() => startTransition(() => setFullscreen(true))}
    />
  );
}
```

Show more

### Note

If either the mounted or unmounted side of a pair is outside the viewport, then no pair is formed. This ensures that it doesn’t fly in or out of the viewport when something is scrolled. Instead it’s treated as a regular enter/exit by itself.

This does not happen if the same Component instance changes position, which triggers an “update”. Those animate regardless of whether one position is outside the viewport.

There is a known case where if a deeply nested unmounted `<ViewTransition>` is inside the viewport but the mounted side is not within the viewport, then the unmounted side animates as its own “exit” animation even if it’s deeply nested instead of as part of the parent animation.

### Pitfall

It’s important that there’s only one thing with the same name mounted at a time in the entire app. Therefore it’s important to use unique namespaces for the name to avoid conflicts. To ensure you can do this you might want to add a constant in a separate module that you import.

```jsx
export const MY_NAME = "my-globally-unique-name";
import {MY_NAME} from './shared-name';
...
<ViewTransition name={MY_NAME}>
```

---

### Animating reorder of items in a list

```jsx
items.map((item) => <Component key={item.id} item={item} />);
```

When reordering a list, without updating the content, the “update” animation triggers on each `<ViewTransition>` in the list if they’re outside a DOM node. Similar to enter/exit animations.

This means that this will trigger the animation on this `<ViewTransition>`:

```jsx
function Component() {
  return (
    <ViewTransition>
      <div>...</div>
    </ViewTransition>
  );
}
```

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video } from "./Video";
import videos from "./data";
export default function Component() {
  const [orderedVideos, setOrderedVideos] = useState(videos);
  const reorder = () => {
    startTransition(() => {
      setOrderedVideos((prev) => {
        return [...prev.sort(() => Math.random() - 0.5)];
      });
    });
  };
  return (
    <>
      <button onClick={reorder}>🎲</button>
      <div className="listContainer">
        {orderedVideos.map((video, i) => {
          return (
            <ViewTransition key={video.title}>
              <Video video={video} />
            </ViewTransition>
          );
        })}
      </div>
    </>
  );
}
```

Show more

However, this wouldn’t animate each individual item:

```jsx
function Component() {
  return (
    <div>
      <ViewTransition>...</ViewTransition>
    </div>
  );
}
```

Instead, any parent `<ViewTransition>` would cross-fade. If there is no parent `<ViewTransition>` then there’s no animation in that case.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video } from "./Video";
import videos from "./data";
export default function Component() {
  const [orderedVideos, setOrderedVideos] = useState(videos);
  const reorder = () => {
    startTransition(() => {
      setOrderedVideos((prev) => {
        return [...prev.sort(() => Math.random() - 0.5)];
      });
    });
  };
  return (
    <>
      <button onClick={reorder}>🎲</button>
      <ViewTransition>
        <div className="listContainer">
          {orderedVideos.map((video, i) => {
            return <Video video={video} key={video.title} />;
          })}
        </div>
      </ViewTransition>
    </>
  );
}
```

Show more

This means you might want to avoid wrapper elements in lists where you want to allow the Component to control its own reorder animation:

```jsx
items.map((item) => (
  <div>
    <Component key={item.id} item={item} />
  </div>
));
```

The above rule also applies if one of the items updates to resize, which then causes the siblings to resize, it’ll also animate its sibling `<ViewTransition>` but only if they’re immediate siblings.

This means that during an update, which causes a lot of re-layout, it doesn’t individually animate every `<ViewTransition>` on the page. That would lead to a lot of noisy animations which distracts from the actual change. Therefore React is more conservative about when an individual animation triggers.

### Pitfall

It’s important to properly use keys to preserve identity when reordering lists. It might seem like you could use “name”, shared element transitions, to animate reorders but that would not trigger if one side was outside the viewport. To animate a reorder you often want to show that it went to a position outside the viewport.

---

### Animating from Suspense content

Like any Transition, React waits for data and new CSS (`<link rel="stylesheet" precedence="...">`) before running the animation. In addition to this, ViewTransitions also wait up to 500ms for new fonts to load before starting the animation to avoid them flickering in later. For the same reason, an image wrapped in ViewTransition will wait for the image to load.

If it’s inside a new Suspense boundary instance, then the fallback is shown first. After the Suspense boundary fully loads, it triggers the `<ViewTransition>` to animate the reveal to the content.

There are two ways to animate Suspense boundaries depending on where you place the `<ViewTransition>`:

**Update:**

```jsx
<ViewTransition>
  <Suspense fallback={<A />}>
    <B />
  </Suspense>
</ViewTransition>
```

In this scenario when the content goes from A to B, it’ll be treated as an “update” and apply that class if appropriate. Both A and B will get the same view-transition-name and therefore they’re acting as a cross-fade by default.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition, Suspense } from "react";
import { Video, VideoPlaceholder } from "./Video";
import { useLazyVideoData } from "./data";
function LazyVideo() {
  const video = useLazyVideoData();
  return <Video video={video} />;
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          startTransition(() => {
            setShowItem((prev) => !prev);
          });
        }}
      >
        {showItem ? "➖" : "➕"}
      </button>
      {showItem ? (
        <ViewTransition>
          <Suspense fallback={<VideoPlaceholder />}>
            <LazyVideo />
          </Suspense>
        </ViewTransition>
      ) : null}
    </>
  );
}
```

Show more

**Enter/Exit:**

```jsx
<Suspense
  fallback={
    <ViewTransition>
      <A />
    </ViewTransition>
  }
>
  <ViewTransition>
    <B />
  </ViewTransition>
</Suspense>
```

In this scenario, these are two separate ViewTransition instances each with their own `view-transition-name`. This will be treated as an “exit” of the `<A>` and an “enter” of the `<B>`.

You can achieve different effects depending on where you choose to place the `<ViewTransition>` boundary.

---

### Opting-out of an animation

Sometimes you’re wrapping a large existing component, like a whole page, and you want to animate some updates, such as changing the theme. However, you don’t want it to opt-in all updates inside the whole page to cross-fade when they’re updating. Especially if you’re incrementally adding more animations.

You can use the class “none” to opt-out of an animation. By wrapping your children in a “none” you can disable animations for updates to them while the parent still triggers.

```jsx
<ViewTransition>
  <div className={theme}>
    <ViewTransition update="none">{children}</ViewTransition>
  </div>
</ViewTransition>
```

This will only animate if the theme changes and not if only the children update. The children can still opt-in again with their own `<ViewTransition>` but at least it’s manual again.

---

### Customizing animations

By default, `<ViewTransition>` includes the default cross-fade from the browser.

To customize animations, you can provide props to the `<ViewTransition>` component to specify which animations to use, based on how the `<ViewTransition>` activates.

For example, we can slow down the default cross fade animation:

```jsx
<ViewTransition default="slow-fade">
  <Video />
</ViewTransition>
```

And define slow-fade in CSS using view transition classes:

```jsx
::view-transition-old(.slow-fade) {
animation-duration: 500ms;
}
::view-transition-new(.slow-fade) {
animation-duration: 500ms;
}
```

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video } from "./Video";
import videos from "./data";
function Item() {
  return (
    <ViewTransition default="slow-fade">
      <Video video={videos[0]} />
    </ViewTransition>
  );
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          startTransition(() => {
            setShowItem((prev) => !prev);
          });
        }}
      >
        {showItem ? "➖" : "➕"}
      </button>
      {showItem ? <Item /> : null}
    </>
  );
}
```

Show more

In addition to setting the `default`, you can also provide configurations for `enter`, `exit`, `update`, and `share` animations.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video } from "./Video";
import videos from "./data";
function Item() {
  return (
    <ViewTransition enter="slide-in" exit="slide-out">
      <Video video={videos[0]} />
    </ViewTransition>
  );
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          startTransition(() => {
            setShowItem((prev) => !prev);
          });
        }}
      >
        {showItem ? "➖" : "➕"}
      </button>
      {showItem ? <Item /> : null}
    </>
  );
}
```

Show more

---

### Customizing animations with types

You can use the [`addTransitionType`](/reference/react/addTransitionType) API to add a class name to the child elements when a specific transition type is activated for a specific activation trigger. This allows you to customize the animation for each type of transition.

For example, to customize the animation for all forward and backward navigations:

```jsx
<ViewTransition
  default={{
    "navigation-back": "slide-right",
    "navigation-forward": "slide-left",
  }}
>
  <div>...</div>
</ViewTransition>;
// in your router:
startTransition(() => {
  addTransitionType("navigation-" + navigationType);
});
```

When the ViewTransition activates a “navigation-back” animation, React will add the class name “slide-right”. When the ViewTransition activates a “navigation-forward” animation, React will add the class name “slide-left”.

In the future, routers and other libraries may add support for standard view-transition types and styles.

App.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import {
  ViewTransition,
  addTransitionType,
  useState,
  startTransition,
} from "react";
import { Video } from "./Video";
import videos from "./data";
function Item() {
  return (
    <ViewTransition
      enter={{
        "add-video-back": "slide-in-back",
        "add-video-forward": "slide-in-forward",
      }}
      exit={{
        "remove-video-back": "slide-in-forward",
        "remove-video-forward": "slide-in-back",
      }}
    >
      <Video video={videos[0]} />
    </ViewTransition>
  );
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  return (
    <>
      <div className="button-container">
        <button
          onClick={() => {
            startTransition(() => {
              if (showItem) {
                addTransitionType("remove-video-back");
              } else {
                addTransitionType("add-video-back");
              }
              setShowItem((prev) => !prev);
            });
          }}
        >
          ⬅️
        </button>
        <button
          onClick={() => {
            startTransition(() => {
              if (showItem) {
                addTransitionType("remove-video-forward");
              } else {
                addTransitionType("add-video-forward");
              }
              setShowItem((prev) => !prev);
            });
          }}
        >
          ➡️
        </button>
      </div>
      {showItem ? <Item /> : null}
    </>
  );
}
```

Show more

---

### Animating with JavaScript

While [View Transition Classes](#view-transition-class) let you define animations with CSS, sometimes you need imperative control over the animation. The `onEnter`, `onExit`, `onUpdate`, and `onShare` callbacks give you direct access to the view transition pseudo-elements so you can animate them using the [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API).

Each callback receives an `instance` with `.old` and `.new` properties representing the view transition pseudo-elements. You can call `.animate()` on them just like you would on a DOM element:

```jsx
<ViewTransition
  onEnter={(instance) => {
    const anim = instance.new.animate(
      [{ transform: "scale(0.8)" }, { transform: "scale(1)" }],
      { duration: 300, easing: "ease-out" },
    );
    return () => anim.cancel();
  }}
>
  <div>...</div>
</ViewTransition>
```

This allows you to combine CSS-driven animations and JavaScript-driven animations.

In the following example, the default cross-fade is handled by CSS, and the slide animations are driven by JavaScript in the `onEnter` and `onExit` animations:

App.jsanimations.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import { ViewTransition, useState, startTransition } from "react";
import { Video } from "./Video";
import videos from "./data";
import { SLIDE_IN, SLIDE_OUT } from "./animations";
function Item() {
  return (
    <ViewTransition
      default="none"
      /* CSS driven cross fade defaults */
      enter="auto"
      exit="auto"
      /* JS driven slide animations */
      onEnter={(instance) => {
        const anim = instance.new.animate(SLIDE_IN, {
          duration: 500,
          easing: "ease-out",
        });
        return () => anim.cancel();
      }}
      onExit={(instance) => {
        const anim = instance.old.animate(SLIDE_OUT, {
          duration: 300,
          easing: "ease-in",
        });
        return () => anim.cancel();
      }}
    >
      <Video video={videos[0]} />
    </ViewTransition>
  );
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  return (
    <>
      <button
        onClick={() => {
          startTransition(() => {
            setShowItem((prev) => !prev);
          });
        }}
      >
        {showItem ? "➖" : "➕"}
      </button>
      {showItem ? <Item /> : null}
    </>
  );
}
```

Show more

### Note

#### Always clean up View Transition Events

View Transition Events should always return a cleanup function:

```jsx
<ViewTransition
onEnter={(instance) => {
const anim = instance.new.animate(
SLIDE_IN,
{duration: 500, easing: 'ease-out'}
);
return () => anim.cancel();
}}
>
```

This allows the browser to cancel the animation when the View Transition is interrupted.

---

### Animating transition types with JavaScript

You can use `types` passed to `ViewTransition` events to conditionally apply different animations based on how the Transition was triggered.

```jsx
<ViewTransition
onEnter={(instance, types) => {
const duration = types.includes('fast') ? 150 : 2000;
const anim = instance.new.animate(
SLIDE_IN,
{duration: duration, easing: 'ease-out'}
);
return () => anim.cancel();
}}
>
```

This example calls [`addTransitionType`](/reference/react/addTransitionType) to mark a Transition as “fast” and then adjust the animation duration:

App.jsanimations.js

App.js

ReloadClear[Fork](https://codesandbox.io/api/v1/sandboxes/define?undefined&environment=create-react-app "Open in CodeSandbox")

```jsx
import {
  ViewTransition,
  useState,
  startTransition,
  addTransitionType,
} from "react";
import { Video } from "./Video";
import videos from "./data";
import { SLIDE_IN, SLIDE_OUT } from "./animations";
function Item() {
  return (
    <ViewTransition
      onEnter={(instance, types) => {
        const duration = types.includes("fast") ? 150 : 2000;
        const anim = instance.new.animate(SLIDE_IN, {
          duration: duration,
          easing: "ease-out",
        });
        return () => anim.cancel();
      }}
      onExit={(instance, types) => {
        const duration = types.includes("fast") ? 150 : 500;
        const anim = instance.old.animate(SLIDE_OUT, {
          duration: duration,
          easing: "ease-in",
        });
        return () => anim.cancel();
      }}
    >
      <Video video={videos[0]} />
    </ViewTransition>
  );
}
export default function Component() {
  const [showItem, setShowItem] = useState(false);
  const [isFast, setIsFast] = useState(false);
  return (
    <>
      <div>
        Fast:{" "}
        <input
          type="checkbox"
          onChange={() => {
            setIsFast((f) => !f);
          }}
          value={isFast}
        ></input>
      </div>
      <br />
      <button
        onClick={() => {
          startTransition(() => {
            if (isFast) {
              addTransitionType("fast");
            }
            setShowItem((prev) => !prev);
          });
        }}
      >
        {showItem ? "➖" : "➕"}
      </button>
      {showItem ? <Item /> : null}
    </>
  );
}
```

Show more

---

### Building View Transition enabled routers

React waits for any pending Navigation to finish to ensure that scroll restoration happens within the animation. If the Navigation is blocked on React, your router must unblock in `useLayoutEffect` since `useEffect` would lead to a deadlock.

If a `startTransition` is started from the legacy popstate event, such as during a “back”-navigation then it must finish synchronously to ensure scroll and form restoration works correctly. This is in conflict with running a View Transition animation. Therefore, React will skip animations from popstate and animations won’t run for the back button. You can fix this by upgrading your router to use the Navigation API.

---

## Troubleshooting

### My `<ViewTransition>` is not activating

`<ViewTransition>` only activates if it is placed before any DOM node:

```jsx
function Component() {
  return (
    <div>
      <ViewTransition>Hi</ViewTransition>
    </div>
  );
}
```

To fix, ensure that the `<ViewTransition>` comes before any other DOM nodes:

```jsx
function Component() {
  return (
    <ViewTransition>
      <div>Hi</div>
    </ViewTransition>
  );
}
```

### I’m getting an error “There are two `<ViewTransition name=%s>` components with the same name mounted at the same time.”

This error occurs when two `<ViewTransition>` components with the same `name` are mounted at the same time:

```jsx
function Item() {
  // 🚩 All items will get the same "name".
  return <ViewTransition name="item">...</ViewTransition>;
}
function ItemList({ items }) {
  return (
    <>
      {items.map((item) => (
        <Item key={item.id} />
      ))}
    </>
  );
}
```

This will cause the View Transition to error. In development, React detects this issue to surface it and logs two errors:

Console

There are two `<ViewTransition name=%s>` components with the same name mounted at the same time. This is not supported and will cause View Transitions to error. Try to use a more unique name e.g. by using a namespace prefix and adding the id of an item to the name.
at Item
at ItemList

The existing `<ViewTransition name=%s>` duplicate has this stack trace.
at Item
at ItemList

To fix, ensure that there’s only one `<ViewTransition>` with the same name mounted at a time in the entire app by ensuring the `name` is unique, or adding an `id` to the name:

```jsx
function Item({ id }) {
  // ✅ All items will get a unique name.
  return <ViewTransition name={`item-${id}`}>...</ViewTransition>;
}
function ItemList({ items }) {
  return (
    <>
      {items.map((item) => (
        <Item key={item.id} item={item} />
      ))}
    </>
  );
}
```

[Previous<Activity>](/reference/react/Activity)[NextAPIs](/reference/react/apis)
