---
title: Task Dispatching
description: ""
position: 2.1
category: "Client"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>


## Task Stub
Infinitic client let us start and cancel tasks, usually from your Web App controllers.

To do so, the Infinitic client only needs to know the interface of tasks (not their actual implementation). Here is an example of task interface from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

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

Using this interface, an Infinitic client can create a stub that behaves syntactically as an instance of this task:

<code-group><code-block label="Java" active>

```java
HelloWorldService helloWorldService = client.task(HelloWorldService.class);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorldService = client.task<HelloWorldService>()
```
</code-block></code-group>

## Synchronous Dispatch

This stub can be used as an actual implementation to trigger a synchronous execution:

<code-group><code-block label="Java" active>

```java
String hello = helloWorldService.sayHello("Infinitic");
```
</code-block><code-block label="Kotlin">

```kotlin
val hello = helloWorldService.sayHello("Infinitic")
```
</code-block></code-group>

When dispatching a task, the client serializes parameters and send them through Pulsar to the [task engine](/overview/architecture#task-engine), that will make sure the task is processed, managing retries if needed. Eventually, the return value will be serialized and sent back to the client through Pulsar:

<img src="/client-sync-task@2x.png" class="img" width="1280" height="640" alt=""/>

## Asynchronous Dispatch

Of course, we can also trigger an asynchronous execution:

<code-group><code-block label="Java" active>

```java
String id = client.async(helloWorldService, t -> t.sayHello("Infinitic"));
```
</code-block><code-block label="Kotlin">

```java
val id = client.async(helloWorldService) { sayHello("Infinitic") }
```
</code-block></code-group>

<img src="/client-async-task@2x.png" class="img" width="1280" height="640" alt=""/>

Here, the returned value is an internal unique `id` for the task. This `id` can be used, for example, to [manually retry a failed task](/task-executor/task-failures#retry-task-manually).

