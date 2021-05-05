---
title: Managing Tasks
description: ""
position: 3.2
category: "Client"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic client lets us start and cancel tasks, usually from your Web App controllers.

## Starting New Tasks

### New task stub

The Infinitic client manages tasks through [stubs](https://en.wikipedia.org/wiki/Method_stub) built from the task interface. Here is an example of task interface from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group><code-block label="Java" active>

```java
public interface HelloWorldService {
    String sayHello(String name);

    String addEnthusiasm(String str);
}
```

</code-block><code-block label="Kotlin">

```kotlin
interface HelloWorldService {
    fun sayHello(name: String?): String

    fun addEnthusiasm(str: String): String
}
```

</code-block></code-group>

Using this interface, an Infinitic client can create a stub that behaves syntactically as a new instance of this task:

<code-group><code-block label="Java" active>

```java
HelloWorldService helloWorldService = client.newTask(HelloWorldService.class);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorldService = client.newTask<HelloWorldService>()
```
</code-block></code-group>

We can also add tags to this instance. It can be very useful to target later this instance by tag:

<code-group><code-block label="Java" active>

```java
Set<String> tags = new HashSet<>();
tags.add("foo");
tags.add("bar");

HelloWorldService helloWorldService = client.newTask(HelloWorldService.class, tags);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorldService = client.newTask<HelloWorldService>(tags = setOf("foo", "bar"))
```
</code-block></code-group>

### Synchronous start

This stub can be used to trigger a synchronous execution:

<code-group><code-block label="Java" active>

```java
String hello = helloWorldService.sayHello("Infinitic");
```

</code-block><code-block label="Kotlin">

```kotlin
val hello = helloWorldService.sayHello("Infinitic")
```

</code-block></code-group>

When dispatching a task, the client serializes parameters and send them through Pulsar to the [task engine](/components/architecture#task-engine), that will make sure the task is processed, managing retries if needed. Eventually, the return value will be serialized and sent back to the client through Pulsar:

<img src="/client-task-sync@2x.png" class="img" width="1280" height="640" alt=""/>

### Asynchronous start

Of course, we can also trigger an asynchronous execution:

<code-group><code-block label="Java" active>

```java
Deferred<String> deferred = client.async(helloWorldService, t -> t.sayHello("Infinitic"));
```

</code-block><code-block label="Kotlin">

```java
val deferred = client.async(helloWorldService) { sayHello("Infinitic") }
```

</code-block></code-group>

<img src="/client-task-async@2x.png" class="img" width="1280" height="640" alt=""/>

Here, the returned value is a `Deferred<T>`.

To wait for the synchronous completion:

<code-group><code-block label="Java" active>

```java
T result = deferred.await();
```
</code-block><code-block label="Kotlin">

```java
val result: T = deferred.await()
```
</code-block></code-group>

where `T` is the actual return type.

<alert type="warning">

The `await()` method blocks the current thread of the client - up to the task termination. It will throw an `UnknownTask` exception if the task is already terminated.

</alert>

To retrieve the underlying task's `id`:

<code-group><code-block label="Java" active>

```java
java.util.UUID id = deferred.id;
```
</code-block><code-block label="Kotlin">

```java
val id: java.util.UUID = deferred.id
```
</code-block></code-group>

 We can use this id later to manage this task while not yet completed or canceled.

## Managing Running Tasks

A task is said running, as long as it is neither completed neither canceled.

### Running task stub

We can create the stub of a running task from its id:

<code-group><code-block label="Java" active>

```java
HelloWorldService helloWorldService = client.getTask(HelloWorldService.class, id);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorldService = client.getTask<HelloWorldService>(id)
```
</code-block></code-group>

Alternatively, we can create a stub targeting all running tasks having a tag "foo":

<code-group><code-block label="Java" active>

```java
HelloWorldService helloWorldService = client.getTask(HelloWorldService.class, "foo");
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorldService = client.getTask<HelloWorldService>(tag = "foo")
```
</code-block></code-group>

### Retry a running task

Using this stub, we can force the retry of this task:

<code-group><code-block label="Java" active>

```java
infiniticClient.retry(carRentalService);
```

</code-block><code-block label="Kotlin">

```kotlin
infiniticClient.retry(carRentalService)
```

</code-block></code-group>

### Cancel a running task

Or cancel this task:

<code-group><code-block label="Java" active>

```java
infiniticClient.cancel(carRentalService);
```

</code-block><code-block label="Kotlin">

```kotlin
infiniticClient.cancel(carRentalService)
```

</code-block></code-group>
