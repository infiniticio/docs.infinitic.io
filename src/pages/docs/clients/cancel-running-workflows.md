---
title: Cancel Running Workflows
description: Quidem magni aut exercitationem maxime rerum eos.
---

The cancellation of a workflow stops its execution and delete its state.

We can cancel running workflows by using a stub that target them by id:

{% codes %}

```java
HelloWorldWorkflow w = 
    client.getWorkflowById(HelloWorldWorkflow.class, id);

client.cancel(w);
```

```kotlin
val w : HelloWorldWorkflow = 
    client.getWorkflowById(HelloWorldWorkflow::class.java, id)

client.cancel(w)
```

{% /codes %}


or by tag:

{% codes %}

```java
HelloWorldWorkflow w = 
    client.getWorkflowByTag(HelloWorldWorkflow.class, "foo");

client.cancel(w);
```

```kotlin
val w : HelloWorldWorkflow = 
    client.getWorkflowByTag(HelloWorldWorkflow::class.java, "foo")

client.cancel(w)
```

{% /codes %}


{% callout type="note"  %}

Cancelling a workflow cancels its child workflows as well.

If we do not want this behavior, we should dispatch our child workflow from a task.

{% /callout  %}

The direct cancellation of a child workflow will trigger a `CanceledWorkflowException` in the parent workflow 
if waiting for its completion.

The `cancel` method waits for the adhoc message to be sent to Pulsar.
If we prefer to not wait for this message to be sent, we can use the `cancelAsync` method.
