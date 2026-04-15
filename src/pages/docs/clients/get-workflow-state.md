---
title: Get Workflow State
description: This page explains how to retrieve the complete state of a running or completed workflow from storage in Infinitic as a JSON string ready for display. It covers accessing workflow state directly from the database, including automatic decompression, deserialization, and conversion to a readable JSON representation.
---

It is possible to retrieve the complete internal state of a workflow directly from storage as a JSON string ready for display. This provides access to all workflow execution details including running methods, workflow properties, buffered messages, and more.

{% callout type="warning"  %}

This feature requires storage to be configured in the client. If storage is not configured, calling `getWorkflowStateJsonById` will throw an `IllegalStateException`.

{% /callout  %}

## Configuration

First, configure storage in your Infinitic client:

{% codes %}

```java
import io.infinitic.clients.InfiniticClient;
import io.infinitic.storage.config.PostgresStorageConfig;

// Configure storage (PostgreSQL example)
PostgresStorageConfig storage = PostgresStorageConfig.builder()
    .setHost("localhost")
    .setPort(5432)
    .setDatabase("infinitic")
    .setUsername("user")
    .setPassword("password")
    .build();

// Create client with storage
InfiniticClient client = InfiniticClient.builder()
    .setTransport(transport)
    .setStorage(storage)
    .build();

```

```kotlin
import io.infinitic.clients.InfiniticClient
import io.infinitic.storage.config.PostgresStorageConfig

// Configure storage (PostgreSQL example)
val storage = PostgresStorageConfig.builder()
    .setHost("localhost")
    .setPort(5432)
    .setDatabase("infinitic")
    .setUsername("user")
    .setPassword("password")
    .build()

// Create client with storage
val client = InfiniticClient.builder()
    .setTransport(transport)
    .setStorage(storage)
    .build()
```

{% /codes %}

## Retrieving Workflow State JSON

Once storage is configured, you can retrieve the state of any workflow by its ID as a pretty-printed JSON string:

{% codes %}

```java
// Get JSON state for a specific workflow
String stateJson = client.getWorkflowStateJsonById("05694902-5aa4-469f-824c-7015b0df906c");

if (stateJson != null) {
    System.out.println(stateJson);
} else {
    System.out.println("Workflow not found or already completed");
}

```

```kotlin
// Get JSON state for a specific workflow
val stateJson: String? = client.getWorkflowStateJsonById("05694902-5aa4-469f-824c-7015b0df906c")

stateJson?.let(::println) ?: println("Workflow not found or already completed")
```

{% /codes %}

The generated JSON is intended for inspection and display. It expands internal `SerializedData` values and renders metadata in a readable JSON form.

## Workflow State Contents

The workflow state JSON contains comprehensive information about the workflow:

- workflowId: Unique identifier for the workflow instance
- workflowName: Name of the workflow
- workflowVersion: Version of the workflow implementation
- workflowTags: Tags associated with the workflow
- workflowMeta: Metadata attached to the workflow
- workflowMethods: List of running workflow methods with their execution state
- runningWorkflowTaskId: ID of the currently executing workflow task (if any)
- currentPropertiesNameHash: Current values of workflow properties
- messagesBuffer: Messages buffered while a workflow task is running
- receivingChannels: Channels currently receiving signals

## Use Cases

### Debugging

Inspect workflow state to understand why a workflow is stuck or behaving unexpectedly:

{% codes %}

```java
String stateJson = client.getWorkflowStateJsonById(workflowId);
if (stateJson != null) {
    System.out.println(stateJson);
}
```

```kotlin
val stateJson = client.getWorkflowStateJsonById(workflowId)
if (stateJson != null) {
    println(stateJson)
}
```

{% /codes %}

### Monitoring

Check the execution progress of running workflows:

{% codes %}

```java
String stateJson = client.getWorkflowStateJsonById(workflowId);
if (stateJson != null) {
    System.out.println(stateJson);
}
```

```kotlin
val stateJson = client.getWorkflowStateJsonById(workflowId)
stateJson?.let {
    println(it)
}
```
{% /codes %}

## Storage Support

The method automatically handles:

- Compression: Supports gzip, bzip2, and deflate compression algorithms
- Deserialization: Converts Avro binary format to workflow state objects internally
- JSON Rendering: Produces a readable JSON representation suitable for display
- Multiple Databases: Works with Redis, PostgreSQL, MySQL, and in-memory storage

{% callout type="note"  %}

The `getWorkflowStateJsonById` method returns `null` for workflows that don't exist or have been completed and removed from storage.

{% /callout  %}

## Async Access

Infinitic proposes also an asynchronous version of the method:

{% codes %}

```java
CompletableFuture<String> getWorkflowStateJsonByIdAsync(String workflowId);
```

```kotlin
suspend fun getWorkflowStateJsonByIdSuspend(workflowId: String): String?
```

{% /codes %}
