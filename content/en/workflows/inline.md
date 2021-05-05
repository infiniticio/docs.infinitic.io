---
title: Inline Tasks
description: ""
position: 4.4
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

As stated previously, workflow's code is processed repeatedly, so it must NOT contain any action with side-effects or whose value changes with time. When this is the case, we must put those actions within a task. For simple actions (as getting a random number or the current date), it can be tedious to do.

The `inline` function provides an easy way to "inline" such a task. The provided lambda is processed by the workflow executor only the first time. After that, the returned value will be found directly from the workflow history.

<alert type="info">

There is no retry mechanism for inlined tasks, so the `inline` function should be used only if the lambda can not fail.

</alert>

For example, we can use the current date in a workflow like this:

<code-group><code-block label="Java" active>

```java
...
Date now = inline(() -> new Date());
...
```

</code-block><code-block label="Kotlin">

```kotlin
...
val now = inline { Date() }
...
```

</code-block></code-group>

<img src="/inline-function@2x.png" class="img" width="640" height="640" alt=""/>
