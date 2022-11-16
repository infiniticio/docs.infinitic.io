---
title: Creating Workflow Stubs
description: Quidem magni aut exercitationem maxime rerum eos.
---

The Infinitic client manages workflows through [stubs](https://en.wikipedia.org/wiki/Method_stub) built from the workflow interface.

Here is an example of workflow interface from our [Hello World](/docs/introduction/hello-world) app:

{% codes %}

```java
public interface HelloWorldWorkflow {
    String greet(String name);
}
```

```kotlin
interface HelloWorldWorkflow {
    fun greet(name: String): String
}
```

{% /codes %}

Using this interface, an Infinitic client can create stubs that behaves syntactically as instances of such workflow.
Stubs are used to trigger actions such as:

- starting a new workflow
- cancelling running workflows
- sending a signal to running workflows
- starting a new method on running workflows

## Stub of new workflow

The client has a `newWorkflow` method to create the stub of a new workflow:

{% codes %}

```java
HelloWorldWorkflow w = 
    client.newWorkflow(HelloWorldWorkflow.class);
```

```kotlin
val w : HelloWorldWorkflow = 
    client.newWorkflow(HelloWorldWorkflow::class.java)
```

{% /codes %}

We can also add tags to this stub. Those tags will be attached to workflow instances started with this stub.

{% codes %}

```java
HelloWorldWorkflow w = 
    client.newWorkflow(HelloWorldWorkflow.class, Set.of("foo", "bar"));
```

```kotlin
val w : HelloWorldWorkflow = 
    client.newWorkflow(HelloWorldWorkflow::class.java, tags = setOf("foo", "bar"))
```

{% /codes %}

The stub of new workflow can be used to start a new workflow instance.
It can be used multiple times to start multiple instances.

## Running workflow stub

A workflow is said running, as long as it is neither completed neither canceled.

We can create the stub of a running workflow from its `id`:

{% codes %}

```java
HelloWorldWorkflow w = 
    client.getWorkflowById(HelloWorldWorkflow.class, id);
```

```kotlin
val w : HelloWorldWorkflow = 
    client.getWorkflowById(HelloWorldWorkflow::class.java, id)
```

{% /codes %}

Alternatively, we can create a stub targeting all running workflow having a given tag:

{% codes %}

```java
HelloWorldWorkflow w =
    client.getWorkflowByTag(HelloWorldWorkflow.class, "foo");
```

```kotlin
val w: HelloWorldWorkflow = 
    client.getWorkflowByTag(HelloWorldWorkflow::class.java, tag = "foo")
```

{% /codes %}

The stub of running workflows can be used to apply actions to the targeted workflows:

- cancelling
- sending signals
- starting new methods

{% callout type="note"  %}

Creating a stub has no side effect. It just creates an object that contains the provided info.

{% /callout  %}
