---
title: Service Introduction
description: Learn about Infinitic services, their implementation, and how they facilitate distributed and asynchronous execution of business logic through event-based RPC mechanisms. Discover the benefits of using service interfaces as contracts and best practices for managing service versions.
---

## Implementation

Implementing a Service in Infinitic involves creating a regular Java or Kotlin class that implements the defined Service interface. 

1. **Create a Class**: Define a new class that implements the Service interface you've defined.

2. **Implement Methods**: Code what the methods of the Service interface should do.
    {% callout  %}
    If you already have your Services implemented as APIs, the implementation here could be simple requests to your existing APIs.
    {% /callout  %}

3. **Regular Class Structure**: This class behaves like any other class in your codebase. It can have constructor, private methods, use dependency injection, etc.

4. **Testing**: Since it's a regular class, you can unit test it using your preferred testing framework, without needing to involve Infinitic's infrastructure.

5. **No Special Annotations**: Unlike some frameworks, Infinitic doesn't require special annotations or complex configurations within the class itself.
    {% callout  type="warning" %}

    Infinitic dynamically instantiates your Service class. So if you use framework-dependent dependencies injection, you will need to configure your Service Executors through [builders](/docs/components/workers#service-executor) to provide factories for your services.

    {% /callout  %}

## Service Name 

The name of the Service is used to identify the Pulsar topic that the Service Executor will listen to.

By default, **the Service name is the fully qualified name of the Service interface**.

To ensure backward compatibility with ongoing messages, the name of the Service must not change after the Service Executors have been deployed.

If you want to decouple this name from the underlying implementation, 
for example if you want to rename the class or method,
you can use an `@Name` annotation. 

{% callout type="warning" %}

The `@Name` annotation must be used on the Service interface (not on the Service implementation).

{% /callout  %}

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyService")
public interface MyNewService {
   ...
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyService")
interface MyNewService {
   ...
}
```

{% /codes %}

## Task Name 

The name of the task is used to identify the method that the Service Executor will execute.

By default, **the task name is the name of the method**.

To ensure backward compatibility with ongoing messages, the name of the tasks must not change after the Service Executors have been deployed.

If you want to decouple this name from the underlying implementation, 
for example if you want to rename the method,
you can use an `@Name` annotation. 

{% callout type="warning" %}

The `@Name` annotation must be used on the Service interface (not on the Service implementation).

{% /callout  %}

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

public interface MyNewService {

    @Name(name = "firstTask")
    FirstTaskOutput newFirstTask(FirstTaskInput input);

    @Name(name = "secondTask")
    SecondTaskOutput newSecondTask(SecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

interface MyNewService {
    
    @Name("firstTask")
    fun newFirstTask(input: FirstTaskInput): FirstTaskOutput

    @Name("secondTask")
    fun newSecondTask(input: SecondTaskInput): SecondTaskOutput
}
```

{% /codes %}

## Concurrency

**By default, tasks are executed sequentially, one after another, within the same Service Executor.** However, we can increase the level of parallelism with the `concurrency` parameter when configuring the [Service Executors](/docs/services/executors). 

With `concurrency = 50`, a Service Executor will execute up to 50 tasks concurrently. If more than 50 tasks are running, the worker will stop consuming messages until a slot becomes available. 

{% callout  %}

This parallel execution can significantly improve throughput, but it's important to consider the resource implications and potential contention issues when setting a high concurrency value.

{% /callout  %}

When `concurrency` is > 1, please ensure that your tasks are safe-thread, meaning they do not interract with each other when executing.

## Retry Policy

**By default, failed tasks are not retried.** But Infinitic provides a robust retry mechanism for tasks that fail during execution. This mechanism can handle transient errors and improves the reliability of your services. 

{% callout  %}

The workflow that dispatched a task remains unaware of any retry attempts occurring for that task. From the workflow's perspective, it only receives the final outcome: either the task has succeeded after potentially multiple retry attempts, or it has ultimately failed once all retry attempts have been exhausted. This abstraction allows the workflow to focus on the overall task completion status rather than the intricacies of the retry mechanism.

{% /callout  %}

There are multiple ways to define a retry policy for a Service:

- During the [configuration](/docs/components/workers#service-executor) of the Service Executor.
- Within the implementation code of the Service itself:
  - By using the [`@Retry`](#using-retry-annotation) annotation
  - By extending the [`WithRetry`](#using-with-retry-interface) interface

The retry policy will be determined based on the first configuration found in the following order:

1) Service Executor's configuration
2) `@Retry` method annotation
3) `@Retry` class annotation
4) `WithRetry` interface
5) No retry

