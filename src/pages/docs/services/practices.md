---
title: Good Practices
description: Discover best practices for using Infinitic services, including task serialization, thread safety, and service versioning. Learn how to ensure smooth updates and maintain backward compatibility in your service implementations.
---
## Constraints

Upon receiving a message instructing to execute a task, a service worker instantiates the service class, deserializes the parameters, executes the requested method and returns the serialized result:

{% callout type="warning"  %}

The parameters and return value of a method used as task must be [serializable](/docs/references/serialization).

{% /callout  %}

If you chose to have several executions in parallel (`concurrency` > 1), they must not interfere with each other:

{% callout type="warning"  %}

A method used as a task must be thread-safe.

{% /callout  %}

If your method uses multi-threading, **you should keep in mind that a task is considered completed when the method returns**. Also, any exception occurring on another thread than the one that initiated the execution of the task will be unknown to Infinitic.

## Service Versioning

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

## Implementation Decoupling

A task instance is internally described by both its full Java name (package included) and the name of the method called. 
However, you may want to avoid coupling this name with the underlying implementation, for example if you want to rename the class or method, or if you plan to mix programming languages.

Infinitic provides a `@Name` annotation that lets you declare explicitly the names that Infinitic should use internally. For example:

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

## Task Errors

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

## Task Execution Timeout

We generally advise against setting a task execution timeout. This is because the timeout exception will not be triggered if the worker stops unexpectedly (e.g., due to a system crash or forced shutdown). 

Instead, we recommend defining timeout policies at the workflow level. This involves setting the timeout on the Service interface, which represents the contract between Workflows and Services. When defining this timeout, ensure it accounts for the total duration of all potential retry attempts.

## Task Idempotency

Infinitic guarantees "at-least-once" processing of tasks. While tasks are typically processed exactly once, hardware or network failures can occasionally lead to duplicate messages. 

Idempotency ensures that multiple executions of the same task produce the same result, preventing unintended side effects in scenarios such as:

1. **Financial transactions**: Ensuring a payment is processed only once, even if the task is executed multiple times.
2. **Inventory management**: Preventing duplicate deductions from stock levels during order processing.
3. **User account creation**: Avoiding the creation of duplicate user accounts if the registration task is retried.

{% callout %}

To implement idempotency, you can use the `Task.taskId` from the [task context](/docs/services/context) as an idempotency key. 

{% /callout %}

## Task using APIs

When invoking APIs for task execution, adhere to the following best practices to ensure smooth handling of all situations:

* Limit yourself to one API call per task execution. This ensures that in case of errors, only the failing API call will be retried.
* By default, Infinitic considers the task completed when the service's method returns. Therefore, ensure that the underlying work can be executed synchronously during the API call. If not, for example for long-running tasks, use [delegated tasks](/docs/services/delegated).
* When your API permits an idempotency key, use `Task.taskId`.
* Avoid catching technical errors within your code. If an API fails to respond correctly, ensure that exceptions are thrown. Infinitic will catch them and schedule task retries based on the [retry policy](/docs/services/syntax#retries-policy) defined.
* In cases where an API call completes but the task can not be performed due to business-related issues (e.g., insufficient funds in a bank account), handle these errors by returning to the workflow a code indicating the specific situation. This allows for proper handling within the workflow logic. For this reason, we recommend encapsulating the return value within an object that can also describe any business issues encountered during task execution.

### Payment Example

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


