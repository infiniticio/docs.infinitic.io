---
title: Retry Failed Tasks
description: Quidem magni aut exercitationem maxime rerum eos.
---

It is possible to retry one or more tasks from running workflows. Those tasks can be targeted by id, by status or by class.

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w =
    client.getWorkflowById(HelloWorldWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c);

// retry a specific task from this instance
client.retryTasks(w, "f2ebeb38-5329-4348-90d4-615b4a5c2214");

// retry all failed tasks
client.retryTasks(w, DeferredStatus.FAILED);

// retry all failed HelloWorldService tasks
client.retryTasks(w, DeferredStatus.FAILED, HelloWorldService.class);

```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowById(HelloWorldWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// retry a specific task from this instance
client.retryTasks(w, "f2ebeb38-5329-4348-90d4-615b4a5c2214")

// retry all failed tasks of this instance
client.retryTasks(w, DeferredStatus.FAILED)

// retry all failed HelloWorldService tasks of this instance
client.retryTasks(w, DeferredStatus.FAILED, HelloWorldService::class.java)
```

{% /codes %}


We can also retry tasks on running workflows targeted by tag.

The `retryTasks` method returns when the adhoc message is sent to Pulsar.
We can use the `retryTasksAsync` method if we want to send the adhoc message asynchronously.

{% callout type="note"  %}

Tasks are considered failed when all automatic retries have failed.

{% /callout  %}