### Using `@Retry` Annotation

The `@Retry` annotation takes a class implementing the [`WithRetry`](#using-with-retry-interface) interface as parameter, 
and can be used to define a retry policy on a specific Service (when used as a class annotation) or Task (when used as a method annotation):

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Retry;

public class MyServiceImpl implements MyService {
    @Retry(with = WithRetryImpl.class)
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* ... */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* ... */ }
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Retry

class MyServiceImpl : MyService {
    @Retry(WithRetryImpl::class.java)
    override fun myFirstTask(MyFirstTaskInput input) { /* ... */ }

    override mySecondTask(MySecondTaskInput input) { /* ... */ }
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

### Using `WithRetry` Interface

The `io.infinitic.tasks.WithRetry` interface requires a `getSecondsBeforeRetry` method with 2 parameters:

- `retry`: retry index (starting at 0)
- `exception`: the exception that triggered the failure

{% codes %}

```java
Double getSecondsBeforeRetry(Int retry, Exception e);
```

```kotlin
fun getSecondsBeforeRetry(retry: Int, e: Exception): Double?
```
{% /codes %}

When present, Infinitic will call this method if an exception was thrown.
The result of this call will tell Infinitc how many seconds it should wait before retrying the task. 
**If the function returns null, the task won't be retried and is considered as failed.**

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

We can use the [task context](/docs/services/context) to personalize the delay before retry per task, for example:

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

## Task Execution Timeout

**By default, tasks have no execution timeout defined.** This timeout refers to a maximum duration allowed for a task to complete an execution attempt. If an execution attempt exceeds this time limit, the Service Executor will automatically throw a `TimeoutException`.

When timed-out, the task will be automatically retried - or not - based on its [retry policy](#retry-policy).

{% callout  type="warning" %}

We generally do not recommend using Task Execution Timeout (see the [good practices](/docs/services/practices) section).

{% /callout  %}

There are multiple ways to define an execution timeout for a Task:

- During the [configuration](/docs/services/executors#creating-a-service-executor) of the Service Executor.
- Within the implementation code of the Service itself:
    - By using the [`@Timeout`](#using-timeout-annotation) annotation
    - By extending the [`WithTimeout`](#using-with-timeout-interface) interface

The timeout policy used will be the first found in this order:

1) Service Executor's configuration
2) `@Timeout` method annotation
3) `@Timeout` class annotation
4) `WithTimeout` interface
5) No timeout

{% callout type="warning"  %}

When defined in the interface, a timeout has a different meaning. It represents the maximal duration of the task dispatched by workflows (including retries and transportation) before a timeout is thrown at the workflow level.

{% /callout  %}

### Using `@Timeout` Annotation

This annotation has a class implementing [`WithTimeout`](#using-with-timeout-interface) as parameter.

It can be used as a method annotation to define a timeout on a specific task:

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

### Using `WithTimeout` Interface

The `WithTimeout` interface requires a `getTimeoutSeconds` method. When present, Infinitic will call this method to know which timeout to apply for all tasks of the service:

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.WithTimeout;

public class MyServiceImpl implements MyService, WithTimeout {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { /* */ }

    MySecondTaskOutput mySecondTask(MySecondTaskInput input) { /* */ }

    public Double getTimeoutSeconds() {
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

    override fun getTimeoutSeconds() = 100.0
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

    public Double getTimeoutSeconds() {
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

    override fun getTimeoutSeconds() = when (Task.taskName) {
        ::myFirstTask.name -> 200.0
        else -> 100.0
    }
}
```

{% /codes %}