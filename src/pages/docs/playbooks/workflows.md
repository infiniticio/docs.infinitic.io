---
title: Workflows Playbook
description: .
---

This page describes how to implement common situations.

## Cron Schedulers

In many applications, there's a need to execute workflows on a recurring basis, following a specific schedule.

This guide demonstrates how to implement a `RecurringWorkflowScheduler` that dispatches a `RecurringWorkflow` at regular intervals based on a specified cron expression. 

For this example, we will consider this contract for the recurring workflow:

{% codes %}

```java
import io.infinitic.annotations.Name;

@Name(name = "RecurringWorkflow")
public interface RecurringWorkflow {
    void run(RecurringWorkflowInput input);
}
```

```kotlin
import io.infinitic.annotations.Name

@Name(name = "RecurringWorkflow")
interface RecurringWorkflow {
    fun run(input: RecurringWorkflowInput)
}
```

{% /codes %}

The `@Name` annotation is used by Infinitic for workflow identification.


We'll start by defining a `RecurringWorkflowScheduler` interface with a `schedule` method. This method takes two parameters:

* `cronExpr`: A string representing the cron expression (e.g., "30 * * * *")
* `input`: The `RecurringWorkflowInput` data that will be used for each `RecurringWorkflow` instance dispatched.

{% codes %}

```java
import io.infinitic.annotations.Name;

@Name(name = "RecurringWorkflowScheduler")
public interface RecurringWorkflowScheduler {
    void schedule(String cronExpr, RecurringWorkflowInput input);
}
```

```kotlin
@Name("RecurringWorkflowScheduler")
interface RecurringWorkflowScheduler {
    fun schedule(cronExpr: String, input: RecurringWorkflowInput)
}
```

{% /codes %}

Here is an example of implementation of a fully functional recurring workflow scheduler:

{% codes %}

```java
import com.cronutils.model.Cron;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.model.time.ExecutionTime;
import com.cronutils.parser.CronParser;
import io.infinitic.annotations.Ignore;
import io.infinitic.workflows.*;

import java.time.*;
import java.util.Optional;

public class RecurringWorkflowSchedulerImpl extends Workflow implements RecurringWorkflowScheduler {

    @Ignore
    private final CronParser parser = new CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX));

    @Override
    public void schedule(String cronExpr, RecurringWorkflowInput input) {
        Cron myCron = parser.parse(cronExpr);
        ZonedDateTime now = inline(() -> ZonedDateTime.now(Clock.systemUTC()));
        Optional<ZonedDateTime> nextExecution = ExecutionTime.forCron(myCron).nextExecution(now);

        if (nextExecution.isPresent()) {
            timer(nextExecution.get().toInstant()).await();
            dispatchRecurring(input);
            selfDispatch(cronExpr, input);
        }
    }

    private void dispatchRecurring(RecurringWorkflowInput input) {
        RecurringWorkflow recurringWorkflow = newWorkflow(RecurringWorkflow.class);
        dispatchVoid(recurringWorkflow::run, input);
    }

    private void selfDispatch(String cronExpr, RecurringWorkflowInput input) {
        RecurringWorkflowScheduler self = getWorkflowById(RecurringWorkflowScheduler.class, getWorkflowId());
        dispatchVoid(self::schedule, cronExpr, input);
    }
}
```

