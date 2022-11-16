---
title: Complete Running Timers
description: Quidem magni aut exercitationem maxime rerum eos.
---

Workflows [are able to wait](/docs/workflows/waiting) for a specific time or duration.
If we want to manually complete the waiting, we can do that through the `completeTimers` method of the client.

After having fixed the workflow definition, the instance can be resume by using:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w =
    client.getWorkflowById(HelloWorldWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// complete current awaiting timers
client.completeTimers(w);
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowById(HelloWorldWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// complete current awaiting timers
client.completeTimers(w)
```

{% /codes %}


We can also target workflows by tag:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w =
    client.getWorkflowByTag(HelloWorldWorkflow.class, "foo");

// complete current awaiting timers
client.completeTimers(w);
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowByTag(HelloWorldWorkflow::class.java, "foo")

// complete current awaiting timers
client.completeTimers(w)
```

{% /codes %}

The `completeTimers` method returns when the adhoc message is sent to Pulsar.
We can use the `completeTimersAsync` method if we want to send the adhoc message asynchronously.

{% callout type="note"  %}

The `completeTimers` method completes only the timers currently waiting on the main method of the targeted workflow(s).

{% /callout  %}

If we dispatched a [parallel method](/docs/workflows/parallel#parallel-methods), and want to complete timers on this method, we can do it with:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w =
    client.getWorkflowById(HelloWorldWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// complete current awaiting timers on method running with this id
client.completeTimers(w, "a2ea0647-4e22-4086-9a97-d28c815713b7");
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowById(HelloWorldWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// complete current awaiting timers on method running with this id
client.completeTimers(w, "a2ea0647-4e22-4086-9a97-d28c815713b7")
```

{% /codes %}
