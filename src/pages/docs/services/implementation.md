---
title: Service Implementation
description: Learn about Infinitic services, their implementation, and how they facilitate distributed and asynchronous execution of business logic through event-based RPC mechanisms. Discover the benefits of using service interfaces as contracts and best practices for managing service versions.
---

## Implementation

Implementing a Service in Infinitic involves creating a regular Java or Kotlin class that implements the defined Service interface. 

1. **Create a Class**: Define a new class that implements the Service interface you've defined.

2. **Implement Methods**: Code what the methods of the Service interface should do.  *A task is considered completed when the method returns*. 
    {% callout  %}
    If you already have your Services implemented as APIs, the implementation here could be simple requests to your existing APIs.
    {% /callout  %}

1. **Regular Class Structure**: This class behaves like any other class in your codebase. It can have constructor, private methods, use dependency injection, etc.
    {% callout  type="warning" %}

    Service Executors dynamically instantiate your Service class. So if you use framework-dependent dependencies injection, you will need to provide factories through [builders](/docs/components/workers#service-executor).

    {% /callout  %}

2. **Testing**: Since it's a regular class, you can unit test it using your preferred testing framework, without needing to involve Infinitic's infrastructure.

3. **No Special Annotations**: Unlike some frameworks, Infinitic doesn't require special annotations or complex configurations within the class itself.


## Constraints

### Serialization

Upon receiving a message instructing to execute a task, a service worker instantiates the service class, deserializes the parameters, executes the requested method and returns the serialized result:

{% callout type="warning"  %}

The parameters and return value of a method used as task must be [serializable](/docs/references/serialization).

{% /callout  %}

### Thread-Safety

Tasks will be processes in parallel, so they must not interfere with each other:

{% callout type="warning"  %}

A method used as a task must be thread-safe.

{% /callout  %}

If you use multi-threading, keep in mind that any exception on a thread other than the one that initiated the execution of the task will be unknown to Infinitic.

## @Name annotation

### Service Name

The name of the Service is used to identify the topics that the Service Executor will listen to.
By default, the Service name is the fully qualified name of the Service interface.

To ensure backward compatibility with ongoing messages, 
{% callout type="warning" %}
Service names must not change after Service Executors have been deployed.
{% /callout %}

If you want to decouple this name from the underlying implementation, 
for example if you want to rename the class or method,
you can use an `@Name` annotation. 

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

The `@Name` annotation must be used on the Service interface (not on the Service implementation).


### Task Name 

The name of the task is used to identify the method that the Service Executor will execute.
By default, the task name is the name of the method.

To ensure backward compatibility with ongoing messages, 
{% callout type="warning" %}
the task names must not change after the Service Executors have been deployed.
{% /callout %}

If you want to decouple this name from the underlying implementation, 
for example if you want to rename the method,
you can use an `@Name` annotation. 

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

The `@Name` annotation must be used on the Service interface (not on the Service implementation).


## Retry Policy

**By default, failed tasks are not retried.** But Infinitic provides a robust retry mechanism for tasks that fail during execution. This mechanism can handle transient errors and improves the reliability of your services. 

There are multiple ways to define a retry policy for a Service:

- During the [configuration](/docs/components/workers#service-executor) of the Service Executor.
- Within the implementation code of the Service itself:
  - By using the [`@Retry`](#retry-annotation) annotation
  - By extending the [`WithRetry`](#with-retry-interface) interface

### `@Retry` Annotation

The `@Retry` annotation takes a class implementing the [`WithRetry`](#with-retry-interface) interface as parameter, 
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

### `WithRetry` Interface

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

## Execution Timeout

**By default, tasks have no execution timeout defined.** This timeout refers to a maximum duration allowed for a task to complete an execution attempt. If an execution attempt exceeds this time limit, the Service Executor will automatically throw a `TimeoutException`.

When timed-out, the task will be automatically retried - or not - based on its [retry policy](#retry-policy).


There are multiple ways to define an execution timeout for a Task:

- During the [configuration](/docs/services/executors#creating-a-service-executor) of the Service Executor.
- Within the implementation code of the Service itself:
    - By using the [`@Timeout`](#timeout-annotation) annotation
    - By extending the [`WithTimeout`](#with-timeout-interface) interface


{% callout type="warning"  %}

When defined in the interface, a timeout has a different meaning. It represents the maximal duration of the task dispatched by workflows (including retries and transportation) before a timeout is thrown at the workflow level.

{% /callout  %}

### `@Timeout` Annotation

This annotation has a class implementing [`WithTimeout`](#with-timeout-interface) as parameter.

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

### `WithTimeout` Interface

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

### Cooperative Canceling

{% callout type="warning"  %}

When a task times out, the current execution is not automatically stopped. It's your responsability to cooperate with Infinitic to cancel the task execution

{% /callout  %}

Infinitic provides a thread-local `hasTimedOut` property that can be used to check if the task has timed out:

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.Task;
import io.infinitic.tasks.WithTimeout;

public class MyServiceImpl implements MyService, WithTimeout {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { 
        ...
        while(!Task.getHasTimedOut()) {
            ...
        }
     }

    public Double getTimeoutSeconds() {
        return 100.0;
    }
}
```

```kotlin
package com.company.services

import io.infinitic.tasks.Task
import io.infinitic.tasks.WithTimeout

class MyServiceImpl : MyService, WithTimeout {
    override fun myFirstTask(MyFirstTaskInput input) { 
        ...
        while(!Task.hasTimedOut) {
            ...
        }
     }

    override fun getTimeoutSeconds() = 100.0
}
```

{% /codes %}

It is also possible to define a thread-local timeout callback to be executed when the task times out:

{% codes %}

```java
package com.company.services;

import io.infinitic.tasks.Task;
import io.infinitic.tasks.WithTimeout;

public class MyServiceImpl implements MyService, WithTimeout {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) { 
        Task.onTimeOut(() -> {
            ...
        });
        ...
     }

    public Double getTimeoutSeconds() {
        return 100.0;
    }
}
```

```kotlin
package com.company.services

import io.infinitic.tasks.Task
import io.infinitic.tasks.WithTimeout

class MyServiceImpl : MyService, WithTimeout {
    override fun myFirstTask(MyFirstTaskInput input) { 
        Task.onTimeOut {
            ...
        }
        ...
     }

    override fun getTimeoutSeconds() = 100.0
}
```

{% /codes %}

Note: The current thread is automatically canceled when the timeout is reached. To provide time to do the necessary cleanup before the thread is canceled, you can specify a grace period in the `WithTimeout` interface.

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

    public Double getGracePeriodAfterTimeoutSeconds() {
        return 5.0;
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

    override fun getGracePeriodAfterTimeoutSeconds() = 5.0
}
```

{% /codes %}

## Good Practices

### Naming

A task instance is internally described by both its full Java name (package included) and the name of the method called. 
However, you may want to avoid coupling this name with the underlying implementation, for example if you want to rename the class or method, or if you plan to mix programming languages.

Use the `@Name` annotation to declare explicitly the names that Infinitic should use internally. For example:

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

### Versioning

To facilitate easier [versioning of services](/docs/services/versioning) and maintain backward compatibility when modifying Service implementations, we recommend using a single object parameter for both task input and output. This approach provides greater flexibility for future changes without breaking existing task dispatches.

{% callout type="note"  %}

Best practices for methods used as tasks:
 - Use a single parameter of a dedicated input type
 - Return a value of a dedicated output type
 - Both input and output types should be custom objects, not primitive types

{% /callout  %}

This structure allows you to add, remove, or modify fields in the input or output objects without changing the method signature, ensuring smoother version transitions.

Here's an example of this recommended structure:

{% codes %}

```java
package com.company.services;

public interface MyService {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

interface MyService {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

### Handling Errors

When implementing Services, it's important to distinguish between different types of errors and handle them appropriately:

1. **Transient errors**: These are temporary issues, such as database unavailability or API timeouts. For these errors:
   - Your task implementation should throw an Exception.
   - Infinitic will catch the exception and automatically schedule task retries based on your [retry policy](/docs/services/failure#retries-policy).

2. **Unrecoverable technical errors**: These are permanent technical issues that won't be resolved by retrying. For these errors:
   - Allow the task to fail by not catching the exception.
   - Configure the [retry policy](/docs/services/failure#retries-policy) to prevent unnecessary retries.
   - The task will fail, and if it was requested synchronously, the workflow will stop.
   - After deploying a fix, you can [retry failed tasks](/docs/clients/retry-failed-tasks) manually, and the workflows will resume from there.

3. **Business logic errors**: These occur when a task can't be processed due to business rules or constraints. For these situations:
   - Return a clear response status in your task output.
   - Handle this status appropriately in your workflow logic.

### Execution Timeout

We generally advise against setting a task execution timeout. This is because the timeout exception will not be triggered if the worker stops unexpectedly (e.g., due to a system crash or forced shutdown). 

Instead, we recommend defining timeout policies at the workflow level. This involves setting the timeout on the Service interface, which represents the contract between Workflows and Services. When defining this timeout, ensure it accounts for the total duration of all potential retry attempts.

### Idempotency

Infinitic guarantees "at-least-once" processing of tasks. While tasks are typically processed exactly once, hardware or network failures can occasionally lead to duplicate messages. 

Idempotency ensures that multiple executions of the same task produce the same result, preventing unintended side effects in scenarios such as:

1. **Financial transactions**: Ensuring a payment is processed only once, even if the task is executed multiple times.
2. **Inventory management**: Preventing duplicate deductions from stock levels during order processing.
3. **User account creation**: Avoiding the creation of duplicate user accounts if the registration task is retried.

{% callout %}

To implement idempotency, you can use the `Task.taskId` from the [task context](/docs/services/context) as an idempotency key. 

{% /callout %}

### Using APIs

When invoking APIs for task execution, adhere to the following best practices to ensure smooth handling of all situations:

* Limit yourself to one API call per task execution. This ensures that in case of errors, only the failing API call will be retried.
* By default, Infinitic considers the task completed when the service's method returns. Therefore, ensure that the underlying work can be executed synchronously during the API call. If not, for example for long-running tasks, use [delegated tasks](/docs/services/delegated).
* When your API permits an idempotency key, use `Task.taskId`.
* Avoid catching technical errors within your code. If an API fails to respond correctly, ensure that exceptions are thrown. Infinitic will catch them and schedule task retries based on the [retry policy](/docs/services/syntax#retries-policy) defined.
* In cases where an API call completes but the task can not be performed due to business-related issues (e.g., insufficient funds in a bank account), handle these errors by returning to the workflow a code indicating the specific situation. This allows for proper handling within the workflow logic. For this reason, we recommend encapsulating the return value within an object that can also describe any business issues encountered during task execution.

#### Payment Example

The following demonstrate how to use an external SDK, here Stripe, to code tasks. Here we consider a very simple Stripe service with only one `charge` method:

{% codes %}

```java
public interface StripeService {
    PaymentIntentResult charge(Long amount, String currency);
}
```

```kotlin
interface StripeService {
    fun charge(amount: Long, currency: String): PaymentIntentResult
}
```

{% /codes %}

where `PaymentIntentResult` is a custom serializable class similar to `Result<PaymentIntent>`.
Here is an implementation example of this service:

{% codes %}

```java
public class StripeServiceImpl extends StripeService {
    PaymentIntentResult charge(Long amount, String currency) {
        Stripe.apiKey = "sk_test_YourSecretKey"; // Set your secret key here

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setConfirm(true)
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    .build()
                )
                .build();

            String idempotencyKey = Task.taskId; // idempotency key

            PaymentIntent paymentIntent = PaymentIntent.create(params, idempotencyKey);

            return PaymentIntentResult.success(paymentIntent);
        } catch (CardException e) {
            // Card was declined
            return PaymentIntentResult.error(e);
        }
        // Do not catch other technical exceptions
    }
}
```

```kotlin
class StripeServiceImpl: StripeService {
    fun charge(amount: Long, currency: String, type: String): PaymentIntent {
        Stripe.apiKey = "sk_test_YourSecretKey" // Set your secret key here

        try {
            val params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setConfirm(true)
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    .build()
                )
            .build()

            val idempotencyKey = Task.taskId // idempotency key

            val paymentIntent = PaymentIntent.create(params, idempotencyKey)

            return PaymentIntentResult.success(paymentIntent)
        } catch (CardException e) {
            // Card was declined
            return PaymentIntentResult.error(e)
        } 
        // Do not catch other technical exceptions
    }
}
```

{% /codes %}


{% callout type="note"  %}

The Stripe SDK automatically converts errors into Exceptions. But most APIs don't. In that case it's also necessary to verify the HTTP status and raise exceptions manually (usually for error codes greater than or equal to 500). This practice ensures that a technical error prompts a retry.

{% /callout  %}