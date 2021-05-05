---
title: Fan-In
description: ""
position: 4.9
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

The following functions:
- async (on task / child workflows)
- receive() (on channels)
- timer() 
are all asynchronous instructions that do not block the workflow and return a `Deferred<T>` 

A `Deferred` has some useful methods:

- `await()`: waits for the completion (or cancellation) of the deferred and returns its result
- `isCompleted()`: boolean indicating if this `Deferred` is completed by now
- `isCanceled()`: boolean indicating if this `Deferred` is canceled by now
- `isOngoing()`: boolean indicating if this `Deferred` is still ongoing

But deferreds can also be combined according to arbitrary logical combinations to create fan-in structure. 

For example:

<code-group><code-block label="Kotlin" active>

```kotlin
// asynchronous task processing
val d1 = async(task) { method(parameters1) } 
// asynchronous wait for 42 minutes
val d2 = timer(Duration.ofMinutes(42))
// asynchronous wait for an external event
val d3 = eventChannel.receive() 

// waiting for at least 1 deferred to complete
(d1 or d2 or d3).await()

// waiting for d1 and (d2 or d3) to complete
(d1 and (d2 or d3)).await()

// waiting for all 3 tasks to complete
(d1 and d2 and d3).await()
```
</code-block></code-group>

The return value depends on the operator:
- `or` will return the return value of the *first* completed deferred
- `and` will return the list of all completed deferred

