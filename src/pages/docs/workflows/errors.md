---
title: Errors
description: This page discusses strategies for error handling within workflows, including retrying failed tasks and managing exceptions, to ensure robust workflow execution.
---

Handling errors in a distributed system is typically complex. Infinitic simplifies this by automatically tracking error chains and allowing you to handle errors directly within the workflow.


## Error when processing a task

Tasks are processed within workers. If an exception occurs while processing a task, it is caught by the worker, and the task is automatically retried according to the [retry policy](/docs/services/syntax#task-retries).

![Error when processing a task](/img/error-task@2x.png)

If all retries fail, the worker notifies the workflow of the task failure with a `WorkerException`. This exception includes the following properties:

| Property               | Type            | Description                                    |
| ---------------------- | --------------- | ---------------------------------------------- |
| `workerName`         | String          | Name of the worker where the exception occured |
| `name`               | String          | Exception name                                 |
| `message`            | String          | Exception message                              |
| `stackTraceToString` | String          | String representation of the exception stack trace     |
| `cause`              | WorkerException | (optional) Cause of the exception                    |

{% callout type="note"  %}

Serializing exceptions can be error-prone. Therefore, we "normalize" them into a `WorkerException` format.

{% /callout  %}

What happens next in the workflow depends on whether it is waiting for the task to complete:

### If the workflow expects the task result

This situation occurs when a task is dispatched synchronously or when [awaiting](/docs/workflows/deferred#waiting-for-completion) the result of a `Deferred<T>`. Here, a `TaskFailedException` is thrown within the workflow, containing these properties:

| Property            | Type            | Description        |
| ------------------- | --------------- | ------------------ |
| `taskName`        | String          | Task name          |
| `taskId`          | String          | Task id            |
| `methodName`      | String          | Method called      |
| `workerException` | WorkerException | Cause of task failure |

![Error when processing a sync task](/img/error-task-sync@2x.png)

If the client expects this workflow's result, it will encounter a `WorkflowFailedException`:

![Error when processing a sync task](/img/error-task-sync-client@2x.png)


Additionally, if another workflow expects this workflow's result, it will also encounter a `WorkflowFailedException`:

![Error when processing a sync task](/img/error-task-sync-child@2x.png)

The `WorkflowFailedException` includes these properties:

| Property              | Type              | Description            |
| --------------------- | ----------------- | ---------------------- |
| `workflowName`      | String            | Workflow name          |
| `workflowId`        | String            | Workflow id            |
| `methodName`        | String            | Method called          |
| `methodRunId`       | String            | Method run id          |
| `deferredException` | DeferredException | Cause of workflow failure |

In the example above, `deferredException` would be a `TaskFailedException`.

### If the workflow does not expect the task result

This occurs when a task is dispatched [asynchronously](/docs/workflows/parallel#asynchronous-tasks) or is part of a method running [in parallel](/docs/workflows/parallel#parallel-methods).

![Error when processing an async task](/img/error-task-async@2x.png)

In this case, the task fails, but the workflow continues without error, as the failed task is not on the main execution path. If the workflow later waits for the result, a `TaskFailedException` will be thrown at that time:

![Error when processing an async task](/img/error-task-async-2@2x.png)

## Errors due to cancellation and more

Failures of synchronous tasks result in `TaskFailedException`, while failures of synchronous child workflows result in `WorkflowFailedException`. Similar errors arise from cancellation and other scenarios:

| Name                            | When it happens                                                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TaskFailedException`         | The task has failed after all planned retries have failed.               |
| `TaskCanceledException`       | The task has been canceled.                                              |
| `WorkflowFailedException`     | The targeted workflow has a failed synchronous task or child workflow    |
| `WorkflowCanceledException`   | The targeted workflow has been canceled.                                 |
| `WorkflowUnknownException`    | The targeted workflow never existed or is already completed or canceled. This can occur when dispatching a method on a stub created by `getWorkflowById`.  |
| `WorkflowTaskFailedException` | An error occurred directly within the workflow code.                     |

{% callout type="note"  %}

All these exceptions inherit from `io.infinitic.exceptions.DeferredException`

{% /callout  %}

## Try/catch in workflows

Use try/catch of `DeferredException` in workflows to ensure that the workflow continues even in case of Service failure (i.e. after all the retries have failed). 


{% codes %}

```java
String str;
try {
    // synchronous call of HelloService::sayHello
    str = helloService.sayHello(name);
} catch (DeferredException e) {
    // react
    ...
}
```

```kotlin
// synchronous call of HelloService::sayHello
val str = try {
    helloService.sayHello(name)
} catch (e: DeferredException) {
    // react
    ...
}
```

{% /codes %}

Remember, for expected failures, it's a better practice to handle them within the Service and return a status object.

{% callout %}

A caught `DeferredException` in a workflow cannot be resumed, as the workflow has already "moved on".

{% /callout  %}

{% callout type="warning" %}

`DeferredException` and its subclasses are the only relevant exceptions in workflows. Do not catch any other exceptions. Specifically, actual exceptions thrown in service or child-workflow workers are wrapped in the `DeferredException`. It is not meaningful to try to catch these exceptions directly.



