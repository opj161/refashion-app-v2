[API Reference](/reference/react)

[APIs](/reference/react/apis)

# cacheSignal

### React Server Components

`cacheSignal` is currently only used with [React Server Components](/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components).

`cacheSignal` allows you to know when the `cache()` lifetime is over.

```jsx
const signal = cacheSignal();
```

- [Reference](#reference)
  - [`cacheSignal`](#cachesignal)
- [Usage](#usage)
  - [Cancel in-flight requests](#cancel-in-flight-requests)
  - [Ignore errors after React has finished rendering](#ignore-errors-after-react-has-finished-rendering)

---

## Reference

### `cacheSignal`

Call `cacheSignal` to get an `AbortSignal`.

```jsx
import { cacheSignal } from "react";
async function Component() {
  await fetch(url, { signal: cacheSignal() });
}
```

When React has finished rendering, the `AbortSignal` will be aborted. This allows you to cancel any in-flight work that is no longer needed.
Rendering is considered finished when:

- React has successfully completed rendering
- the render was aborted
- the render has failed

#### Parameters

This function does not accept any parameters.

#### Returns

`cacheSignal` returns an `AbortSignal` if called during rendering. Otherwise `cacheSignal()` returns `null`.

#### Caveats

- `cacheSignal` is currently for use in [React Server Components](/reference/rsc/server-components) only. In Client Components, it will always return `null`. In the future it will also be used for Client Component when a client cache refreshes or invalidates. You should not assume it’ll always be null on the client.
- If called outside of rendering, `cacheSignal` will return `null` to make it clear that the current scope isn’t cached forever.

---

## Usage

### Cancel in-flight requests

Call `cacheSignal` to abort in-flight requests.

```jsx
import { cache, cacheSignal } from "react";
const dedupedFetch = cache(fetch);
async function Component() {
  await dedupedFetch(url, { signal: cacheSignal() });
}
```

### Pitfall

You can’t use `cacheSignal` to abort async work that was started outside of rendering e.g.

```jsx
import { cacheSignal } from "react";
// 🚩 Pitfall: The request will not actually be aborted if the rendering of `Component` is finished.
const response = fetch(url, { signal: cacheSignal() });
async function Component() {
  await response;
}
```

### Ignore errors after React has finished rendering

If a function throws, it may be due to cancellation (e.g. the Database connection has been closed). You can use the `aborted` property to check if the error was due to cancellation or a real error. You may want to ignore errors that were due to cancellation.

```jsx
import { cacheSignal } from "react";
import { queryDatabase, logError } from "./database";
async function getData(id) {
  try {
    return await queryDatabase(id);
  } catch (x) {
    if (!cacheSignal()?.aborted) {
      // only log if it's a real error and not due to cancellation
      logError(x);
    }
    return null;
  }
}
async function Component({ id }) {
  const data = await getData(id);
  if (data === null) {
    return <div>No data available</div>;
  }
  return <div>{data.name}</div>;
}
```

[Previouscache](/reference/react/cache)[NextcaptureOwnerStack](/reference/react/captureOwnerStack)
