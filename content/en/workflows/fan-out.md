---
title: Fan-Out
description: ""
position: 4.8
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>


The internal `async` function provides a way to run some parts of our workflows in parallel. For example:

<code-group><code-block label="Java" active>

```java
task.a1();

async(() -> {
    task.b1();
    return task.b2();
});

task.a2();
task.a3();
```
</code-block><code-block label="Kotlin">

```kotlin
task.a1()

async {
    task.b1()
    task.b2()
}

task.a2()
task.a3()
```
</code-block></code-group>

<img src="/async-example@2x.png" class="img" width="640" height="640" alt=""/>

*If we are dispatching a single task or a single child-workflow, it's internally more efficient to use the following syntax:*

<code-group><code-block label="Java" active>

```java
async(task, t -> t.method(parameters);
```
</code-block><code-block label="Kotlin">

```kotlin
async(task) { method(parameters) }
```
</code-block></code-group>


The return value of a `async` function is a `io.infinitic.workflows.Deferred<T>`, `T` being the type of the return value of the provided lambda / method.


A `Deferred` has some useful methods:

- `await()`: waits for the completion (or cancellation) of the deferred and returns its result
- `isCompleted()`: boolean indicating if this `Deferred` is completed by now
- `isCanceled()`: boolean indicating if this `Deferred` is canceled by now
- `isOngoing()`: boolean indicating if this `Deferred` is still ongoing

Those methods can be used in the workflow, for example:

<code-group><code-block label="Java" active>

```java
task.a1();

Deferred<String> deferred = async(() -> {
    task.b1();
    return task.b2();
});

task.a2();

if (deferred.isOngoing()) {
    task.a3();
}

String o = deferred.await()

task.a4(o);
```

</code-block><code-block label="Kotlin">

```kotlin
task.a1()

val deferred = async {
    task.b1()
    task.b2()
}

task.a2()

if (deferred.isOngoing()) {
    task.a3()
}

val o = deferred.await()

task.a4(o);

```

</code-block></code-group>

<img src="/async-example-2@2x.png" class="img" width="640" height="640" alt=""/>

