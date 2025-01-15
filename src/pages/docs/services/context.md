---
title: Task Context
description: Learn about the task context in Infinitic, including its properties and how it's used to understand the execution environment of a task.
---

In some cases, it is useful to understand more about the context in which a task is executed.

The `io.infinitic.tasks.Task` class provides the following static properties:

| Name            | Type            | Description                                                                          |
| --------------- | --------------- | ------------------------------------------------------------------------------------ |
| `taskId`        | String          | Unique identifier of the task                                                                      |
| `serviceName`   | String          | Name of the Service (taken from the [@Name](#name-annotation) annotation if provided, otherwise defaulting to the service's interface name) |
| `taskName`      | String          | Name of the task (taken from the [@Name](#name-annotation) annotation if provided, otherwise defaulting to the service's method name) |
| `workflowId`    | String?         | Unique identifier of the workflow (if part of a workflow)                                           |
| `workflowName`  | String?         | Name of the workflow (if part of a workflow)                                         |
| [`tags`](#tags) | Set\<String\>   | Tags provided when dispatching the task                                              |
| [`meta`](#meta) | Map\<String, ByteArray\>   | Metadata provided when dispatching the task                        |
| [`retryIndex`  ](#retry-index)     | Integer         | Number of times the task was automatically retried                                   |
| [`retrySequence`](#retry-sequence) | Integer         | Number of times the task was manually retried                                        |
| [`attempts`](#attempts)         | List<AttemptException> | list of previous `AttemptException`    |
| `batchKey`        | String? | If any, the [batch key](/docs/services/batched#optional-batch-key) provided when the task was dispatched                                       |
| `client`        | InfiniticClient | An [InfiniticClient](/docs/components/terminology#clients) that can be used inside the task                                  |

{% callout type="warning"  %}

The task context is injected by the Service worker executing the task, and is only accessible from the thread that started:
* the task method
* the `getTimeoutSeconds` method 
* the `getSecondsBeforeRetry` method

{% /callout  %}

{% callout type="note"  %}

In tests, `io.infinitic.tasks.TaskContext` can be mocked and injected through `Task.setContext(mockedTaskContext)` before running a test that uses the task's context.

{% /callout  %}

## `tags`

The `tags` property of the task context is an immutable set of strings.
Its value is defined when dreating the Service stub before dispatching the task:

{% codes %}

```java
final HelloService helloService = newService(
    HelloService.class,
    tags = Set.of("userId" + userId, "companyId" + companyId)
);
```

```kotlin
val helloService = newService(
    HelloService::class.java, 
    tags = setOf("userId:$userId", "companyId:$companyId")
)
```

{% /codes %}


## `meta`

The `meta` property of the task context is a mutable map of strings to arrays of bytes.
Its value is defined when creating the Service stub before dispatching the task:

{% codes %}

```java
final HelloService helloService = newService(
    HelloService.class,
    tags = null,
    meta = Map.of(
            "foo", "bar".getBytes(),
            "baz", "qux".getBytes()
    )
);
```

```kotlin
private val helloService = newService(
    HelloService::class.java,
    meta = mapOf(
        "foo" to "bar".toByteArray(),
        "baz" to "qux".toByteArray()
    )
)
```

{% /codes %}

{% callout  %}

The `meta` property is mutable and can be read and write during the task execution and its retries. 

{% /callout  %}

## `retryIndex`

The `retryIndex` property of the task context indicates the current number of retry attempts.
It starts at 0 and is incremented when a task is [automatically retried](#retries-policy):

![Tasks retries](/img/task-failing@2x.png)

{% callout %}

When a task is [manually retried](/docs/clients/retry-failed-tasks), the `retryIndex` property is reset to 0.

{% /callout  %}

## `retrySequence`

The `retrySequence` property of the task context indicates the current number of manual retries.
It starts at 0 and is incremented when a task is [manually retried](/docs/clients/retry-failed-tasks):

![Tasks retries](/img/task-retries@2x.png)

## `lastError`

If not null (when `retryIndex` >= 1), the lastError property is a data object representing the exception thrown during the last task attempt. This `ExecutionError` instance has the following properties:

| Name            | Type            | Description                                                                          |
| --------------- | --------------- | ------------------------------------------------------------------------------------ |
| `workerName` | String | Name of the worker where the previous Exception was thrown |
| `name` | String | Name of the previous Exception |
| `message` | String | Message of the previous Exception |
| `stackTraceToString` | String |  Stringified stack trace of the previous Exception |
| `cause` | `ExecutionError?` | Cause of the previous Exception |