```kotlin
import com.cronutils.model.CronType
import com.cronutils.model.definition.CronDefinitionBuilder
import com.cronutils.model.time.ExecutionTime
import com.cronutils.parser.CronParser
import io.infinitic.annotations.Ignore
import io.infinitic.workflows.Workflow
import java.time.*

class RecurringWorkflowSchedulerImpl : Workflow(), RecurringWorkflowScheduler {
    @Ignore
    private val parser = CronParser(CronDefinitionBuilder.instanceDefinitionFor(CronType.UNIX))

    override fun schedule(cronExpr: String, input: RecurringWorkflowInput) {
        val myCron = parser.parse(cronExpr)
        val now = inline { ZonedDateTime.now(Clock.systemUTC()) }
        val nextExecution = ExecutionTime.forCron(myCron).nextExecution(now)

        if (nextExecution.isPresent) {
            timer(nextExecution.get().toInstant()).await()
            dispatchRecurring(input)
            selfDispatch(cronExpr, input)
        }
    }

    private fun dispatchRecurring(input: RecurringWorkflowInput) {
        val recurringWorkflow = newWorkflow(RecurringWorkflow::class.java)
        dispatch(recurringWorkflow::run, input)
    }

    private fun selfDispatch(cronExpr: String, input: RecurringWorkflowInput) {
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
// create a stub for RecurringWorkflowScheduler, with tag "RecurringWorkflow"
RecurringWorkflowScheduler scheduler = client.newWorkflow(RecurringWorkflowScheduler.class, Set.of("RecurringWorkflow"));

// start a scheduler that dispatchs a `RecurringWorkflow` every minute
client.dispatchVoid(scheduler::schedule, "* * * * *", input);
```

```kotlin
// create a stub for RecurringWorkflowScheduler, with tag "RecurringWorkflow"
val scheduler = client.newWorkflow(RecurringWorkflowScheduler::class.java, setOf("RecurringWorkflow"))

// start a scheduler that dispatchs a `RecurringWorkflow` every minute
client.dispatch(scheduler::schedule, "* * * * *", input)
```

{% /codes %}

To stop the scheduler:

{% codes %}

```java
RecurringWorkflowScheduler scheduler = client.getWorkflowByTag(RecurringWorkflowScheduler.class,  "RecurringWorkflow");
client.cancel(scheduler);
```

```kotlin
val scheduler = client.getWorkflowByTag(RecurringWorkflowScheduler::class.java, "RecurringWorkflow")
client.cancel(scheduler)
```

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

{% /codes %}

## Managing Asynchronous Tasks 

You may want to execute remote tasks asynchronously while still being able to handle their errors or perform actions after their completion.

The simplest way to do this is to run the remote task within a child-workflow. It's even possible to do it within the same workflow. This is what we are going to illustrate here.

Let's consider a `RemoteService` with a `run` method that simulates a remote task:

{% codes %}

```java
package io.infinitic.playbook.promises.workflows;

import io.infinitic.annotations.Name;
import java.util.concurrent.TimeUnit;

@Name(name = "RemoteService")
public interface RemoteService {
    void run(String id, long input);
}
```

```kotlin
package io.infinitic.playbook.promises.services

import io.infinitic.annotations.Name
import java.util.concurrent.TimeUnit

@Name("RemoteService")
interface RemoteService {
    fun run(id: String, input: Long)
}
```

{% /codes %}

For this example, our dummy implementation will be:
{% codes %}

```java
package io.infinitic.playbook.promises.services;

import io.infinitic.playbook.promises.Worker;
import io.infinitic.tasks.Task;
import java.time.LocalDateTime;

public class RemoteServiceImpl implements RemoteService {
    @Override
    public void run(String id, long input)  {
        log("start processing " + id);
        try {
            Thread.sleep(input*1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        log("stop processing " + id);

    }

    private void log(String msg) {
        System.out.println(
                LocalDateTime.now().format(Worker.formatter) + " - Service  " + Task.getTaskId() + " - " + msg
        );
    }
}
```

```kotlin
package io.infinitic.playbook.promises.services

import io.infinitic.playbook.promises.formatter
import io.infinitic.tasks.Task
import java.time.LocalDateTime

class RemoteServiceImpl: RemoteService {
    override fun run(id: String, input: Long) {
        log("start processing $id")
        Thread.sleep(input*1000)
        log("stop processing $id")
    }

    private fun log(msg: String) =
        println("${LocalDateTime.now().format(formatter)} - Service  ${Task.taskId} - $msg")
}
```

