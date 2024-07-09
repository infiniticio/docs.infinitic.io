---
title: Workflows Playbook
description: .
---

This page describes how to implement common situations.

## Recurring Workflows

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

{% /callout  %}

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

{% /codes %}



## Follow-up on asynchronous tasks 

## Forwarding workflow's matadata to services

## Register programmatically Workflows

## Register programmatically Services



## Connecting to a Pulsar cluster

{% callout type="note"  %}

If they do not exist already, tenant and namespace are automatically created by Infinitic workers at launch time.

{% /callout  %}

Infinitic clients and workers need to know how to connect to our Pulsar cluster.
This is done through a `pulsar` entry within their configuration file.

### Minimal configuration

The minimal configuration - typically needed for development - contains:

```yaml
pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```
