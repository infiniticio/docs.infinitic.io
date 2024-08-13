---
title: Send A Signal To A Workflow
description: This page outlines how to send signals to running workflows in Infinitic, utilizing channels defined in the workflow interface. Signals, which can be any serializable object, are sent to either a specific workflow instance by ID or to instances tagged with a specific label. This functionality is critical for developers needing to communicate with and alter the state of running workflows dynamically within their applications.
---
It is possible to send a signal to running workflows.
Sending signals is done through [channels](/docs/workflows/signals) that must be described in the workflow interface, for example:

{% codes %}

```java
public interface HelloWorkflow {
    SendChannel<String> getNotificationChannel();

    String greet(String name);
}
```

```kotlin
interface HelloWorkflow {
    val notificationChannel: SendChannel<String>

    fun greet(name: String): String
}
```

{% /codes %}

This signal can be any [serializable](/docs/references/serialization) object of the type described in the workflow interface.

We can send an object to a running instance targeted by id:

{% codes %}

```java
// stub targeting a running HelloWorkflow workflow with a specific id
HelloWorkflow w = 
    client.getWorkflowById(HelloWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// send a signal to this instance through a channnel
w.getNotificationChannel().send("foobar");
```

```kotlin
// stub targeting a running HelloWorkflow workflow with a specific id
val w : HelloWorkflow =
    client.getWorkflowById(HelloWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// send a signal to this instance through a channnel
w.notificationChannel.send("foobar")
```

{% /codes %}

or running instances targeted by tag:

{% codes %}

```java
// stub targeting running HelloWorkflow workflows with a specific tag
HelloWorkflow w = 
    client.getWorkflowByTag(HelloWorkflow.class, "foo");

// send a signal to those instances through a channnel
w.getNotificationChannel().send("foobar");
```

```kotlin
// stub targeting running HelloWorkflow workflows with a specific tag
val w : HelloWorkflow = 
    client.getWorkflowByTag(HelloWorkflow::class.java, "tag")

// send a signal to those instances through a channnel
w.notificationChannel.send("foobar")
```

{% /codes %}
