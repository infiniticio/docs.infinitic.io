---
title: Service Syntax
description: This documentation details the syntax and operational constraints for defining and implementing services in Infinitic. It emphasizes task methods must be serializable and thread-safe, with guidelines for versioning services, handling task failures, setting runtime timeouts, and customizing retry policies.
---
## Constraints

Upon receiving a message instructing to execute a task, a service worker instantiates the service class, deserializes the parameters, executes the requested method and returns the serialized result:

{% callout type="warning"  %}

The parameters and return value of a method used as task must be [serializable](/docs/references/serializability).

{% /callout  %}

If we chose to have several executions in parallel (`concurrency` > 1), they must not interfere with each other:

{% callout type="warning"  %}

A method used as a task must be thread-safe.

{% /callout  %}

If our method uses multi-threading, **we should keep in mind that a task is considered completed when the method returns**. Any exception occurring on another thread than the one that initiated the execution of the task will be ignored.

## Recommendations

For an easier [versioning of services](/docs/services/versioning), we recommend:

{% callout type="note"  %}

Each service should be given a simple name through the [@Name](#name-annotation) annotation.

Methods used as tasks should have:
 - One parameter of a dedicated type object
 - A return value of a dedicated type object

{% /callout  %}

For example,

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyService")
public interface MyService {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyService")
interface MyService {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

## Task Failure

Technical failures should be distinguished from non-technical failures:

- A technical failure is triggered by an unexpected exception.
- A non-technical failure is the inability to fulfill the task due to "business" reasons. For example:
  - A flight booking fails because no seats remain available.
  - A bank wire fails because there is not enough money in the account.

Non-technical failures are better handled through a status in the return value.
(That's another reason why having an object as return value is a good practice.)

When an exception is thrown during a task execution, the task will be automatically retried based on its [retry policy](/docs/services/syntax#task-retries).

When a task execution run for longer than a defined timeout, the task will also automatically fail and be retried.

## Runtime Timeout

We can set a maximum duration of task execution inside a Service worker, by defining a runtime timeout in the Service implementation. By default, tasks do not have a runtime timeout defined.

{% callout type="warning"  %}

Since 0.12.0, the runtime timeout must be defined on the class implementation. When defined in the interface, a timeout represents the maximal duration of the task dispatched by workflows (including retries and transportation) before a timeout is thrown at the workflow level.

{% /callout  %}

There are multiple ways to define a runtime timeout:

- In the service implementation:
  - By using the [`WithTimeout`](/docs/services/syntax#withtimeout-interface) interface
  - By using the [`@Timeout`](/docs/services/syntax#timeout-annotation) annotation
- In the worker:
  - Through its configuration [file](/docs/services/workers#timeout-policy)
  - Through service [registration](/docs/services/workers#service-registration)

The timeout policy used will be the first found in this order:

1) Worker's configuration
2) `@Timeout` method annotation
3) `@Timeout` class annotation
4) `WithTimeout` interface
5) No timeout

### `WithTimeout` Interface

The `WithTimeout` interface requires a `getTimeoutInSeconds` method. When present, Infinitic will call this method to know which timeout to apply for all tasks of the service:

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.WithTimeout;

public class MyServiceImpl implements MyService, WithTimeout {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }

    public Double getTimeoutInSeconds() {
        return 100.0;
    }
}
```

```kotlin
package com.company.services

import io.infinitic.tasks.WithTimeout

class MyServiceImpl : MyService, WithTimeout {
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }

    override fun getTimeoutInSeconds() = 100.0
}
```

{% /codes %}

We can use the [task context](/docs/services/syntax#task-context) to personalize the timeout per task, for example:

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.Task;
import io.infinitic.tasks.WithTimeout;

public class MyServiceImpl implements MyService, WithTimeout {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }

    public Double getTimeoutInSeconds() {
        if(Task.getTaskName().equals("myFirstTask"))
            return 200.0;
        else
            return 100.0;
    }
}
```

```kotlin
package com.company.services

import io.infinitic.tasks.Task
import io.infinitic.tasks.WithTimeout

class MyServiceImpl : MyService, WithTimeout {
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }

    override fun getTimeoutInSeconds() = when (Task.taskName) {
        ::myFirstTask.name -> 200.0
        else -> 100.0
    }
}
```

{% /codes %}

### `@Timeout` Annotation

This annotation has a class implementing `WithTimeout` as parameter.

It can also be used as a method annotation to define a timeout on a specific task:

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Timeout;

public class MyServiceImpl implements MyService {
    @Timeout(with = WithTimeoutImpl.class)
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Timeout

class MyServiceImpl : MyService {
    @Timeout(WithTimeoutImpl::class.java)
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }
}
```

{% /codes %}

Or as a class annotation to define a timeout on all tasks:

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Timeout;

@Timeout(with = WithTimeoutImpl.class)
public class MyServiceImpl implements MyService {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Timeout

@Timeout(WithTimeoutImpl::class.java)
class MyServiceImpl : MyService {
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }
}
```

{% /codes %}

## Retries Policy

{% callout type="note"  %}

Per default, all tasks have a [truncated and randomized exponential backoff](/docs/services/workers#retries-policy) retry policy.

{% /callout  %}

There are multiple ways to define another retry policy:

- In the service:
  - By extending the [`WithRetry`](/docs/services/syntax#withretry-interface) interface
  - By using the [`@Retry`](/docs/services/syntax#retry-annotation) annotation
- In the worker:
  - Through its configuration [file](/docs/services/workers#retries-policy)
  - Through service [registration](/docs/services/workers#service-registration)

The retry policy used will be the first found in this order:

1) Worker's configuration
2) `@Retry` method annotation
3) `@Retry` class annotation
4) `WithRetry` interface
5) Default retry policy

### `WithRetry` Interface

The `WithRetry` interface requires a `getSecondsBeforeRetry` method with 2 parameters:

- `retry`: retry index (starting at 0)
- `exception`: the exception that triggered the failure

When present, Infinitic will call this method if an exception was thrown.
The result of this call will tell Infinitc how many seconds it should wait before retrying the task.

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.WithRetry;

public class MyServiceImpl implements MyService, WithRetry {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }

    public Double getSecondsBeforeRetry(int retry, Exception e) {
        return 1.0;
    }
}
```

```kotlin
package com.company.services

import io.infinitic.tasks.WithRetry

class MyServiceImpl : MyService, WithRetry {
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }

    override fun getSecondsBeforeRetry(retry: Int, exception: Exception) = 1.0
}
```

{% /codes %}

We can use the [task context](/docs/services/syntax#task-context) to personalize the delay before retry per task, for example:

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.Task;
import io.infinitic.tasks.WithRetry;

public class MyServiceImpl implements MyService, WithRetry {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }

    public Double getSecondsBeforeRetry(int retry, Exception e) {
        if(Task.getTaskName().equals("mySecondTask"))
            return 2.0;
        else
            return 1.0;
    }
}
```

