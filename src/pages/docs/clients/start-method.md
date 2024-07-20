---
title: Start A Parallel Method On A Running Workflow
description: This page details how to start a parallel method on a running workflow in Infinitic, allowing for the execution of multiple methods simultaneously within the same workflow instance. It explains how to use workflow stubs to invoke methods directly or asynchronously, with or without waiting for results, and includes specific syntax for handling void return types and targeting workflows by tags.
---
A running workflow instance can have multiple methods running in parallel.
When it's the case, those executions share the internal properties of this workflow instance.

This can be used to trigger new actions or to access or update the workflow [properties](/docs/workflows/properties).

{% codes %}

```java
// create stub of a running HelloWorkflow workflow
HelloWorkflow w = 
    client.getWorkflowById(HelloWorkflow.class, id);

// running `HelloWorkflow::method` of the targeted workflow without waiting for the result
Deferred<Boolean> deferred = client.dispatch(w::method, ...);

// running `HelloWorkflow::method` on the targeted workflow and wait for its boolean result
Boolean result = w.method(...);
```

```kotlin
// create stub of a running HelloWorkflow workflow
val w : HelloWorkflow =
    client.getWorkflowById(HelloWorkflow::class.java, id)

// running `HelloWorkflow::method` of the targeted workflow without waiting for the result
val deferred : Deferred<Boolean> = client.dispatch(w::method, ...)

// running `HelloWorkflow::method` on the targeted workflow and wait for its boolean result
val result = w.method(...)
```

{% /codes %}

{% callout type="warning"  %}

Due to some Java syntax constraints, if the return type of the method used is `void`, we need to use `dispatchVoid` function instead of `dispatch`.

{% /callout  %}

Another way to target some running workflows is to used the `getWorkflowByTag` function that take a workflow interface and a tag as parameter. For example:

{% codes %}

```java
// create the stub of running HelloWorkflow workflows with tag
HelloWorkflow w =
    getWorkflowByTag(HelloWorkflow.class, tag);

// running `HelloWorkflow::method` of the targeted workflows without waiting for the boolean result
Deferred<Boolean> deferred = client.dispatch(w::method, ...);
```

```kotlin
// create the stub of running workflows with tag
val w : HelloWorkflow =
    getWorkflowByTag(HelloWorkflow::class.java, tag)

// running `HelloWorkflow::method` of the targeted workflow without waiting for the boolean result
val deferred : Deferred<Boolean> = client.dispatch(w::method, ...)
```

{% /codes %}

In the example above, the "HelloWorkflow::method" will run on _all_ workflows having the provided tag.

{% callout type="warning"  %}

When targeting workflows by tag, it's not possible to retrieve `deferred.id` or to do `deferred.await()`,
 as the deferred can target multiple instances.

{% /callout  %}
