---
title: Send A Signal To A Workflow
description: Quidem magni aut exercitationem maxime rerum eos.
---

It is possible to send a signal to running workflows.
Sending signals is done through [channels](/docs/workflows/signals) that must be described in the workflow interface, for example:

{% codes %}

```java
public interface HelloWorldWorkflow {
    SendChannel<String> getNotificationChannel();

    String greet(String name);
}
```

```kotlin
interface HelloWorldWorkflow {
    val notificationChannel: SendChannel<String>

    fun greet(name: String): String
}
```

{% /codes %}

This signal can be any [serializable](/docs/references/serializability) object of the type described in the workflow interface.

We can send an object to a running instance targeted by id:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w = 
    client.getWorkflowById(HelloWorldWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// send a signal to this instance through a channnel
w.getNotificationChannel().send("foobar");
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow =
    client.getWorkflowById(HelloWorldWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// send a signal to this instance through a channnel
w.notificationChannel.send("foobar")
```

{% /codes %}

or running instances targeted by tag:

{% codes %}

```java
// stub targeting running HelloWorld workflows with a specific tag
HelloWorldWorkflow w = 
    client.getWorkflowByTag(HelloWorldWorkflow.class, "foo");

// send a signal to those instances through a channnel
w.getNotificationChannel().send("foobar");
```

```kotlin
// stub targeting running HelloWorld workflows with a specific tag
val w : HelloWorldWorkflow = 
    client.getWorkflowByTag(HelloWorldWorkflow::class.java, "tag")

// send a signal to those instances through a channnel
w.notificationChannel.send("foobar")
```

{% /codes %}


