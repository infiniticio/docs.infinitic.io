---
title: Managing Workflows
description: ""
position: 3.2
category: "Client"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic client let us start and cancel workflows, usually from our Web App controllers.


## Starting New Workflows

### New workflow stub

The Infinitic client manages workflows through [stubs](https://en.wikipedia.org/wiki/Method_stub) built from the workflow interface. Here is an example of workflow interface from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group><code-block label="Java" active>

```java
public interface HelloWorld {
    String greet(@Nullable String name);
}
```

</code-block><code-block label="Kotlin">

```kotlin
interface HelloWorld {
    fun greet(name: String?): String
}
```

</code-block></code-group>

Using this interface, an Infinitic client can create a stub that behaves syntactically as an instance of this workflow:

<code-group><code-block label="Java" active>

```java
HelloWorld helloWorld = client.newWorkflow(HelloWorld.class);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorld = client.newWorkflow<HelloWorld>()
```
</code-block></code-group>

We can also add tags to this instance. It can be very useful to target later this instance by tag:

<code-group><code-block label="Java" active>

```java
Set<String> tags = new HashSet<>();
tags.add("foo");
tags.add("bar");

HelloWorld helloWorld = client.newWorkflow(HelloWorld.class, tags);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorld = client.newWorkflow<HelloWorld>(tags = setOf("foo", "bar"))
```
</code-block></code-group>


### Synchronous start

This stub can be used to trigger a synchronous execution:

<code-group><code-block label="Java" active>

```java
String greeting = helloWorld.greet("Infinitic");
```

</code-block><code-block label="Kotlin">

```kotlin
val greeting = helloWorld.greet("Infinitic")
```

</code-block></code-group>

When dispatching a workflow, the client serializes parameters and send them through Pulsar to the [workflow engine](/components/architecture#workflow-engine), that will orchestrate the workflow. Eventually, the return value will be serialized and sent back to the client through Pulsar:

<img src="/client-workflow-sync@2x.png" class="img" width="1280" height="640" alt=""/>

### Asynchronous start

Of course, the client can also trigger an asynchronous execution:

<code-group><code-block label="Java" active>

```java
Deferred<String> deferred = client.async(helloWorldService, t -> t.sayHello("Infinitic"));
```

</code-block><code-block label="Kotlin">

```java
val deferred: Deferred<String> = client.async(helloWorldService) { sayHello("Infinitic") }
```

</code-block></code-group>

<img src="/client-workflow-async@2x.png" class="img" width="1280" height="640" alt=""/>


We can use the returned `Deferred<T>` to:

- wait for the synchronous completion:

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

    The `await()` method blocks the current thread of the client - up to the workflow termination. It will throw an `UnknownWorkflow` exception if the workflow is already terminated.

    </alert>

- retrieve the underlying workflow's `id`:

    <code-group><code-block label="Java" active>

    ```java
    java.util.UUID id = deferred.id;
    ```
    </code-block><code-block label="Kotlin">

    ```java
    val id: java.util.UUID = deferred.id
    ```
    </code-block></code-group>


## Managing Running Workflows

A workflow is said running, as long as it is neither completed neither canceled.

### Running workflow stub

We can create the stub of a running workflow from its `id`:

<code-group><code-block label="Java" active>

```java
HelloWorld helloworld = client.getWorkflow(HelloWorld.class, id);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloworld: HelloWorld = client.getWorkflow<HelloWorld>(id)
```
</code-block></code-group>

Alternatively, we can create a stub targeting all running workflow having a given tag:

<code-group><code-block label="Java" active>

```java
HelloWorld helloworld = client.getWorkflow(HelloWorld.class, "foo");
```
</code-block><code-block label="Kotlin">

```kotlin
val helloworld: HelloWorld = client.getWorkflow<HelloWorld>(tag = "foo")
```
</code-block></code-group>

### Cancel a running workflow

Using this stub, we can cancel the targeted workflow(s):

<code-group><code-block label="Java" active>

```java
client.cancel(helloworld);
```

</code-block><code-block label="Kotlin">

```kotlin
client.cancel(helloworld)
```

</code-block></code-group>

<alert type="info">

Cancelling a workflow will cancel its child workflows as well.

</alert>

### Send an object to a running workflow

If the running workflow(s) contains one or more SendChannel, it's possible to send an object to this workflow. Those [channels](/workflows/events) should be described in the interface, for example:

<code-group><code-block label="Java" active>

```java
public interface HelloWorld {
    SendChannel<String> getNotificationChannel();

    String greet(@Nullable String name);
}
```
</code-block><code-block label="Kotlin">

```kotlin
interface HelloWorld {
    val notificationChannel: SendChannel<String>

    fun greet(name: String?): String
}
```
</code-block></code-group>

Here, we have a SendChannel of type `String`, but it can be of any (serializable) type. We can send an object to a running instance like this:

<code-group><code-block label="Java" active>

```java
helloworld.getNotificationChannel().send("foobar");
```
</code-block><code-block label="Kotlin">

```kotlin
helloworld.notificationChannel.send("foobar")
```
</code-block></code-group>

## @Name annotation

A workflow instance is internally described by both its full java name (including its package) and the name of the method called.

In some situations we may want to avoid coupling those names with the underlying implementation, for example if we want to rename the class or method, or if we mix programming languages.

Infinitic provides a `@Name` annotation that let us declare explicitly the names that Infinitic should use internally. For example:

<code-group><code-block label="Java" active>


```java
package hello.world.workflows;

import io.infinitic.annotations.Name;

@Name("HelloWorkflow")
public interface HelloWorld {

    @Name("welcome")
    String greet(@Nullable String name);
}
```

</code-block><code-block label="Kotlin">

```kotlin
package hello.world.workflows

import io.infinitic.annotations.Name

@Name('HelloWorkflow')
interface HelloWorld {

    @Name('welcome')
    fun greet(name: String?): String
}
```

</code-block></code-group>

When using this annotation, the `name` setting in [workflow worker](/components/workers) configuration file should be the one provided by the annotation:

```yml
workflows:
  - name: HelloWorkflow
    class: hello.world.workflows.HelloWorldImpl
```