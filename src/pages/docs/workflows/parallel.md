---
title: Parallelization
description: ""
---

When a workflow need to do different actions in parallel, it can:

- dispatch tasks asynchronously
- dispatch child-workflows
- run multiple methods in parallel

## Asynchronous tasks

Instead of running tasks [sequentially](/docs/workflows/sequential), we may want to run some of them asynchronously, as illustrates below:

![Asynchronous tasks](/img/async-2@2x.png)

This is often the case for tasks for which the returned value is not important, like sending an email.

To dispatch task asynchronously, we also use the stub, created by the `newService` workflow function from a class interface:

{% codes %}

```java
public class MyWorkflow extends Workflow implements MyWorkflowInterface {
    // create a stub of ServiceInterface
    private final ServiceInterface service = newService(ServiceInterface.class);

    @Override
    public String start(String name, String email) {
        ...
        // dispatching taskA without waiting for the result
        Deferred<Boolean> deferredA = dispatch(service::taskA, parametersA);

        // dispatching taskB and wait for its result
        service.taskB(parametersB)

        // dispatching taskC and wait for its result
        service.taskC(parametersC)

    }
}
```

```kotlin
class MyWorkflow : Workflow(), MyWorkflowInterface {
    // create a stub of ServiceInterface
    private val service : ServiceInterface = newService(ServiceInterface::class.java)

    override fun start(name: String, email: String): String {
        ...
        // dispatching taskA waiting for the result
        val deferredA: Deferred<Boolean> = dispatch(service::taskA, parameterA)

        // dispatching taskB and wait for its result
        service.taskB(parameterB)

        // dispatching taskC and wait for its result
        deferred.taskC(parameterC)
    }
}
```

{% /codes %}

When dispatching a task asynchronously, a [`Deferred<T>`](/docs/workflows/deferred) object is created (`T` being the return type of the task). We can use it to synchronously wait for the completion of taskA if needed:

![Asynchronous tasks](/img/async-2-wait@2x.png)

{% codes %}

```java
public class MyWorkflow extends Workflow implements MyWorkflowInterface {
    // create a stub of ServiceInterface
    private final ServiceInterface service = newService(ServiceInterface.class);

    @Override
    public String start(String name, String email) {
        ...
        // dispatching taskA without waiting for the result
        Deferred<Boolean> deferredA = dispatch(service::taskA, parametersA);

        // dispatching taskB and wait for its result
        service.taskB(parametersB)

        // wait and get result of the dispatched taskA
        Boolean result = deferredA.await();

        // dispatching taskC and wait for its result
        service.taskC(parametersC)

    }
}
```

```kotlin
class MyWorkflow : Workflow(), MyWorkflowInterface {
    // create a stub of ServiceInterface
    private val service : ServiceInterface = newService(ServiceInterface::class.java)

    override fun start(name: String, email: String): String {
        ...
        // dispatching taskA waiting for the result
        val deferredA: Deferred<Boolean> = dispatch(service::taskA, parameterA)

        // dispatching taskB and wait for its result
        service.taskB(parameterB)

        // wait and get result of the dispatched taskA
        val result : Boolean = deferredA.await()

        // dispatching taskC and wait for its result
        deferred.taskC(parameterC)
    }
}
```

{% /codes %}

## Child workflows

If we want to run asynchrously more than a single task, we can use child-worlflows.
Dispatching a child-workflow is as easy as dispatching a task. When the child-workflow completes, the return value is sent back to the parent workflow.

The illustration below illustrates this, with a child-workflow of 3 sequential tasks:

![Asynchronous tasks](/img/workflow-child@2x.png)

Similarly to tasks, we handle child-workflows through stubs created from their interface by the `newWorkflow` function.

For example, a distributed (and inefficient) way to calculate the factorial of n is exposed below, using n workflow instances, each of them - excepted the last one - dispatching a child-workflow.

{% codes %}

```java
public class Calculate extends Workflow implements CalculateInterface {
    private final Calculate calculate = newWorkflow(CalculateInterface.class);

    @Override
    public Long factorial(Long n) {
        if (n > 1) {
          return n * calculate.factorial(n - 1);
        }
        return 1;
    }
}
```


```kotlin
class Calculate() : Workflow(), CalculateInterface {
    private val calculate = workflow<CalculateInterface>()

    override fun factorial(n: Long) = when {
        n > 1 -> n * workflow.factorial(n - 1)
        else -> 1
    }
}
```

{% /codes %}

## Parallel methods

When we dispatch a child-workflow, we create a new workflow instance. But it is also possible to run multiple methods within the same workflow instance, as illustrated below:

![Parallel methods](/img/parallelization@2x.png)

In this illustration,

- the `methodA` was the method used at the workflow start
- the `methodB` was dispatched from a client or another workflow but run inside the same instance than `methodA`.

The main raison to dispatch parallel methods instead of a child-workflow is related to the instance properties:

{% callout type="note"  %}

When multiple methods of the same workflow instance are running in parallel, they share the values of the workflow properties, and are able to read and update them to exchange information.

{% /callout  %}

This can be very useful to get properties or trigger new actions on a running workflow, as described [here](/docs/workflows/properties).

To run a method on a running workflow, we can target

- a workflow by id using the `getWorkflowById` function
- all workflows having a specific tag, using the `getWorkflowByTag` function
  Those functions are available both on the Infinitic client and within workflows:

{% codes %}

```java
// create a stub targeting by id a running workflow
HelloWorldWorkflow w = client.getWorkflowById(HelloWorldWorkflow.class, id);

or

// create a stub targeting by tag some running workflows
HelloWorldWorkflow w = client.getWorkflowByTag(HelloWorldWorkflow.class, "foo");
```

```kotlin
// create a stub targeting by id running workflow
val w : HelloWorldWorkflow = client.getWorkflowById(HelloWorldWorkflow::class.java, id)

or

// create a stub targeting by tag some running workflows
val w : HelloWorldWorkflow = client.getWorkflowByTag(HelloWorldWorkflow::class.java, tag = "foo")
```

{% /codes %}

then

{% codes %}

```java
// asynchronously dispach a method on targeted instances
client.dispatch(w::other, parameters);

or

// synchronously run a method on targeted instances
w.other(parameters);
```

```kotlin
// asynchronously dispach a method on targeted instances
client.dispatch(w::other, parameters)

or

// synchronously run a method on targeted instances
w.other(parameters)
```

{% /codes %}

To dispatch another method on the same workflow, we can define a stub targeting the very same workflow with:

{% codes %}

```java
// create a stub targeting the current workflow
@Ignore private HelloWorldWorkflow self() {
    return getWorkflowById(HelloWorldWorkflow.class, getWorkflowId());
}

...

// asynchronously dispach a method on same instance
dispatch(self()::other, parameters);
```

```kotlin
// create a stub targeting the current workflow
@Ignore private val self by lazy {
    getWorkflowById(HelloWorldWorkflow::class.java, workflowId)
}

...

// asynchronously dispach a method on same instance
dispatch(self::other, parameters)
```

{% /codes %}
