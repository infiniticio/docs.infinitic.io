---
title: Start New Workflows
description: Quidem magni aut exercitationem maxime rerum eos.
---

## Asynchronous dispatch

The asynchronous dispatch of a new workflow starts a new instance without waiting for its completion:

![Asynchronous dispatch](/img/client-workflow-async@2x.png)

We can start a new workflow using this stub:

{% codes %}

```java
// Stub of a new HelloWorld workflow
HelloWorldWorkflow w = client.newWorkflow(HelloWorldWorkflow.class);

// synchronous dispatch of a new workflow
Deferred<String> deferred = client.dispatch(w::greet, "Infinitic");
```

```kotlin
// Stub of a new HelloWorld workflow
val w : HelloWorldWorkflow = client.newWorkflow(HelloWorldWorkflow::class.java)

// asynchronous dispatch of a new workflow
val deferred : Deferred<String> = client.dispatch(w::greet, "Infinitic") }
```

{% /codes %}

The `dispatch` method returns when the ad-hoc message has been received by Pulsar. If we do not want to wait for this, we can use `dispatchAsync` instead:

{% codes %}

```java
CompletableFuture<Deferred<String>> future = 
    client.dispatchAsync(w::greet, "Infinitic");
```

```kotlin
val future: CompletableFuture<Deferred<String>> = 
    client.dispatchAsync(w::greet, "Infinitic") }
```

{% /codes %}

This CompletableFuture returns when the ad-hoc message has been received by Pulsar.

The `Deferred<T>` object can be used to:

- retrieve the underlying workflow's `id`:

  {% codes %}

  ```java
  String id = deferred.id;
  ```

  ```kotlin
  val id: String = deferred.id
  ```

  {% /codes %}

- wait for the synchronous completion:

  {% codes %}

  ```java
  T result = deferred.await();
  ```

  ```kotlin
  val result: T = deferred.await()
  ```

  {% /codes %}

  where `T` is the actual return type.

    {% callout type="warning"  %}

  The `await()` method blocks the current thread of the client - up to the workflow termination. It will throw an `UnknownWorkflowException` if the workflow is already terminated.

    {% /callout  %}

## Synchronous dispatch

The synchronous dispatch of a new workflow starts a new instance and waits for its completion:

![Synchronous dispatch](/img/client-workflow-sync@2x.png)

We can dispatch a workflow and wait for its completion synchronously using the stub of a new workflow:

{% codes %}

```java
// Stub of a new HelloWorld workflow
HelloWorldWorkflow w = client.newWorkflow(HelloWorldWorkflow.class);

// synchronous dispatch of a new workflow
String greeting = w.greet("Infinitic");
```

```kotlin
// Stub of a new HelloWorld workflow
val w : HelloWorldWorkflow = client.newWorkflow(HelloWorldWorkflow::class.java)

// synchronous dispatch of a new workflow
val greeting = w.greet("Infinitic")
```

{% /codes %}

When dispatching a workflow, the client serializes parameters and sends them through Pulsar to the [workflow [worker](/docs/workflows/workers), which will orchestrate the workflow. Eventually, the return value will be serialized and sent back to the client through Pulsar.