```kotlin
package com.company.services

import io.infinitic.tasks.Task
import io.infinitic.tasks.WithRetry

class MyServiceImpl : MyService, WithRetry {
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }

    override fun getSecondsBeforeRetry(retry: Int, exception: Exception) = 
      when (Task.taskName) {
          ::mySecondTask.name -> 2.0
          else -> 1.0
      }
}
```

{% /codes %}

### `@Retry` Annotation

`@Retry` annotation takes a class implementing `WithRetry` as parameter.

It can be used as a method annotation to define a retry policy on a specific task:

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Retry;

public class MyServiceImpl implements MyService {
    @Retry(with = WithRetryImpl.class)
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Retry

class MyServiceImpl : MyService {
    @Retry(WithRetryImpl::class.java)
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }
}
```

{% /codes %}

Or as a class annotation to define a retry policy on all tasks

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Retry;

@Retry(with = WithRetryImpl.class)
public class MyServiceImpl implements MyService {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Retry

@Retry(WithRetryImpl::class.java)
class MyServiceImpl : MyService {
    override fun myFirstTask(MyFirstTaskInput input) { /* */ }

    override mySecondTask(MySecondTaskInput input) { /* */ }
}
```

{% /codes %}

## @Name Annotation

A task instance is internally described by both its full java name (package included) and the name of the method called.

We may want to avoid coupling this name with the underlying implementation, for example if we want to rename the class or method, or if we mix programming languages.

Infinitic provides a `@Name` annotation that let us declare explicitly the names that Infinitic should use internally. For example:

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyNewServiceName")
public interface MyService {

    @Name(name = "FirstTask")
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    @Name(name = "SecondTask")
    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyNewServiceName")
interface MyService {
    
