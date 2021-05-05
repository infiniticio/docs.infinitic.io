---
title: Cancellation Management
description: ""
position: 4.96
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

_What happens if a task dispatched by a workflow is canceled?_

- if the task was dispatched asynchronously (using `async` function), it won't impact the workflow processing
- if the task was dispatched synchronously, then an `CanceledDeferredException` will throw in the workflow. Then:
    - if the `CanceledDeferredException` is caught within the workflow, it will continue
    - if not, then the workflow will stop. From there, we have two possibilities to clean up the situation:
        - cancel the workflow entirely
        - update the workflow to add a `try / catch` statement and retry the workflow itself


<code-group><code-block label="Java" active>

```java
// a cancellation of this task
// won't impact the workflow
async(task, t -> t.method(parameters);

// a cancellation of this task
// will throw a CanceledDeferredException here
task.method(parameters);

async(() -> {
    ...
    // a cancellation of this task
    // will throw a CanceledDeferredException here
    // and stop only this part of the workflow
    task.method();
    ....
});

// a cancellation of this task
// will be caught and the workflow will continue
try {
    task.method(parameters);
} catch(CanceledDeferredException e) {
    ...
}
```
</code-block><code-block label="Kotlin">

```kotlin
// a cancellation of this task
// won't impact the workflow
async(task) { method(parameters) }

// a cancellation of this task
// will throw a CanceledDeferredException here
task.method(parameters)

async {
    ...
    // a cancellation of this task
    // will throw a CanceledDeferredException here
    // and stop only this part of the workflow
    task.method(parameters)
    ...
}

// a cancellation of this task
// will be caught and the workflow will continue
try {
    task.method(parameters)
} catch(e: FailedDeferredException) {
    ...
}
```
</code-block></code-group>

Notes:
- if the workflow is itself a child-workflow, and the canceled non-caught synchronous task is on the main execution path of the workflow (not within an `async`), then this workflow will appear as failed for its parent (and maybe for the parent' s parent, and so on)
- if a asynchronous task is canceled, and we apply later the `await()` method on it, the `CanceledDeferredException` will throw:

    <code-group><code-block label="Java" active>

    ```java
    // a cancellation of this task
    // won't impact the workflow
    Deferred<*> deferred = async(task, t -> t.method(parameters);

    ...

    // a CanceledDeferredException throws
    // and the workflow will stop here
    deferred.await();
    ```
    </code-block><code-block label="Kotlin">

    ```kotlin
    // a cancellation of this task
    // won't impact the workflow
    aval deferred = sync(task) { method(parameters) }

    ...

    // a CanceledDeferredException throws
    // and the workflow will stop here
    deferred.await()
    ```
    </code-block></code-group>


<alert type="warning">

`CanceledDeferredException` and [`FailedDeferredException`](/workflows/errors) are the only exceptions relevant in workflows. You must not catch any other exception. 

</alert>