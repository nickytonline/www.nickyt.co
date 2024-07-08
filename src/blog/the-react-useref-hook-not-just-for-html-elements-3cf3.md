---json
{
  "title": "The React useRef hook: Not Just for HTML Elements",
  "excerpt": "In React, state manages data that can trigger re-renders. But what if you need a way to directly...",
  "date": "2024-07-08T04:38:17.388Z",
  "tags": [
    "react",
    "javascript",
    "webdev"
  ],
  "cover_image": "https://www.nickyt.co/images/posts/_cdn-cgi_image_width=1000,height=420,fit=cover,gravity=auto,format=auto_https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fxllbi42t0tt7qanarqac.png",
  "canonical_url": "https://dev.to/opensauced/the-react-useref-hook-not-just-for-html-elements-3cf3",
  "reading_time_minutes": 2,
  "template": "post"
}
---

In React, state manages data that can trigger re-renders. But what if you need a way to directly access document object model (DOM) elements or persist values that shouldn't cause re-renders? That's where the [useRef](https://react.dev/reference/react/useRef) hook comes in.

Typically, you'd do something like this.

```typescript
{% raw %}
import { useEffect, useRef } from "react";

export const SomeComponent = () => {
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [firstInputRef.current]);

  return (
    <form>
      <label>
        Name:
        <input type="text" ref={firstInputRef}/>
      </label>
    </form>
  );
}
{% endraw %}
```

1. We create a `useRef` named `firstInputRef` and initialize it with null (as it won't point to an element yet).
1. The `useEffect` hook runs after the component renders.
1. Inside `useEffect`, we check if `firstInputRef.current` exists (it will be the actual DOM element after the initial render). If it does, we call `focus()` to set focus on the input.
1. The dependency array `[firstInputRef.current]` ensures `useEffect` only runs once when the reference changes (i.e., after the initial render).

In the above example, the `useRef` hook creates a reference object that holds a mutable value, the HTML element, but this value can be anything, from a DOM element to a plain object. Unlike state, changes to a `useRef` won't trigger a re-render of your component.

Recently, I was working on Open Sauced's [StarSearch](https://opensauced.pizza/blog/open-source-insights-with-starsearch), a Copilot for git history feature we released at the end of May 2024.

{% embed "https://dev.to/opensauced/introducing-starsearch-unlock-the-copilot-for-git-history-5ddb" %}

The ask was to be able to start a new StarSearch conversation. To do so, I had to stop the current conversation. If you've worked with OpenAI or similar APIs, they typically stream a [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) as a response.

I initially had this feature working, but ran into issues if the response started to stream. The solution, create a reference to the readable stream via the `useRef` hook. You can see these changes in the pull request (PR) below

{% embed "https://github.com/open-sauced/app/pull/3637" %}

So now, if someone presses the create a new conversation button, I cancel the current streaming response from StarSearch, e.g.

```typescript
{% raw %}
  const streamRef = useRef<ReadableStreamDefaultReader<string>>();
  
...

  const onNewChat = () => {
    streamRef.current?.cancel();
    ...
  };

...
    
{% endraw %}
```

1. We create a `useRef` named `streamRef` to hold the [ReadableStreamDefaultReader](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader).
1. The `onNewChat` function checks if `streamRef.current` exists (meaning a stream is ongoing).
1. If a stream exists, we call `cancel()` on `streamRef.current` to stop it before starting a new conversation.

`useRef` was the perfect solution for my use case. Maybe you'll find the `useRef` hook useful for something other than referencing an HTML element.

Stay saucy peeps!

If you would like to know more about my work in open source, [follow me on OpenSauced](https://oss.fyi/nickytonline).
