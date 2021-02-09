---
title: Workflow Dispatching
description: ""
position: 2.2
category: "Client"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>


## Workflow Stub

Infinitic client let us start and cancel workflows, usually from your Web App controllers.

To do so, the Infinitic client only needs to know the interface of workflows (not their actual implementation). Here is an example of workflow interface from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

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
HelloWorld helloWorld = client.workflow(HelloWorld.class);
```
</code-block><code-block label="Kotlin">

```kotlin
val helloWorld = client.workflow<HelloWorld>()
```
</code-block></code-group>

## Synchronous Dispatch

This stub can be used as an actual implementation to trigger a synchronous execution:

<code-group><code-block label="Java" active>

```java
String greeting = helloWorld.greet("Infinitic");
```
</code-block><code-block label="Kotlin">

```kotlin
val greeting = helloWorld.greet("Infinitic")
```
</code-block></code-group>

When dispatching a workflow, the client serializes parameters and send them through Pulsar to the [workflow engine](/overview/architecture#workflow-engine), that will orchestrate the workflow. Eventually, the return value will be serialized and sent back to the client through Pulsar:

<img src="/client-sync-workflow@2x.png" class="img" width="1280" height="640" alt=""/>

## Asynchronous Dispatch

Of course, the client can also trigger an asynchronous execution:

<code-group><code-block label="Java" active>

```java
String id = client.async(helloWorldService, t -> t.sayHello("Infinitic"));
```
</code-block><code-block label="Kotlin">

```java
val id = client.async(helloWorldService) { sayHello("Infinitic") }
```
</code-block></code-group>

<img src="/client-async-workflow@2x.png" class="img" width="1280" height="640" alt=""/>

Here, the returned value is an internal unique `id` for the workflow. This `id` can be used, for example, to [manually cancel a workflow](/task-executor/task-failures#retry-task-manually).
