---
title: Delegated Task
description: Learn about delegated tasks in Infinitic, their purpose, and common use cases such as long-running external processes and asynchronous API calls.
---

## Delegated task purpose

In certain situations, completing a task within the Service worker may not be feasible. For instance, when the task is overseen by a system external to Infinitic, and the worker cannot synchronously wait for its conclusion. In such cases, the Service worker delegates the task's completion, yet Infinitic still requires awareness of when the task is finished and the corresponding return value.


Here are some common use cases for delegated tasks:

1. **Long-Running External Processes**: When a task involves a long-running process managed by an external system, such as a data migration job or a complex computation on a separate cluster.

   Example:

   {% codes %}

   ```java
   @Delegated
   public JobResult startDataMigration(MigrationConfig config) {
       String jobId = externalJobService.initiateDataMigration(config);
       // Return null or a placeholder result, actual result will be set later
       return null;
   }
   ```

   ```kotlin
   @Delegated
   fun startDataMigration(config: MigrationConfig): JobResult? {
       val jobId = externalJobService.initiateDataMigration(config)
       // Return null or a placeholder result, actual result will be set later
       return null
   }
   ```

   {% /codes %}

2. **Asynchronous API Calls**: When interacting with external APIs that use webhooks or other asynchronous patterns to notify of task completion.

   Example:

   {% codes %}

   ```java
   @Delegated
   public PaymentResult processPayment(PaymentRequest request) {
       String transactionId = paymentGateway.initiatePayment(request);
       // Store transactionId for later use when webhook is received
       return null;
   }
   ```

   ```kotlin
   @Delegated
   fun processPayment(request: PaymentRequest): PaymentResult? {
       val transactionId = paymentGateway.initiatePayment(request)
       // Store transactionId for later use when webhook is received
       return null
   }
   ```

   {% /codes %}

3. **Human-in-the-Loop Processes**: For tasks that require human intervention or approval before completion.

   Example:

   {% codes %}

   ```java
   @Delegated
   public ApprovalResult requestManagerApproval(ExpenseReport report) {
       String approvalId = approvalSystem.submitForReview(report);
       // Return null, actual result will be set when manager approves/rejects
       return null;
   }
   ```

   ```kotlin
   @Delegated
   fun requestManagerApproval(report: ExpenseReport): ApprovalResult? {
       val approvalId = approvalSystem.submitForReview(report)
       // Return null, actual result will be set when manager approves/rejects
       return null
   }
   ```

   {% /codes %}

In each of these cases, the task is initiated but not immediately completed. The actual completion and result setting would be done later using the `completeDelegatedTask` method of the Infinitic client.


## Delegated task implementation

To signify to Infinitic that a task remains incomplete upon the method's return, simply include a @Delegated annotation in your task definition. For instance,

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;
import io.infinitic.annotations.Delegated;

@Name(name = "MyService")
public interface MyService {
    @Delegated
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name
import io.infinitic.annotations.Delegated

@Name("MyService")
interface MyService {
    @Delegated
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput?

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

In the example above, the task `myFirstTask` is delegated.  It is the responsibility of the implementation to initiate the task on the external system. It's important to note that the implementation still needs to return an object of the correct type, but you have the option to return null.

## Delegated task completion

You can use an Infinitic client to signify to Infinitic that the delegated task is completed:

{% codes %}

```java
client.completeDelegatedTask(
    serviceName,
    taskId,
    result
);
```

```kotlin
client.completeDelegatedTask(
    serviceName,
    taskId,
    result
)
```

{% /codes %}

Where:

* `serviceName`:  the name of the service. Within the task execution in the Infinitic worker, you can retrieve it through the [task&#39;s context](/docs/services/syntax#task-context);
* `taskId`: the ID of the task. Within the task execution in the Infinitic worker, you can retrieve it through the [task&#39;s context](/docs/services/syntax#task-context);
* `result`: The outcome of the delegated task.

{% callout type="warning"  %}

It's your responsability to provide a `result` with the right type defined in the Service interface. Failing to do so will result in an error being triggered when you attempt to utilize this result in your workflow, and your workflow instance will become stuck.

{% /callout  %}
