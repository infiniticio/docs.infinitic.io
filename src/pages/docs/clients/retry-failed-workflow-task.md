---
title: Retry Failed Workflow Task
description: Quidem magni aut exercitationem maxime rerum eos.
---

When an error occured within the workflow definition itself, the corresponding instance is stalled.
The worklow itself is executed in a special task called WorkflowTask.
After having fixed the workflow definition, the instance can be resume by using:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w =
    client.getWorkflowById(HelloWorldWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// retry the workflow task for this instance
client.retryWorkflowTask(w);
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowById(HelloWorldWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// retry the workflow task for this instance
client.retryWorkflowTask(w)
```

{% /codes %}


We can also target workflows by tag:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w =
    client.getWorkflowByTag(HelloWorldWorkflow.class, "foo");

// retry the workflow task for this instance
client.retryWorkflowTask(w);
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowByTag(HelloWorldWorkflow::class.java, "foo")

// retry the workflow task for this instance
client.retryWorkflowTask(w)
```

{% /codes %}

The `retryWorkflowTask` method returns when the adhoc message is sent to Pulsar.
We can use the `retryWorkflowTaskAsync` method if we want to send the adhoc message asynchronously.
