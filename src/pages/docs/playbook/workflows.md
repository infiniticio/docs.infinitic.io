---
title: Workflows Playbook
description: .
---

This page describes how to implement common situations. The code for this page is on [Github](https://github.com/infiniticio/playbook).

## Workflow Scheduler

In many applications, there's a need to execute workflows on a recurring basis, following a specific schedule.

This guide demonstrates how to implement a `RecurringWorkflowScheduler` that dispatches a `RecurringWorkflow` at regular intervals based on a specified cron expression. 

For this example, we will consider this contract for the recurring workflow:

{% codes %}

```java
package io.infinitic.playbook.java.scheduler.workflows;

import io.infinitic.annotations.Name;

@Name(name = "RecurringWorkflow")
public interface RecurringWorkflow {
    void run(RecurringWorkflowInput input);
}
```

```kotlin
package io.infinitic.playbook.kotlin.scheduler.workflows

import io.infinitic.annotations.Name

@Name(name = "RecurringWorkflow")
interface RecurringWorkflow {
    fun run(input: RecurringWorkflowInput)
}
```

{% /codes %}

The [`@Name`](/docs/workflows/syntax#name-annotation) annotation is used by Infinitic for Workflow and Service identification.


We'll start by defining a `RecurringWorkflowScheduler` interface with a `schedule` method. This method takes two parameters:

* `cronExpr`: A string representing the cron expression (e.g., "30 * * * *")
* `input`: The `RecurringWorkflowInput` data that will be used for each `RecurringWorkflow` instance dispatched.

{% codes %}

```java
package io.infinitic.playbook.java.scheduler.workflows;

import io.infinitic.annotations.Name;

@Name(name = "RecurringWorkflowScheduler")
public interface RecurringWorkflowScheduler {
    void schedule(String cronExpr, RecurringWorkflowInput input);
}
```

```kotlin
package io.infinitic.playbook.kotlin.scheduler.workflows

import io.infinitic.annotations.Name

@Name("RecurringWorkflowScheduler")
interface RecurringWorkflowScheduler {
    fun schedule(cronExpr: String, input: RecurringWorkflowInput)
}
```

{% /codes %}

Here is an example of implementation of a fully functional recurring workflow scheduler:

{% codes %}

```java
package io.infinitic.playbook.java.scheduler.workflows;

import com.cronutils.model.Cron;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import io.infinitic.annotations.Ignore;
import io.infinitic.workflows.Workflow;

import java.time.Clock;
import java.time.ZonedDateTime;
import java.util.Optional;

@SuppressWarnings("unused")
public class RecurringWorkflowSchedulerImpl extends Workflow implements RecurringWorkflowScheduler {

    @Ignore
    private final CronParser parser = new CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX));

    @Override
    public void schedule(String cronExpr, RecurringWorkflowInput input) {
        // parse cron expression
        Cron myCron = parser.parse(cronExpr);
        // get current time, must be inlined
        ZonedDateTime now = inline(() -> ZonedDateTime.now(Clock.systemUTC()));
        // get next execution date
        Optional<ZonedDateTime> nextExecution = ExecutionTime.forCron(myCron).nextExecution(now);

        if (nextExecution.isPresent()) {
            // wait up to the next occurrence
            timer(nextExecution.get().toInstant()).await();
            // dispatch the recurring workflow
            dispatchRecurring(input);
            // restart to wait for the next occurrence
            selfDispatch(cronExpr, input);
        }
    }

    private void dispatchRecurring(RecurringWorkflowInput input) {
        RecurringWorkflow recurringWorkflow = newWorkflow(RecurringWorkflow.class);
        dispatchVoid(recurringWorkflow::run, input);
    }

    private void selfDispatch(String cronExpr, RecurringWorkflowInput input) {
        // workflowId is part of the workflow's context
        RecurringWorkflowScheduler self = getWorkflowById(RecurringWorkflowScheduler.class, getWorkflowId());
        dispatchVoid(self::schedule, cronExpr, input);
    }
}
```

```kotlin
package io.infinitic.playbook.kotlin.scheduler.workflows

import com.cronutils.model.CronType
import com.cronutils.model.definition.CronDefinitionBuilder
import com.cronutils.model.time.ExecutionTime
import com.cronutils.parser.CronParser
import io.infinitic.annotations.Ignore
import io.infinitic.workflows.Workflow
import java.time.Clock
import java.time.ZonedDateTime

class RecurringWorkflowSchedulerImpl : Workflow(), RecurringWorkflowScheduler {
    @Ignore
    private val parser = CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX))

    override fun schedule(cronExpr: String, input: RecurringWorkflowInput) {
        // parse cron expression
        val myCron = parser.parse(cronExpr)

        // get current time (inlined because the output is not predictable)
        val now = inline { ZonedDateTime.now(Clock.systemUTC()) }

        // get next execution date
        val nextExecution = ExecutionTime.forCron(myCron).nextExecution(now)

        if (nextExecution.isPresent) {
            // wait up to the next occurrence
            timer(nextExecution.get().toInstant()).await()
            // dispatch recurringWorkflow
            dispatchRecurring(input)
            // restart to wait for the next occurrence
            selfDispatch(cronExpr, input)
        }
    }

    private fun dispatchRecurring(input: RecurringWorkflowInput) {
        val recurringWorkflow = newWorkflow(RecurringWorkflow::class.java)
        dispatch(recurringWorkflow::run, input)
    }

    private fun selfDispatch(cronExpr: String, input: RecurringWorkflowInput) {
        // workflowId is part of the workflow's context
        val self = getWorkflowById(RecurringWorkflowScheduler::class.java, workflowId)
        dispatch(self::schedule, cronExpr, input)
    }
}
```

{% /codes %}
This implementation utilizes the [`cron-utils` package](http://cron-parser.com) to determine the timing of recurring executions based on cron expressions. Here's a breakdown:

The `RecurringWorkflowSchedulerImpl` class:
- Extends the [`Workflow` class](/docs/workflows/syntax#constraints) provided by Infinitic and implements the `RecurringWorkflowScheduler` contract
- Initializes a `CronParser` for Unix-style cron expressions (the [`@Ignore` annotation](/docs/workflows/syntax#ignore-annotation) prevents Infinitic from serializing the `parser` field).

The `schedule` method handles the scheduling logic:

1. **Cron Expression Parsing**: The provided cron expression is parsed into a `Cron` object.

2. **Current Time Retrieval**: Uses Infinitic's [`inline()` function](/docs/workflows/inline) to get the current time, ensuring proper handling of non-deterministic operations.

3. **Next Execution Calculation**: Determines the next execution time based on the parsed cron expression and current time.

4. **Execution Flow**: If a next execution time exists, the method:

   a. Uses the workflow's [`timer` function](/docs/workflows/waiting) to wait until the next execution time.

   b. Dispatches the recurring workflow once the timer completes.

   c. Recursively schedules the next occurrence by dispatching a new method call on the same workflow instance.


{% callout %}

The recursive scheduling approach (step 4c above) is crucial for [efficient workflow history management](/docs/workflows/syntax#constraints): By dispatching a new method on the same workflow instance for each occurrence, the workflow history doesn't accumulate indefinitely, as Infinitic deletes the history for each completed method execution.

{% /callout %}

To start the scheduler:

{% codes %}

```java
RecurringWorkflowScheduler workflow = client.newWorkflow(RecurringWorkflowScheduler.class, Set.of("scheduler"));
client.dispatchVoid(workflow::schedule, "* * * * *", new RecurringWorkflowInput());
```

```kotlin
val scheduler = client.newWorkflow(RecurringWorkflowScheduler::class.java, setOf("scheduler"))
client.dispatch(scheduler::schedule, "* * * * *", RecurringWorkflowInput())
```

{% /codes %}

To stop the scheduler:

{% codes %}

```java
RecurringWorkflowScheduler scheduler = client.getWorkflowByTag(RecurringWorkflowScheduler.class, "scheduler");
client.cancel(scheduler);
```

```kotlin
val scheduler = client.getWorkflowByTag(RecurringWorkflowScheduler::class.java, "scheduler")
client.cancel(scheduler)
```

{% /codes %}

A typical output (from the worker console) should be something like:

```
17:14:00 - Instance: 0190980f-06c0-7f98-8189-a5dcd989c862
17:15:00 - Instance: 0190980f-f120-7d25-95f7-1201ee776fbf
17:16:00 - Instance: 01909810-db80-7c8c-af00-225fcb7177cb
17:17:00 - Instance: 01909811-c5e0-7cea-9e99-6085ab762239
17:18:00 - Instance: 01909812-b040-76f7-9cf3-8e39775c78ef
17:19:00 - Instance: 01909813-9aa0-79cc-9841-409b15f21f6c
17:20:00 - Instance: 01909814-8500-79c9-b651-ed1596dee3e1
```

## Asynchronous Methods

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
        log( "Dispatching 'bar(" + input +")'");
        String out = remoteService.bar(input);
        log("Receiving: " + out);

        return out;
    }

    @Override
    public String remoteServiceFoo(long input) {
        log( "Dispatching 'foo(" + input +")'");
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

## Forwarding Workflow's Metadata To Services

When dispatching a workflow, it's possible to associate some [metadata](/docs/workflows/syntax#meta).
Example of setting metadata when creating a workflow:

{% codes %}

```java
final HelloWorkflow helloWorkflow = newWorkflow(
    HelloWorkflow.class,
    null,
    Map.of(
        "foo", "bar".getBytes(),
        "baz", "qux".getBytes()
    )
);
```

```kotlin
private val helloWorkflow = newWorkflow(
    HelloWorkflow::class.java,
    meta = mapOf(
        "foo" to "bar".toByteArray(),
        "baz" to "qux".toByteArray()
    )
)
```

{% /codes %}

{% callout %}

This metadata is not automatically forwarded to tasks by default.

{% /callout %}

To forward the metadata, you need to explicitly pass it when creating a service stub within your workflow implementation:

{% codes %}

```java
public class MyWorkflowImpl extends Workflow implements MyWorkflow {

    private final MyService myService = newService(MyService.class, null, getMeta());
    
    ...
}
```

```kotlin
class MyWorkflowImpl : Workflow(), MyWorkflow {

    private val myService = newService(MyService::class.java, meta = meta)

    ...
}
```

{% /codes %}

## Forwarding Workflow's Tags To Services

When dispatching a workflow, it's possible to associate some [tags](/docs/workflows/syntax#tags).
Example of setting tags when creating a workflow:

{% codes %}

```java
final HelloWorkflow helloWorkflow = newWorkflow(
    HelloWorkflow.class,
    Set.of("userId" + userId, "companyId" + companyId)
);
```

```kotlin
val helloWorkflow = newWorkflow(
    HelloWorkflow::class.java, 
    tags = setOf("userId:$userId", "companyId:$companyId")
)
```

{% /codes %}

{% callout %}

Tags are not automatically forwarded to tasks by default.

{% /callout %}

To forward tags, you pass them explicitly when creating a service stub within your workflow implementation:

{% codes %}

```java
public class MyWorkflowImpl extends Workflow implements MyWorkflow {

    private final MyService myService = newService(MyService.class, getTags());
    
    ...
}
```

```kotlin
class MyWorkflowImpl : Workflow(), MyWorkflow {

    private val myService = newService(MyService::class.java, tags = tags)

    ...
}
```

{% /codes %}