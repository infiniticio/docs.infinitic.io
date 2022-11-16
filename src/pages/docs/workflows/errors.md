---
title: Errors
description: ""
---

Managing errors in a distributed system are usually tedious. Infinitic makes our life easier, by automatically keeping trace of the chain of errors. Infinitic even let us code the reaction to errors directly from the workflow!

## Error when processing a task

Tasks are processed within workers. If an exception is thrown while processing a task, the exception is caught by the worker and the task is automatically retried according to the [retry policy](/docs/services/syntax#task-retries).

![Error when processing a task](/img/error-task@2x.png)

Once all retries have failed, the worker tells the workflow the task has failed with a `WorkerException`. This exception has the properties below:

| Property             | Type            | Description                                    |
| -------------------- | --------------- | ---------------------------------------------- |
| `workerName`         | String          | name of the worker where the exception occured |
| `name`               | String          | exception name                                 |
| `message`            | String          | exception message                              |
| `stackTraceToString` | String          | string version of the exception stacktrace     |
| `cause`              | WorkerException | (optional) exception cause                     |

{% callout type="note"  %}

Serializing exceptions is error-prone. That's why we "normalize" them into a `WorkerException` format.

{% /callout  %}

What happens in the workflow depends on whether it is waiting for the task to be completed or not:

### If the workflow expects the task result

This is the case when we dispatch a task synchronously and also when we are [waiting the result](/docs/workflows/deferred#waiting-for-completion) of a `Deferred<T>`. In this case, a `FailedTaskException` is thrown inside the workflow with the properties below:

| Property          | Type            | Description        |
| ----------------- | --------------- | ------------------ |
| `taskName`        | String          | task name          |
| `taskId`          | String          | task id            |
| `methodName`      | String          | method called      |
| `workerException` | WorkerException | task failure cause |

![Error when processing a sync task](/img/error-task-sync@2x.png)

Also, if another client or workflow expects the result of this workflow, it will see a `FailedWorkflowException`:

![Error when processing a sync task](/img/error-task-sync-child@2x.png)

`FailedWorkflowException` has the properties below:

| Property            | Type              | Description            |
| ------------------- | ----------------- | ---------------------- |
| `workflowName`      | String            | workflow name          |
| `workflowId`        | String            | workflow id            |
| `methodName`        | String            | method called          |
| `methodRunId`       | String            | method run id          |
| `deferredException` | DeferredException | workflow failure cause |

In the example above, `deferredException` would be a `FailedTaskException`.

### If the workflow does not expect the task result

This is the case, when we dispatch a task [asynchronously](/docs/workflows/parallel#asynchronous-tasks), or for a task in another method [running in parallel](/docs/workflows/parallel#parallel-methods).

![Error when processing an async task](/img/error-task-async@2x.png)

In this case, the task is failed, but the workflow continues without error, as the failed task is not on the main path.
But if the workflow waits fot the result later, then a `FailedTaskException` will be thrown then:

![Error when processing an async task](/img/error-task-async-2@2x.png)

## Errors due to cancellation and more

We have seen that a failure of a synchronous task will throw a `FailedTaskException`. Also the failure of a synchronous child-workflow will throw a `FailedWorkflowException`. There are similar errors due to cancelation, and some other cases:

| Name                          | When it happens                                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FailedTaskException`         | the task has failed. A task has failed only after all planed retries have failed.                                                                                    |
| `CanceledTaskException`       | the task has been canceled.                                                                                                                                          |
| `FailedWorkflowException`     | the targeted workflow has a failed synchronous task / child-workflow.                                                                                                |
| `CanceledWorkflowException`   | the targeted workflow has been canceled.                                                                                                                             |
| `UnknownWorkflowException`    | the targeted workflow has never existed or if it is already completed or canceled. This can happen when dispatching a method on a stub created by `getWorkflowById`. |
| `FailedWorkflowTaskException` | an error occured directly from the code of the workflow.                                                                                                             |

{% callout type="note"  %}

All those exceptions inherit from `io.infinitic.exceptions.DeferredException`

{% /callout  %}

## Try/catch in workflows

We may want to react to a `DeferredException` or one of its subclass. For example, if we want to react to the inability to complete a task with new tasks:

{% callout type="note"  %}
Try/catch in workflows should be used only for situations when we need to react to _unexpected_ failures. If we expect some failures in our task, a better practice is to catch them directly in the task and send back a status object as a result.

{% /callout  %}

{% codes %}

```java
String str;
try {
    // synchronous call of HelloWorldService::sayHello
    str = helloWorldService.sayHello(name);
} catch (DeferredException e) {
    // react
    ...
}
```

```kotlin
// synchronous call of HelloWorldService::sayHello
val str = try {
    helloWorldService.sayHello(name)
} catch (e: DeferredException) {
    // react
    ...
}
```

{% /codes %}

{% callout type="warning"  %}

`DeferredException` and its sub-classes are the only relevant exceptions in workflows. We must not catch any other exception.

{% /callout  %}

If a `DeferredException` has been caught in a workflow, it can not be resumed anymore (see below).
