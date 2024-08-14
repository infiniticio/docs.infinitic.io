---
title: Building A Workflow Scheduler
description: .
---

{% callout type="note"  %}

The code examples for pages in this section are available on [Github](https://github.com/infiniticio/playbook).

{% /callout %}

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

