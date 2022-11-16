---
title: Event-Driven Workflows
description: Quidem magni aut exercitationem maxime rerum eos.
---

Infinitic let us define workflows with imperative Java or Kotlin  - as if the code was processed on an infallible monolith. To be able to do so:

- Services are remotely called using an RPC technique provided by Infinitic
- Workflow services keep track of the execution history of each workflow instance so that it can be restarted from where it left off.

Despite the apparent imperative coding of workflows, their processings are event-driven.

## Sequential Workflow Example

We consider here a simple transfer `BankWorkflow::wire` workflow with the sequential processings of three tasks (`BankService::withdraw`, `BankService::deposit`, and `EmailService::send`):

![Sequential Workflow Example](/img/banking@2x.png)

We expect the task `BankService::deposit` to be executed only after `BankService::withdraw` is completed. When both are done, then `EmailService::send` is called.

{% callout type="note"  %}

A real-world scenario would take into account the possibility that these tasks fail for business reasons, e.g., the sender does not have enough funds or the receiver's bank details are wrong. For the sake of simplicity, we do not consider these cases here.

{% /callout  %}

Here is the code of this workflow:

{% codes %}

```java
import io.infinitic.workflows.*;

// tasks signatures
public interface BankService {
    void withdraw(String wireId, String emitterId, int amount);
    void deposit(String wireId, String recipientId, int amount);
}

// workflow description
public class BankWorkflow extends Workflow {
    // create a stub of BankService
    private final BankService bankService = newService(BankService.class);
    // create a stub of EmailService
    private final EmailService emailService = newService(EmailService.class);

    void wire(String wireId, String emitterId, String recipientId, int amount) {
        // withdraw from emitter account
        bankService.withdraw(wireId, emitterId, amount);
        // deposit to recipient account
        bankService.deposit(wireId, recipientId, amount);
        // send confirmation email to emitter
        emailService.send(wireId, emitterId, amount)
    }
}
```

```kotlin
import io.infinitic.workflows.*

// tasks signatures
interface BankService {
    fun withdraw(wireId: String, emitterId: String, amount: int)
    fun deposit(wireId: String, recipientId: String, amount: int)
}

// workflow description
class BankWorkflow: Workflow() {
    // create a stub of BankService
    private val bankService = newService(BankService::class.java)
    // create a stub of EmailService
    private val emailService = newService(EmailService::class.java)

    fun wire(wireId: String, emitterId: String, recipientId: String, amount: int) {
        // withdraw from emitter account
        bankService.withdraw(wireId, emitterId, amount)
        // deposit to recipient account
        bankService.deposit(wireId, recipientId, amount)
         // send confirmation email to emitter
        emailService.send(wireId, emitterId, amount)
    }
}
```

{% /codes %}


{% callout type="note"  %}

It's not visible from the code, but this workflow is resilient to technical failures:

- if a task fails, it will be automatically retried
- if a task permanently fails, the workflow will pick up where it left off after manually correcting the faulty task.

{% /callout  %}

## Event-based execution

The picture below explains what happens under the hood when Infinitic runs the workflow `BankWorkflow::wire` above:

![Event-based execution](/img/workflow-as-code-example@2x.png)

1. The client triggers a synchronous execution of the `BankWorkflow::wire` (synchronous means that the client is waiting for the workflow result). Internally the client creates and sends a `RunWorkflow` message with a new `workflowId`.
2. One instance of the `BankWorkflow` service catches this message (this instance will automatically stay the same as the message routing is based on the value of `workflowId`). This instance checks in the database that this workflow does not exist already; injects an empty history into a `BankWorkflow` instance, and runs the `wire` method.

    - When reaching the synchronous `withdraw` call on the `bankService` stub, this latter checks this task was not already dispatched, sends a `runTask` message, stops the execution here and updates the workflow history.
3. One instance of the `BankService` service catches this message, executes the `withdraw` command on sends back a `TaskCompleted` message with the serialized output.
4. the `BankWorkflow` service catches this message, gets (from cache) the current workflow history; update it with the content of the message, then inject the updated history into a `BankWorkflow` instance, and runs the `wire` method.

    - When reaching the synchronous `withdraw` call on the `bankService` stub, this latter finds in the history that this task has already been completed and returns its result.
    - When reaching the synchronous `deposit` call on the `bankService` stub, this latter checks this task was not already dispatched, sends a `runTask` message, stops the execution here and updates the workflow history.
5. One instance of the `BankService` service catches this message, executes the `deposit` command on sends back a `TaskCompleted` message with the serialized output.
6. the `BankWorkflow` service catches this message, gets (from cache) the current workflow history, update it with the content of the message, then inject the updated history into a `BankWorkflow` instance, and runs the `wire` method.

    - When reaching the synchronous `withdraw` call on the `bankService` stub, this latter finds in the history that this task has already been completed and returns its result.
    - When reaching the synchronous `deposit` call on the `bankService` stub, this latter finds in the history that this task has already been completed and returns its result.
    - When reaching the synchronous `send` call on the `emailService` stub, this latter checks this task was not already dispatched, sends a `runTask` message, stops the execution here and updates the workflow history.
7. One instance of the `EmailService` service catches this message, executes the `send` command on sends back a `TaskCompleted` message with the serialized output.
8. the `BankWorkflow` service catches this message, gets (from cache) the current workflow history, update it with the content of the message, then inject the updated history into a `BankWorkflow` instance, and runs the `wire` method.

    - When reaching the synchronous `withdraw` call on the `bankService` stub, this latter finds in the history that this task has already been completed and returns its result.
    - When reaching the synchronous `deposit` call on the `bankService` stub, this latter finds in the history that this task has already been completed and returns its result.
    - When reaching the synchronous `send` call on the `emailService` stub, this latter finds in the history that this task has already been completed and returns its result.
    - When reaching the end of the method, a `WorkflowCompleted` message is sent back to the client, and the workflow history is deleted.
9. the client catches this message and gets the workflow result from its content.

{% callout type="note"  %}

As illustrated here, we can see that a "running workflow" is not an ongoing thread somewhere, but is composed of multiple events related to the processing of tasks and the ephemeral step-by-step processing of the workflow.

{% /callout  %}

This event-driven nature of the orchestration makes Infinitic highly scalable. We will see later that it makes also the workflows resilient to failures.

## Constraints

To be able to replay deterministically a workflow implementation must contain only the logical sequence of tasks and in particular must avoid any element that can change its behavior over time.

Those constraints are described in details [here](/docs/workflows/syntax).

## Possibilities

We have seen how to implement simple sequential tasks, but the possibilities are endless:

- we can easily manipulate the data between tasks
- we can use the conditional structure of the language (if/then), the loop/functional structure (for/map)
- we can dispatch tasks [asynchronously](/docs/workflows/parallel)
- we can dispatch [sub-workflows](/docs/workflows/parallel#child-workflows)
- we can dispatch [multiple methods](/docs/workflows/parallel#parallel-methods) in parallel
- we can wait for a [duration](/docs/workflows/waiting), a date or for external [signals](/docs/workflows/signals)
- we can wait for the completion of any [asynchronous execution](/docs/workflows/deferred)