    @Name("FirstTask")
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    @Name("SecondTask")
    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

When using this annotation, the Service `name` setting in [Service worker](/docs/services/workers) configuration file should be the one provided by the annotation:

```yaml
services:
  - name: MyNewServiceName
    class: com.company.services.MyServiceImpl
```

## Task Context

In some cases, we want to know more about the context of the execution of a task.

`io.infinitic.tasks.Task` contains the following static properties:

| Name            | Type            | Description                                                                          |
| --------------- | --------------- | ------------------------------------------------------------------------------------ |
| `taskId`        | String          | ID of the task                                                                       |
| `serviceName`   | String          | Name of the Service (taken from the [@Name annotation](#name-annotation) if provided, otherwise defaulting to the service's interface name) |
| `taskName`      | String          | Name of the task (taken from the [@Name annotation](#name-annotation) if provided, otherwise defaulting to the service's method name) |
| `workflowId`    | String?         | ID of the workflow (if part of a workflow)                                           |
| `workflowName`  | String?         | Name of the workflow (if part of a workflow)                                         |
| [`tags`](#tags)                    | Set\<String\>   | Tags provided when dispatching the task                                              |
| [`meta`](#meta)                    | MutableMap\<String, ByteArray\>   | Metadata provided when dispatching the task                        |
| [`retryIndex`  ](#retry-index)     | Integer         | Number of times the task was automatically retried                                   |
| [`retrySequence`](#retry-sequence) | Integer         | Number of times the task was manually retried                                        |
| [`lastError`](#last-error)         | ExecutionError? | If any, the error during the previous attempt                                        |
| `client`        | InfiniticClient | An [InfiniticClient](/introduction/terminology#clients) that can be used inside the task                                  |

{% callout type="warning"  %}

The task context is accessible from the thread that initiated:
* the method (task) execution
* the `getTimeoutInSeconds` execution 
* the `getSecondsBeforeRetry` execution

{% /callout  %}

{% callout type="note"  %}

In tests, `io.infinitic.tasks.TaskContext` can be mocked and injected through `Task.set(mockedTaskContext)` before running a test that uses the task's context.

{% /callout  %}

### `tags`

The `tags` property of the task context is an immutable set of strings.
Its value is defined when dreating the Service stub before dispatching the task:

{% codes %}

```java
final HelloWorldService helloWorldService = newService(
    HelloWorldService.class,
    tags = Set.of("userId" + userId, "companyId" + companyId)
);
```

```kotlin
val helloWorldService = newService(
    HelloWorldService::class.java, 
    tags = setOf("userId:$userId", "companyId:$companyId")
)
```

{% /codes %}


### `meta`

The `meta` property of the task context is a mutable map of strings to arrays of bytes.
Its value is defined when creating the Service stub before dispatching the task:

{% codes %}

```java
final HelloWorldService helloWorldService = newService(
    HelloWorldService.class,
    tags = null,
    meta = Map.of(
            "foo", "bar".getBytes(),
            "baz", "qux".getBytes()
    )
);
```

```kotlin
private val helloWorldService = newService(
    HelloWorldService::class.java,
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

### `retryIndex`

The `retryIndex` property of the task context indicates the current number of retry attempts.
It starts at 0 and is incremented when a task is [automatically retried](#retries-policy):

![Tasks retries](/img/task-failing@2x.png)

{% callout %}

When a task is [manually retried](/docs/clients/retry-failed-tasks), the `retryIndex` property is reset to 0.

{% /callout  %}

### `retrySequence`

The `retrySequence` property of the task context indicates the current number of manual retries.
It starts at 0 and is incremented when a task is [manually retried](/docs/clients/retry-failed-tasks):

![Tasks retries](/img/task-retries@2x.png)

### `lastError`

If not null (when `retryIndex` >= 1), the lastError property is a data object representing the exception thrown during the last task attempt. This `ExecutionError` instance has the following properties:

| Name            | Type            | Description                                                                          |
| --------------- | --------------- | ------------------------------------------------------------------------------------ |
| `workerName` | String | Name of the worker where the previous Exception was thrown |
| `name` | String | Name of the previous Exception |
| `message` | String | Message of the previous Exception |
| `stackTraceToString` | String |  Stringified stack trace of the previous Exception |
| `cause` | `ExecutionError?` | Cause of the previous Exception |


