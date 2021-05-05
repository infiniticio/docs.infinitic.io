---
title: Waiting
description: ""
position: 4.5
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

The `timer` function lets us suspend the execution of a workflow for a duration or up to a chosen date:

<code-group><code-block label="Java" active>

```java
...
Instant now = timer(Duration.ofHours(48)).await()
...
```

</code-block><code-block label="Kotlin">

```kotlin
...
val now = timer(Duration.ofHours(48)).await()
...
```

</code-block></code-group>

<img src="/timer-function@2x.png" class="img" width="640" height="640" alt=""/>

<alert type="info">

No resource dedicated to this workflow is kept running during this waiting time.

</alert>

The `timer` function can receive:

- a `java.time.Duration` object for waiting for a specific duration (for example, 2 days)
- a `java.time.Instant` object for waiting up to a specific instant (for example, the 3rd of April 2021 at 9 pm). The time must be provided according to UTC.

<alert type="warning">

If the provided duration is negative or the provided Instant is in the past, the `await()` method returns immediately.

</alert>

The `timer` function immediately starts and returns a `Deferred<Instant>`. The workflow is blocked only by the `await()` method. In the example below, if the `sayHello` method lasts for 40 seconds, then the `wait` method will last for 20 seconds.

<code-group><code-block label="Java" active>

```java
Deferred<Instant> timer = timer(Duration.ofSeconds(60));

helloWorldService.sayHello(name);

Instant now = timer.await();
```

</code-block><code-block label="Kotlin">

```kotlin
val timer = timer(Duration.ofHours(48))

helloWorldService.sayHello(name)

val now = timer.await()
```

</code-block></code-group>

<img src="/timer-example@2x.png" class="img" width="640" height="640" alt=""/>

The result of the `await()` method is an Instant object representing the moment this timer was completed according to the workflow engine (so when the workflow resumes from the `await()`, the `Instant` returned is the current time).

