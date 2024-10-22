---
title: Event-Driven
description: This page provides an in-depth exploration of how Infinitic harnesses event-driven architecture to facilitate robust and efficient business processes management in distributed systems. Ideal for Java and Kotlin developers, this guide is your resource for mastering event-driven processes with Infinitic.
---
Infinitic enables the creation of scalable and robust business processes in Java or Kotlin, simplifying the complexities typically associated with distributed systems. This is achieved through several key features:

* Services are invoked remotely using an event-based RPC method, which creates the illusion of local calls.
* The persistence and handling of messages are assured by Apache Pulsar.
* Services are coordinated by dedicated Workflow services, which maintain a history for each workflow instance. This allows them to pick up where they left off, ensuring continuity.

Despite workflows appearing to be coded in a straightforward, step-by-step manner, they are actually driven by events.

## Sequential Workflow Example

Let's take a simple bank transfer workflow as an example. It sequentially processes three tasks: withdrawing from one account, depositing into another, and then sending an email confirmation. In a real-world scenario, we would account for potential business errors like insufficient funds, but for simplicity, we'll skip these here, although Infinitic is easily capable of handling such cases.

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

It's not immedialely visible but this workflow is resilient to technical failures:

* If a task fails, it's automatically retried.
* If it fails permanently, the workflow can restart from the point of failure after the issue is resolved.

{% /callout  %}

## Event-based execution

Here's a breakdown of what happens behind the scenes when running `BankWorkflow::wire` above:

![Event-based execution](/img/workflow-as-code-example@2x.png)

**1. Workflow Initiation** : The process begins when the client initiates the `BankWorkflow::wire` method. Internally, a `RunWorkflow` command with a unique `workflowId` is generated and dispatched.

**2. Receiving and Processing the Workflow** : A `BankWorkflow` instance then receives this `RunWorkflow` command. It checks if a workflow with this `workflowId` already exists. If not, it starts the `wire` method, handling the sequence of tasks.

**3, 5 and 7. Executing Tasks** : Each task within the workflow (such as withdrawal, deposit, and email sending) is executed in turn. These tasks are handled by their respective services. If a task fails, the worker is capable of handling this. The service will either retry the task. After a service completes a task, it sends back a `TaskCompleted` message.

**4, 6 and 8. Workflow Progression** : Upon receiving the `TaskCompleted` message, the `BankWorkflow` service updates its history with the results of the task. It then proceeds to the next step in the workflow sequence.

**9. Completing the Workflow** : Once all the tasks in the workflow are successfully completed, a `WorkflowCompleted` message is sent back to the client. This marks the end of the workflow, and its history is subsequently cleared.

This detailed breakdown illustrates the event-driven nature of the `BankWorkflow`, highlighting how tasks are processed sequentially and how the workflow adapts and responds to task completions and failures.

{% callout type="note"  %}

As shown in this example, a 'running workflow' is actually a series of events. Each event corresponds to a task being processed and the step-by-step progression of the workflow.

{% /callout  %}

## Constraints

For deterministic replayability, a workflow must contain only the logical sequence of tasks and avoid elements that change behavior over time. More details on these constraints are available [here](/docs/workflows/syntax).

## Possibilities

This approach to workflow design makes Infinitic highly scalable and resilient to failures, offering endless possibilities for task orchestration:

* Data can be easily manipulated between tasks. Use language-specific structures like if/then and for/map.
* Dispatch tasks [asynchronously](/docs/workflows/parallel).
* Implement [child-workflows](/docs/workflows/parallel#child-workflows) and execute multiple methods in parallel.
* Wait for a [duration](/docs/workflows/waiting), a date, or external [signals](/docs/workflows/signals).
* Wait for the completion of any [asynchronous execution](/docs/workflows/deferred).
