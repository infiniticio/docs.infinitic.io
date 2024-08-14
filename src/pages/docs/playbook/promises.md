---
title: Promises On Asynchronous Tasks
description: .
---

{% callout type="note"  %}

The code examples for pages in this section are available on [Github](https://github.com/infiniticio/docs.playbook).

{% /callout %}

You may want to execute remote tasks asynchronously while still being able to handle their errors or perform actions after their completion.

The simplest way to do this is to run the remote task within a child-workflow. It's even possible to do it within the same workflow. This is what we are going to illustrate here.

Let's consider a `RemoteService` with two `foo` and `bar` methods:

{% codes %}

```java
package io.infinitic.playbook.java.asyncMethod.services;

import io.infinitic.annotations.Name;

@Name(name = "AsyncMethodRemoteService")
public interface RemoteService {
    String foo(long input);

    String bar(long input);
}
```

```kotlin
package io.infinitic.playbook.kotlin.asyncMethod.services

import io.infinitic.annotations.Name

@Name("AsyncMethodRemoteService")
interface RemoteService {
    fun foo(input: Long): String

    fun bar(input: Long): String
}
```

{% /codes %}

The [`@Name`](/docs/workflows/syntax#name-annotation) annotation is used by Infinitic for Workflow and Service identification.

For this example, our dummy implementation will be:
{% codes %}

```java
package io.infinitic.playbook.java.asyncMethod.services;

import io.infinitic.playbook.java.Worker;
import io.infinitic.tasks.Task;
import java.time.LocalDateTime;

public class RemoteServiceImpl implements RemoteService {
    @Override
    public String foo(long input)  {
        return dummy("foo", input);
    }

    @Override
    public String bar(long input)  {
        return dummy("bar", input);
    }

    private String dummy(String method, long input) {
        log("start processing '" + method + "(" + input + ")'");
        try {
            Thread.sleep(input);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        log("stop  processing '" + method + "(" + input + ")'");

        return  "'" + method + "(" + input + ")' completed";
    }

    private void log(String msg) {
        System.out.println(
                LocalDateTime.now().format(Worker.formatter) + " - Service  " + Task.getTaskId() + " - " + msg
        );
    }
}
```

```kotlin
package io.infinitic.playbook.kotlin.asyncMethod.services

import io.infinitic.playbook.kotlin.formatter
import io.infinitic.tasks.Task.taskId
import java.time.LocalDateTime

class RemoteServiceImpl: RemoteService {
    override fun foo(input: Long): String {
        return dummy("foo", input)
    }

    override fun bar(input: Long): String {
        return dummy("bar", input)
    }

    private fun dummy(method: String, input: Long): String {
        log("start processing '$method($input)'")
        Thread.sleep(input)
        log("stop  processing '$method($input)'")

        return "'$method($input)' completed"
    }

    private fun log(msg: String) {
        println(
            LocalDateTime.now().format(formatter) + " - Service  " + taskId + " - " + msg
        )
    }
}
```

{% /codes %}

The `AsyncMethodWorkflow` that use this service has the following contract:

{% codes %}

```java
package io.infinitic.playbook.java.asyncMethod.workflows;

import io.infinitic.annotations.Name;

@Name(name = "AsyncMethodWorkflow")
public interface AsyncMethodWorkflow {
    String run();

    String remoteServiceFoo(long input);
}
```

```kotlin
package io.infinitic.playbook.kotlin.asyncMethod.workflows

import io.infinitic.annotations.Name

@Name("AsyncMethodWorkflow")
interface AsyncMethodWorkflow {
    fun run(): String

    fun remoteServiceFoo(input: Long): String
}
```

{% /codes %}

It has a main `run` method, and we added a `remoteServiceFoo` method with the same parameters than `RemoteService::foo`. 

Here is an implementation: 

{% codes %}

```java
package io.infinitic.playbook.java.asyncMethod.workflows;

import io.infinitic.playbook.java.Worker;
import io.infinitic.playbook.java.asyncMethod.services.RemoteService;
import io.infinitic.workflows.Workflow;

import java.time.LocalDateTime;

public class AsyncMethodWorkflowImpl extends Workflow implements AsyncMethodWorkflow {

    private final AsyncMethodWorkflow self = getWorkflowById(AsyncMethodWorkflow.class, getWorkflowId());
    private final RemoteService remoteService = newService(RemoteService.class);

    @Override
    public String run() {
        // Asynchronous dispatch self::remoteServiceFoo
        dispatch(self::remoteServiceFoo, 1000L);
        // Synchronous execution of remoteService::bar
        long input = 100L;
        log("Dispatching: 'bar(" + input +")'");
        String out = remoteService.bar(input);
        log("Receiving: " + out);

        return out;
    }

    @Override
    public String remoteServiceFoo(long input) {
        log("Dispatching: 'foo(" + input +")'");
        String out = remoteService.foo(input);
        log("Receiving: " + out);

        return out;
    }

    private void log(String msg) {
        inlineVoid(() -> System.out.println(
                LocalDateTime.now().format(Worker.formatter) +
                        " - Workflow " + getWorkflowId() + " - " + msg
        ));
    }
}
```

```kotlin
package io.infinitic.playbook.kotlin.asyncMethod.workflows

import io.infinitic.playbook.kotlin.asyncMethod.services.RemoteService
import io.infinitic.playbook.kotlin.formatter
import io.infinitic.workflows.Workflow
import java.time.LocalDateTime

class AsyncMethodWorkflowImpl : Workflow(), AsyncMethodWorkflow {

    private val self = getWorkflowById(AsyncMethodWorkflow::class.java, workflowId);
    private val remoteService = newService(RemoteService::class.java)

    override fun run(): String {
        // Asynchronous dispatch self::remoteServiceFoo
        dispatch(self::remoteServiceFoo, 1000L)
        // Synchronous execution of remoteService::bar
        val input = 100L
        log("Dispatching 'bar($input)'")
        val out = remoteService.bar(input)
        log("Receiving: $out")

        return out
    }

    override fun remoteServiceFoo(input: Long): String {
        log("Dispatching 'foo($input)'")
        val out = remoteService.foo(input)
        log("Receiving: $out")

        return out
    }

    private fun log(msg: String) = inline {
        println("${LocalDateTime.now().format(formatter)} - Workflow $workflowId - $msg")
    }
}
```

{% /codes %}

The `AsyncMethodWorkflowImpl` class implements the `AsyncMethodWorkflow` interface and extends the `Workflow` class provided by Infinitic. 

Let's examine its key parts:

- The `self` property is a reference to the current workflow, allowing the workflow to dispatch methods to itself.
- The `remoteService` property is a stub of `RemoteService`. 
- The `run` method is the main entry point of the workflow, it:
  - dispatches the `remoteServiceFoo` method asynchronously.
  - calls `RemoteService.bar` synchronously, with a log before and after
  - returns the output of the `RemoteService.bar` call.
- The `remoteServiceFoo` method, which is asynchronously called:
  -  calls `RemoteService.bar` synchronously, with a log before and after
  -  and returns its result (but  one is listening) as the call was asynchronous.

  At last, The `log` method is an utility method to log messages with a timestamp, workflow ID, and method ID. It used the Infinitic's [`inline()`](/docs/workflows/inline) function ensuring proper handling of operations with side-effect.


To launch an instance :

{% codes %}

```java
AsyncMethodWorkflow instance = client.newWorkflow(AsyncMethodWorkflow.class, Set.of("asyncMethod"));
client.dispatchVoid(instance::run);
```

```kotlin
val workflow = client.newWorkflow(AsyncMethodWorkflow::class.java, setOf("asyncMethod"))
client.dispatch(workflow::run)
```

{% /codes %}

A typical output (from the worker console):

```
04:33:52:087 - Workflow 0190d090-38fc-7dbb-a09f-90c497e24b93 - Dispatching 'bar(100)'
04:33:52:178 - Workflow 0190d090-38fc-7dbb-a09f-90c497e24b93 - Dispatching 'foo(1000)'
04:33:52:178 - Service  0190d090-3baa-7c35-9084-50a06044b868 - start processing 'bar(100)'
04:33:52:202 - Service  0190d090-3baa-7911-a4c3-af416a4ffc3c - start processing 'foo(1000)'
04:33:52:281 - Service  0190d090-3baa-7c35-9084-50a06044b868 - stop  processing 'bar(100)'
04:33:52:314 - Workflow 0190d090-38fc-7dbb-a09f-90c497e24b93 - Receiving: 'bar(100)' completed
04:33:53:208 - Service  0190d090-3baa-7911-a4c3-af416a4ffc3c - stop  processing 'foo(1000)'
04:33:53:243 - Workflow 0190d090-38fc-7dbb-a09f-90c497e24b93 - Receiving: 'foo(1000)' completed
```

As you can see, the `run()` methods returns before the end of the `foo` task. 

{% callout %}

The `remoteServiceFoo` could be updated to handle any error of the `foo` method, or simply to continue the execution with more tasks. 

{% /callout %}

