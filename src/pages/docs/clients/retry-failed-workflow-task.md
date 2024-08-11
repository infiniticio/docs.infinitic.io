---
title: Retry Failed Workflow Task
description: This page provides guidance on retrying failed workflows in Infinitic, focusing on instances where errors occur within the workflow definition, causing stalling. It explains how to resume workflow instances by targeting specific IDs or tags for retry after correcting the workflow definition, ensuring seamless continuation of workflow execution.
---
When an error occured within the workflow definition itself, the corresponding instance is stalled.
The worklow itself is executed in a special task called WorkflowTask.
After having fixed the workflow definition, the instance can be resume by using:

{% codes %}

```java
// stub targeting a running HelloWorkflow workflow with a specific id
HelloWorkflow w =
    client.getWorkflowById(HelloWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// retry the workflow task for this instance
client.retryWorkflowTask(w);
```

```kotlin
// stub targeting a running HelloWorkflow workflow with a specific id
val w : HelloWorkflow =
    client.getWorkflowById(HelloWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// retry the workflow task for this instance
client.retryWorkflowTask(w)
```

{% /codes %}

We can also target workflows by tag:

{% codes %}

```java
// stub targeting a running HelloWorkflow workflow with a specific id
HelloWorkflow w =
    client.getWorkflowByTag(HelloWorkflow.class, "foo");

// retry the workflow task for this instance
client.retryWorkflowTask(w);
```

```kotlin
// stub targeting a running HelloWorkflow workflow with a specific id
val w : HelloWorkflow =
    client.getWorkflowByTag(HelloWorkflow::class.java, "foo")

// retry the workflow task for this instance
client.retryWorkflowTask(w)
```

{% /codes %}

The `retryWorkflowTask` method returns when the adhoc message is sent to Pulsar.
We can use the `retryWorkflowTaskAsync` method if we want to send the adhoc message asynchronously.
