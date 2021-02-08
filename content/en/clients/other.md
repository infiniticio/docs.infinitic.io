---
title: Others
description: ""
position: 2.3
category: "Client"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>



## Run Method On Running workflow

Creation of a stub for a existing workflow:

<code-group><code-block label="Java" active>

```java
HelloWorld helloWorld = infiniticClient.workflow(HelloWorld.class, id);
```

</code-block><code-block label="Kotlin">

```kotlin
val helloWorld = infiniticClient.workflow<HelloWorld>(id);
```

</code-block></code-group>

### Synchronously

<code-group><code-block label="Java" active>

```java
helloWorld.sayOther("Infinitic");
```

</code-block><code-block label="Kotlin">

```kotlin
helloWorld.sayOther("Infinitic");
```

</code-block></code-group>

### Asynchronously

<code-group><code-block label="Java" active>

```java
infiniticClient.async(helloWorld, w -> w.sayOther("Infinitic"));
```

</code-block><code-block label="Kotlin">

```kotlin
val helloWorld = infiniticClient.workflow(HelloWorld::class, id)

infiniticClient.async(helloWorld) { sayOther("Infinitic") };
```

</code-block></code-group>

## Actions on running workflow

Creation of a stub for a existing workflow:

<code-group><code-block label="Java" active>

```java
HelloWorld helloWorld = infiniticClient.workflow(HelloWorld.class, id);
```

</code-block><code-block label="Kotlin">

```kotlin
val helloWorld: HelloWorld = infiniticClient.workflow<HelloWorld>(id);
```

</code-block></code-group>

where

- string -> customId
- WorkflowId -> runId

### Cancel

<code-group><code-block label="Java" active>

```java
infiniticClient.cancel(helloWorld, output)
```

</code-block><code-block label="Kotlin">

```kotlin
infiniticClient.cancel(helloWorld, output)
```

</code-block></code-group>

### Pause

<code-group><code-block label="Java" active>

```java
infiniticClient.pause(helloWorld)
```

</code-block><code-block label="Kotlin">

```kotlin
infiniticClient.pause(helloWorld)
```

</code-block></code-group>

### Resume

<code-group><code-block label="Java" active>

```java
infiniticClient.resume(helloWorld)
```

</code-block><code-block label="Kotlin">

```kotlin
infiniticClient.resume(helloWorld)
```

</code-block></code-group>

## Send Signal to a running Workflow

### From Client

<code-group><code-block label="Java" active>

```java
infiniticClient.send(helloWorld, signal)
```

</code-block><code-block label="Kotlin">

```kotlin
infiniticClient.send(helloWorld, signal)
```

</code-block></code-group>

### Receiver in Workflows

<code-group><code-block label="Java" active>

```java
Deferred<Type> deferred = receive(Type.class)

deferred.onReceive(() -> ...; return void;)

Type type = deferred.await()
```

</code-block><code-block label="Kotlin">

```kotlin
val deferred: Deferred<Type> = receive(Type.class)

deferred.onReceive { ... }

val type: Type = deferred.await()
```

</code-block></code-group>

