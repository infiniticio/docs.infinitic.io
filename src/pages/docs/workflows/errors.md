---
title: Errors
description: This page discusses strategies for error handling within workflows, including retrying failed tasks and managing exceptions, to ensure robust workflow execution.
---

Handling errors in a distributed system is typically complex. Infinitic simplifies this by automatically tracking error chains and allowing you to handle errors directly within the workflow.

## Types of Exceptions in Workflows

The only exceptions that can be thrown inside a workflow are categorized as follows:

**Due to Task failures**
- [`TaskFailedException`](#task-failed-exception): Thrown when accessing the result of a failed task.
- [`TaskTimedOutException`](#task-timed-out-exception): Thrown when accessing the result of a timed out task.

**Due to Workflow Failures**
- [`WorkflowFailedException`](#workflow-failed-exception): Thrown when accessing the result of a failed workflow, due to a failed task or another failed workflow.
- [`WorkflowExecutorException`](#workflow-executor-exception): Thrown when accessing the result of a failed workflow, due to an error in its implementation.
- [`WorkflowTimedOutException`](#workflow-timed-out-exception): Thrown when accessing the result of a timed out workflow.
- [`WorkflowCanceledException`](#workflow-canceled-exception): Thrown when accessing the result of a canceled workflow.
- [`WorkflowUnknownException`](#workflow-unknown-exception): Thrown when accessing the result of a unknown workflow.

{% callout %}

All the exceptions mentioned above are derived from the `DeferredException` base class.

{% /callout %}

## Errors Due to a Task Failure

### `TaskFailedException`

This exception is thrown when a workflow attempts to access the result of a failed task. From a workflow point of view, a task is failed after all the [automatic retries](/docs/services/syntax#task-retries) failed:

![Error when a task fails](/img/error-task.png)

The `TaskFailedException` can also occur when waiting for the result of a task that was previously dispatched asynchronously:

![Error when waiting for a failed task](/img/error-task-async.png)

{% callout %}

    If a task fails when dispatched asynchronously, it will not cause an exception within the workflow unless the workflow attempts to access the task's result.

    ![failed task not awaited](/img/error-task-async2.png)

{% /callout %}

A `TaskFailedException` has detailed information about the failed task:

| Property         | Type             | Description                                    |
| ---------------- | ---------------- | ---------------------------------------------- |
| `serviceName`    | String           | The name of the Service |
| `taskId`         | String           | The ID of the failed task |
| `methodName`     | String           | The name of the method called for the failed task |
| `lastFailure`    | TaskFailure      | Details of the last failure |

The `TaskFailure` object describes each attempt to execute the task and has the following properties:

| Property              | Type             | Description                                    |
| --------------------- | ---------------- | ---------------------------------------------- |
| `workerName`          | String           | The name of the worker where the exception occurred |
| `exception`           | GenericException | The details of the original exception |
| `stackTraceString`    | String           | The string version of the original exception |
| `secondsBeforeRetry`  | double?          | The duration in seconds before the next retry attempt - can be null if no retry |
| `retryIndex`          | Integer          | The number of retry attempts made before the current attempt | 
| `retrySequence`       | Integer          | The number of times the task was manually retried | 

The `GenericException` class is used to store the details of the original exception:

| Property               | Type              | Description                                    |
| ---------------------- | ----------------- | ---------------------------------------------- |
| `name`                 | String            | The name of the original exception |
| `message`              | String            | The message of the original exception |
| `cause`                | GenericException? | The cause of the original exception

The `GenericException` class provides two methods for accessing custom properties of the original exception: 
- the `getCustomProperties()` method returns a map containing all custom properties of the original exception.
- the `getCustomProperty(String name)` method retrieves a specific custom property by its name, provided it was successfully serialized and deserialized. 

{% callout type="warning" %}

When updating a Service Executor, be cautious about making changes to the name or type of custom properties associated with your exceptions. This could potentially disrupt running workflow instances that rely on these properties, as they might not be able to interpret messages containing the old name or type.

{% /callout %}

### `TaskTimedOutException`

This exception is thrown when a workflow attempts to access the result of a timed-out task: 

![timed out task](/img/error-task-timedout.png)

A `TaskTimedOutException` has the following properties:

| Property         | Type             | Description                                    |
| ---------------- | ---------------- | ---------------------------------------------- |
| `serviceName`    | String           | The name of the Service |
| `taskId`         | String           | The ID of the timed out task |
| `methodName`     | String           | The name of the method called for the timed out task |

## Errors Due to a (Child) Workflow Failure

### `WorkflowFailedException`

This exception is thrown when a workflow or a client attempts to access the result of another workflow that failed due to the failure of a task or another workflow. 

For instance, this exception throws in the parent workflow of a failing child workflow:

![Error in parent workflow when a workflow fails](/img/error-workflow-failed.png)

Or if a client waits synchronously for the result of another failing workflow:

![Error in client when a workflow fails](/img/error-workflow-failed-client.png)

A `WorkflowFailedException` has the following properties:

| Property             | Type              | Description                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| `workflowName`       | String            | The name of the other workflow that failed |
| `workflowId`         | String            | The unique identifier of the failed other workflow |
| `workflowMethodName` | String            | The name of the method that was called on the failed other workflow |
| `workflowMethodId`   | String            | The unique identifier of the execution of the method that failed |
| `deferredException`  | DeferredException | The original exception that caused the other workflow to fail |

### `WorkflowTimedOutException`

This exception is thrown when a workflow or a client attempts to access the result of a child workflow that timed out. The timeout duration is specified in the interface of the Workflow:

![timed out workflow](/img/error-workflow-timedout.png)

A `WorkflowTimedOutException` has the following properties:

| Property             | Type              | Description                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| `workflowName`       | String            | The name of the child workflow that timed out |
| `workflowId`         | String            | The unique identifier of the timed out workflow instance|
| `workflowMethodName` | String?           | The name of the method that was called on the timed out child workflow |
| `workflowMethodId`   | String?           | The unique identifier of the execution of the method that timed out |

### `WorkflowCanceledException`

This exception is thrown when a workflow or a client attempts to access the result of a child workflow that has been canceled. 

A `WorkflowCanceledException` has the following properties:

| Property             | Type              | Description                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| `workflowName`       | String            | The name of the child workflow that timed out |
| `workflowId`         | String            | The unique identifier of the timed out workflow instance|
| `workflowMethodName` | String?           | The name of the method that was called on the timed out child workflow |
| `workflowMethodId`   | String?           | The unique identifier of the execution of the method that timed out |

### `WorkflowUnknownException`

This exception is thrown when a workflow or a client attempts to access the result of a child workflow that is unknown - this can happen when targeting a workflow by its ID.

A `WorkflowCanceledException` has the following properties:

| Property             | Type              | Description                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| `workflowName`       | String            | The name of the child workflow that timed out |
| `workflowId`         | String            | The unique identifier of the timed out workflow instance|
| `workflowMethodName` | String?           | The name of the method that was called on the timed out child workflow |
| `workflowMethodId`   | String?           | The unique identifier of the execution of the method that timed out |

### `WorkflowExecutorException`

This exception is thrown when a workflow or a client attempts to access the result of a workflow that failed due to an error in its own implementation. 

A `WorkflowExecutorException` has the following properties:

| Property             | Type              | Description                                    |
| -------------------- | ----------------- | ---------------------------------------------- |
| `workflowName`       | String            | The name of the child workflow that failed |
| `workflowId`         | String            | The unique identifier of the failed workflow instance|
| `workflowTaskId`     | String            | The ID of the failed workflow execution |
| `lastFailure`        | TaskFailure       | Details of the last failure |

## Try/catch in workflows

Use try/catch of `DeferredException` in workflows if you want to ensure that the workflow continues to run even if a task or another workflow failed: 

{% codes %}

```java
String str;
try {
    // synchronous call of HelloService::sayHello
    str = helloService.sayHello(name);
} catch (TaskFailedException e) {
    // react to the task failure
    ...
}
```

```kotlin
// synchronous call of HelloService::sayHello
val str = try {
    helloService.sayHello(name)
} catch (e: TaskFailedException) {
    // react to the task failure
    ...
}
```

{% /codes %}

Remember, for expected failures, it's a better practice to handle them within the Service and return a status object.

{% callout %}

A  `DeferredException` in a workflow cannot be resumed, as the workflow has already "moved on".

{% /callout  %}

{% callout type="warning" %}

In workflows, do not catch any other exceptions then `DeferredException`. Specifically, actual exceptions thrown in Services or other workflows are wrapped within the `DeferredException`. It is not meaningful to try to catch these exceptions directly.

{% /callout %}