{% /codes %}

The `PromisesWorkflow` that use it has the following contract:

{% codes %}

```java
package io.infinitic.playbook.promises.workflows;

import io.infinitic.annotations.Name;
import java.util.concurrent.TimeUnit;

@Name(name = "PromisesWorkflow")
public interface PromisesWorkflow {
    void run();

    void remoteServiceRun(String id, long input);
}
```

```kotlin
package io.infinitic.playbook.promises.workflows

import io.infinitic.annotations.Name
import java.util.concurrent.TimeUnit

@Name("PromisesWorkflow")
interface PromisesWorkflow {
    fun run()

    fun remoteServiceRun(id: String, input: Long)
}
```

{% /codes %}

It has a main `run` method, and we added a `remoteServiceRun` method with the same parameters than `RemoteService::run`. 

Here is an implementation: 

{% codes %}

```java
package io.infinitic.playbook.promises.workflows;

import io.infinitic.playbook.promises.Worker;
import io.infinitic.playbook.promises.services.RemoteService;
import io.infinitic.workflows.Deferred;
import io.infinitic.workflows.Workflow;

import java.time.LocalDateTime;
import static io.infinitic.workflows.DeferredKt.and;

public class PromisesWorkflowImpl extends Workflow implements PromisesWorkflow {

    private final PromisesWorkflow self = getWorkflowById(PromisesWorkflow.class, getWorkflowId());
    private final RemoteService remoteService = newService(RemoteService.class);

    @Override
    public void run() {
        Deferred<Void> deferred1 = dispatchVoid(self::remoteServiceRun, "1", 10L);
        Deferred<Void> deferred2 = dispatchVoid(self::remoteServiceRun, "2", 10L);
        Deferred<Void> deferred3 = dispatchVoid(self::remoteServiceRun, "3", 1L);

        and(deferred1, deferred2, deferred3).await();
        log("all completed");
    }

    @Override
    public void remoteServiceRun(String id, long input) {
        log(id + " starting");
        remoteService.run(id, input);
        log(id + " completed");
    }

    private void log(String msg) {
        inlineVoid(() -> System.out.println(
                LocalDateTime.now().format(Worker.formatter) +
                        " - Workflow " + getWorkflowId() + " (method " + getMethodId() + ") - " + msg
        ));
    }
}
```

```kotlin
package io.infinitic.playbook.promises.workflows

import io.infinitic.playbook.promises.formatter
import io.infinitic.playbook.promises.services.RemoteService
import io.infinitic.workflows.and
import io.infinitic.workflows.Workflow
import java.time.LocalDateTime

class PromisesWorkflowImpl : Workflow(), PromisesWorkflow {

    private val self = getWorkflowById(PromisesWorkflow::class.java, workflowId);
    private val remoteService = newService(RemoteService::class.java)

    override fun run() {
        val deferred1 = dispatch(self::remoteServiceRun, "1", 10)
        val deferred2 = dispatch(self::remoteServiceRun, "2", 10)
        val deferred3 = dispatch(self::remoteServiceRun, "3", 1)

        (deferred1 and deferred2 and deferred3).await()
        log("all completed")
    }

    override fun remoteServiceRun(id: String, input: Long) {
        log("$id starting")
        remoteService.run(id, input)
        log("$id completed")
    }

    private fun log(msg: String) = inline {
        println("${LocalDateTime.now().format(formatter)} - Workflow $workflowId (method $methodId) - $msg")
    }
}
```

{% /codes %}

The `PromisesWorkflowImpl` class implements the `PromisesWorkflow` interface and extends the `Workflow` class provided by Infinitic. 

Let's examine its key parts:

- The `self` property is a reference to the current workflow, allowing the workflow to dispatch methods to itself.

