---
title: Start A Parallel Method On A Running Workflow
description: Quidem magni aut exercitationem maxime rerum eos.
---

A running workflow instance can have multiple methods running in parallel.
When it's the case, those executions share the internal properties of this workflow instance.

This can be used to trigger new actions or to access or update the workflow [properties](/docs/workflows/properties).

{% codes %}

```java
// create stub of a running HelloWorld workflow
HelloWorldWorkflow w = 
    client.getWorkflowById(HelloWorldWorkflow.class, id);

// running `HelloWorld::method` of the targeted workflow without waiting for the result
Deferred<Boolean> deferred = client.dispatch(w::method, ...);

// running `HelloWorld::method` on the targeted workflow and wait for its boolean result
Boolean result = w.method(...);
```

```kotlin
// create stub of a running HelloWorld workflow
val w : HelloWorldWorkflow =
    client.getWorkflowById(HelloWorldWorkflow::class.java, id)

// running `HelloWorld::method` of the targeted workflow without waiting for the result
val deferred : Deferred<Boolean> = client.dispatch(w::method, ...)

// running `HelloWorld::method` on the targeted workflow and wait for its boolean result
val result = w.method(...)
```

{% /codes %}

{% callout type="warning"  %}

Due to some Java syntax constraints, if the return type of the method used is `void`, we need to use `dispatchVoid` function instead of `dispatch`.

{% /callout  %}

Another way to target some running workflows is to used the `getWorkflowByTag` function that take a workflow interface and a tag as parameter. For example:

{% codes %}

```java
// create the stub of running HelloWorld workflows with tag
HelloWorldWorkflow w =
    getWorkflowByTag(HelloWorldWorkflow.class, tag);

// running `HelloWorld::method` of the targeted workflows without waiting for the boolean result
Deferred<Boolean> deferred = client.dispatch(w::method, ...);
```

```kotlin
// create the stub of running workflows with tag
val w : HelloWorldWorkflow =
    getWorkflowByTag(HelloWorldWorkflow::class.java, tag)

// running `HelloWorld::method` of the targeted workflow without waiting for the boolean result
val deferred : Deferred<Boolean> = client.dispatch(w::method, ...)
```

{% /codes %}

In the example above, the "HelloWorldWorkflow::method" will run on _all_ workflows having the provided tag.

{% callout type="warning"  %}

When targeting workflows by tag, it's not possible to retrieve `deferred.id` or to do `deferred.await()`,
 as the deferred can target multiple instances.

{% /callout  %}


