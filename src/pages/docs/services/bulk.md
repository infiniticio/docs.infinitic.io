---
title: Bulk Tasks
description: Learn how to implement bulk tasks in Infinitic for efficient processing of multiple tasks together, reducing overhead and improving performance.
---

## Purpose

A bulk task is a specialized mode of execution of tasks that processes multiple tasks together in a single execution. 

Here are some common use cases:

1. **Bulk Database Operations**: When dealing with multiple database inserts, updates, or deletes, bulk operations can reduce the number of database connections and transactions.

    Example:

    {% codes %}

    ```java
    @Bulk(maxMessages = 100, maxSeconds = 5.0)
    public Map<String, Boolean> bulkInsertUsers(Map<String, User> users) {
        Set<String> results = database.bulkInsert(users.values());
        return users.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> results.contains(entry.getValue().getId())
            ));
    }
    ```

    ```kotlin
    @Bulk(maxMessages = 100, maxSeconds = 5.0)
    fun bulkInsertUsers(users: Map<String, User>): Map<String, Boolean> {
        val results = database.bulkInsert(users.values)
        return users.mapValues { (_, user) -> results.contains(user.id) }
    }
    ```
    
    {% /codes %}

2. **API Cost Optimization**: When interacting with external APIs that charge per request, gathering multiple operations into a single API call can significantly reduce costs while maintaining functionality.

    Example:

    {% codes %}

    ```java
    @Bulk(maxMessages = 50, maxSeconds = 1.0)
    public Map<String, Boolean> sendBulkEmails(Map<String, EmailRequest> emails) {
        Set<String> results = emailService.sendBulk(emails.values());
        return emails.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> results.contains(entry.getValue().getId())
            ));
    }
    ```

    ```kotlin
    @Bulk(maxMessages = 50, maxSeconds = 1.0)
    fun sendBulkEmails(emails: Map<String, EmailRequest>): Map<String, Boolean> {
        val results = emailService.sendBulk(emails.values)
        return emails.mapValues { (_, email) -> results.contains(email.id) }
    }
    ```

    {% /codes %}

3. **Resource-Intensive Computations**: For tasks that require significant CPU or memory resources, bulk tasks can optimize resource utilization.

    Example:

    {% codes %}

    ```java
    @Bulk(maxMessages = 20, maxSeconds = 10.0)
    public Map<String, AnalysisResult> processLargeDatasets(Map<String, Dataset> datasets) {
        Map<String, AnalysisResult> results = performBulkAnalysis(datasets.values());
        return datasets.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> results.getOrDefault(entry.getValue().getId(), AnalysisResult.empty())
            ));
    }
    ```

    ```kotlin
    @Bulk(maxMessages = 20, maxSeconds = 10.0)
    fun processLargeDatasets(datasets: Map<String, Dataset>): Map<String, AnalysisResult> {
        val results = performBulkAnalysis(datasets.values)
        return datasets.mapValues { (_, dataset) -> results[dataset.id] ?: AnalysisResult.empty() }
    }
    ```

    {% /codes %} 

4. **Aggregated Reporting**: When generating reports that involve data from multiple sources or require complex calculations, bulk tasks can improve overall performance.

    Example:

    {% codes %}

    ```java
    @Bulk(maxMessages = 50, maxSeconds = 30.0)
    public Map<String, Report> generateUserReports(Map<String, ReportRequest> requests) {
        Map<String, Report> reports = reportGenerator.createBulkReports(requests.values());
        return requests.entrySet().stream()
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> reports.getOrDefault(entry.getValue().getUserId(), Report.empty())
            ));
    }
    ```

    ```kotlin
    @Bulk(maxMessages = 50, maxSeconds = 30.0)
    fun generateUserReports(requests: Map<String, ReportRequest>): Map<String, Report> {
        val reports = reportGenerator.createBulkReports(requests.values)
        return requests.mapValues { (_, request) -> reports[request.userId] ?: Report.empty() }
    }
    ```

    {% /codes %} 

## Implementation

To enable bulk tasks, you need to define a new dedicated method in your service implementation. Here's how to do it:

1. Create a new method with the same name as the original task method.
2. Annotate this new method with `@Bulk`, with those parameters:
    - `maxMessages`: The maximum number of tasks to aggregate together.
    - `maxSeconds`: The maximum time to wait (after the first message) before processing an aggregate. (This ensures tasks don't wait indefinitely if the `maxMessages` threshold isn't met.)
3. The method should take a `Map<String, I>` as a parameter, where `I` is the input type of the original task.
4. The method should return a `Map<String, O>`, where `O` is the output type of the original task.
5. The keys in both maps are task IDs, which Infinitic uses to correctly associate inputs with their corresponding outputs.

This approach allows Infinitic to automatically aggregate multiple task invocations into a single execution.

