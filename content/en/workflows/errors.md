---
title: Error Management
description: ""
position: 4.95
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

_What happens if an exception throws during the processing of a task dispatched by a workflow?_

- this exception is caught by the task worker, and the the task will automaticaly be retried based on the policy described in its [`getDurationBeforeRetry`](/tasks/failure#automatic-retry) method
- when the `getDurationBeforeRetry` returns `null`, the retries stop and the task is now failed for the workflow.
    - if the task was dispatched asynchronously (using `async` function), it won't impact the workflow processing
    - if the task was dispatched synchronously, then an `FailedDeferredException` will throw in the workflow. Then:
        - if a try / catch wraps the task, the workflow will continue
        - if not, then the workflow will stop. From there, we have three possibilities to clean up the situation:
            - cancel the workflow entirely
            - fix and retry the failed task. Once the task finally completed, the workflow will resume.
            - update the workflow to add a `try / catch` statement ans retry the workflow itself



<code-group><code-block label="Java" active>

```java
// an exception thrown in the method
// won't impact the workflow
async(task, t -> t.method(parameters);

// an exception thrown in the method
// will throw a FailedDeferredException here
task.method(parameters);

async(() -> {
    ...
    // an exception thrown in the method
    // will throw a FailedDeferredException here
    // and stop only this part of the workflow
    task.method();
    ....
});

// an exception thrown in the method
// will be caught and the workflow will continue
try {
    task.method(parameters);
} catch(FailedDeferredException e) {
    ...
}
```
</code-block><code-block label="Kotlin">

```kotlin
// an exception thrown during the execution
// of the method won't impact the workflow
async(task) { method(parameters) }

// an exception thrown in the method
// will throw a FailedDeferredException here
task.method(parameters)

async {
    ...
    // an exception thrown in the method
    // will throw a FailedDeferredException here
    // and stop only this part of the workflow
    task.method(parameters)
    ...
}

// an exception thrown in the method
// will be caught and the workflow will continue
try {
    task.method(parameters)
} catch(e: FailedDeferredException) {
    ...
}
```
</code-block></code-group>

Notes:
- if the workflow is itself a child-workflow, and the failing non-caught synchronous task is on the main execution path of the workflow (not within an `async`), then this workflow will appear as failed for its parent (and maybe for the parent' s parent, and so on)
- if a asynchronous task fails, and we apply later the `await()` method on it, the `FailedDeferredException` will throw:

    <code-group><code-block label="Java" active>

    ```java
    // an exception thrown in the method
    // won't impact the workflow
    Deferred<*> deferred = async(task, t -> t.method(parameters);

    ...

    // a FailedDeferredException throws
    // and the workflow will stop here
    deferred.await();
    ```
    </code-block><code-block label="Kotlin">

    ```kotlin
    // an exception thrown during the execution
    // of the method won't impact the workflow
    aval deferred = sync(task) { method(parameters) }

    ...

    // a FailedDeferredException throws
    // and the workflow will stop here
    deferred.await()
    ```
    </code-block></code-group>


- the `WorkflowRunException` contains a `causeError` property which is an object describing the underlying exception (name, message, stacktrace...)

<alert type="info">

Try / catch in workflows should be used only to manage situations when we need to move on despite an exepected failure. If we expect some failures in our task, a good practice is to catch them directly in the task and send back a status object as a result.  

</alert>

<alert type="warning">

[`CanceledDeferredException`](/workflows/cancellation) and `FailedDeferredException` are the only exceptions relevant in workflows. You must not catch any other exception. 

</alert>