- The `run` method is the main entry point of the workflow. It demonstrates how to dispatch multiple asynchronous tasks and wait for their completion:
  
  - The `remoteServiceRun` method is dispatched asynchronously three times with different parameters.
  - Each call returns a Deferred<Void> object, which represents a future result.
  - The `and` function combines these deferreds, and `await()` is called to wait for all of them to complete.
  - After all remote methods are completed, it logs "all completed".

- The `remoteServiceRun` method wraps the call to the actual remote service:

  - It logs the start of the task.
  - Creates a new instance of `RemoteService` and calls its `run` method.
  - Logs the completion of the task.

  At last, The `log` method is an utility method to log messages with a timestamp, workflow ID, and method ID. It used the Infinitic's [`inline()` function](/docs/workflows/inline) ensuring proper handling of operations with side-effect.

{% callout %}

Within the `remoteServiceRun, it's possible to manage errors or add follow-up tasks (like the inlined log tasks above).

{% /callout %}

To launch an instance :

{% codes %}

```java
// create a stub for PromisesWorkflow
PromisesWorkflow instance = client.newWorkflow(PromisesWorkflow.class);

// start new workflow
client.dispatchVoid(instance::run);
```

```kotlin
// create a stub for PromisesWorkflow
val workflow = client.newWorkflow(PromisesWorkflow::class.java)

// start new workflow
client.dispatch(workflow::run)
```

{% /codes %}

A typical output (from the worker console):

```
03:43:55 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8d91-7aa1-9406-ae4d31fbeec1) - 1 starting
03:43:55 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8d91-7789-876b-b53c6de8cbbd) - 2 starting
03:43:55 - Service  019097bc-8d91-7ded-87c0-45ad7c1005cd - start processing 1
03:43:55 - Service  019097bc-8d91-78b4-b79e-3cb2cab15a80 - start processing 2
03:43:55 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8d91-7ed7-b1a6-920464d48e76) - 3 starting
03:43:55 - Service  019097bc-8d91-71b0-9951-3e68ba38904e - start processing 3
03:43:56 - Service  019097bc-8d91-71b0-9951-3e68ba38904e - stop processing 3
03:43:56 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8d91-7ed7-b1a6-920464d48e76) - 3 completed
03:44:05 - Service  019097bc-8d91-7ded-87c0-45ad7c1005cd - stop processing 1
03:44:05 - Service  019097bc-8d91-78b4-b79e-3cb2cab15a80 - stop processing 2
03:44:05 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8d91-7aa1-9406-ae4d31fbeec1) - 1 completed
03:44:05 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8d91-7789-876b-b53c6de8cbbd) - 2 completed
03:44:05 - Workflow 019097bc-8abc-739c-9e50-5f814ca3fe8a (method 019097bc-8abc-739c-9e50-5f814ca3fe8a) - all completed
```

## Forwarding Workflow's Metadata To Services

When dispatching a workflow, it's possible to associate some [metadata](/docs/workflows/syntax#meta).
Example of setting metadata when creating a workflow:

{% codes %}

```java
final HelloWorldWorkflow helloWorldWorkflow = newWorkflow(
    HelloWorldWorkflow.class,
    null,
    Map.of(
        "foo", "bar".getBytes(),
        "baz", "qux".getBytes()
    )
);
```

```kotlin
private val helloWorldWorkflow = newWorkflow(
    HelloWorldWorkflow::class.java,
    meta = mapOf(
        "foo" to "bar".toByteArray(),
        "baz" to "qux".toByteArray()
    )
)
```

{% /codes %}

{% callout %}

This metadata is not automatically forwarded to tasks (services) called by the workflow.

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
final HelloWorldWorkflow helloWorldWorkflow = newWorkflow(
    HelloWorldWorkflow.class,
    Set.of("userId" + userId, "companyId" + companyId)
);
```

```kotlin
val helloWorldWorkflow = newWorkflow(
    HelloWorldWorkflow::class.java, 
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