For example:
{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Bulk;

public class MyServiceImpl extends MyService {
    public MyFirstTaskOutput myFirstTask(MyFirstTaskInput input) {
        ...
    }

    @Bulk(maxMessages = 10, maxSeconds = 1.0)
    Map<String, MyFirstTaskOutput> myFirstTask(Map<String, MyFirstTaskInput> input) {
        ... bulk implementation
    }
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Bulk

class MyServiceImpl : MyService {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput {
        ...
    }

    @Bulk(maxMessages = 10, maxSeconds = 1.0)
    private fun myFirstTask(input: Map<String, MyFirstTaskOutput>): Map<String, MyFirstTaskOutput> {
        ... bulk implementation
    }
}
```
    
{% /codes %}

{% callout type="note" %}

If the original method has multiple parameters, the bulk method should have a single parameter of type `Map<String, I>`. Here, `I` is a wrapper object that encapsulates all the parameters of the original method. This wrapper object should have a public constructor with the same parameters as the original method, in the same order.

{% /callout %}

 In some cases, a bulk method may not need to produce any output. For such scenarios:
   - The method can be declared with a `void` return type (`Unit` in Kotlin).
   - No explicit mapping of results to tasks is required.
   - Infinitic will treat the return value of each individual task as `null`.

## Behavior

The bulk process occurs after message deserialization. If a message corresponds to a method with a bulk version, the message is added to the current aggregate for that method. An aggregate is processed when it reaches `maxMessages` or when `maxSeconds` have elapsed since the first message was added to it. The aggregate is then sent to the executor. With an executor concurrency of 10, up to 10 aggregates could potentially be executed in parallel.

Messages in an aggregate are only acknowledged after being succesfuly processed. If processing fails, all messages in the aggregate are considered failed and will be retried individually based on the retry strategy of the corresponding task.

{% callout type="warning" %}

Pulsar brokers have a parameter `maxUnackedMessagesPerConsumer` defaulting to 50,000. Ensure this number is consistent with your bulk and concurrency settings.

If needed, consider also increasing the default value of 1,000 for the `receiverQueue` parameter of a client. This parameter determines how many messages can be loaded directly from the broker to the client.

{% /callout %}


## Optional Bulk Key

By default, bulk tasks are performed on a per-method basis. However, Infinitic provides the flexibility to create more specific bulks using a bulk key. This feature allows you to group related tasks together.

{% callout %}

To use a bulk key, add a String value to the "bulkKey" metadata when dispatching a task.
Every bulk aggregatewill then contain only tasks with the same bulk key value.


{% /callout %}

Here are several examples of scenarios where bulk keys can be particularly useful:

1. **Multi-tenancy**: In a multi-tenant application, you might want to aggregate operations for each tenant separately. By using the tenant ID as the bulk key, you ensure that operations for different tenants don't mix in the same aggregate.

    {% codes %}

    ```java
    Map<String, byte[]> meta = new HashMap<>();
    meta.put("bulkKey", tenantId.getBytes());
    UserService userService = newService(UserService.class, null, meta);
    userService.createUser(newUser);
    ```

    ```kotlin
    val meta = mapOf("bulkKey" to tenantId.toByteArray())
    val userService = newService(UserService::class.java, meta = meta)
    userService.createUser(newUser)
    ```

    {% /codes %}

2. **Geographic Distribution**: For applications serving different regions, you can use the region or country code as the bulk key to group related operations.

    {% codes %}

    ```java
    Map<String, byte[]> meta = new HashMap<>();
    meta.put("bulkKey", countryCode.getBytes());
    ProductService productService = newService(ProductService.class, null, meta);
    productService.updateInventory(productId, newQuantity);
    ```

    ```kotlin
    val meta = mapOf("bulkKey" to countryCode.toByteArray())
    val productService = newService(ProductService::class.java, meta = meta)
    productService.updateInventory(productId, newQuantity)
    ```

    {% /codes %}

3. **Data Partitioning**: When dealing with large datasets, you might partition your data based on certain criteria. Use the partition key as the bulk key to ensure operations on the same partition are aggregated together.

    {% codes %}

    ```java
    Map<String, byte[]> meta = new HashMap<>();
    meta.put("bulkKey", dataPartitionKey.getBytes());
    DataProcessingService dataProcessingService = newService(DataProcessingService.class, null, meta);
    dataProcessingService.processDataChunk(dataChunk);
    ```

    ```kotlin
    val meta = mapOf("bulkKey" to dataPartitionKey.toByteArray())
    val dataProcessingService = newService(DataProcessingService::class.java, meta = meta)
    dataProcessingService.processDataChunk(dataChunk)
    ```

    {% /codes %}


## Bulk Task Context

For convenience, a `bulkKey` String property  - initialized from the service metadata - has been added to the [task context](/docs/services/context). 

When processing tasks in bulk, you can access the specific [context](/docs/services/context) of a task through: 

 {% codes %}

```java
TaskContext context = Task.getContext(taskId);
```

```kotlin
val context = Task.getContext(taskId)
```

{% /codes %}