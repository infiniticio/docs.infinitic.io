---
title: Event-Driven
description: This page provides an in-depth exploration of how Infinitic harnesses event-driven architecture to facilitate robust and efficient business processes management in distributed systems. Ideal for Java and Kotlin developers, this guide is your resource for mastering event-driven processes with Infinitic.
---
Infinitic simplifies the creation of scalable and robust business processes in Java or Kotlin by addressing the complexities typically associated with distributed systems. This is achieved through several key features:

1. Event-Based Remote Procedure Calls (RPC): Services are invoked remotely using an event-based RPC mechanism, providing developers with a familiar local method call experience. This abstraction helps manage the complexity of distributed communication.

2. Reliable Message Handling: Apache Pulsar, a distributed messaging system, ensures the persistence and efficient handling of messages within the system.

3. Workflow Coordination: Dedicated Workflow services orchestrate processes, maintaining a history for each workflow instance. This enables workflows to resume from their last known state, enhancing system resilience.

4. Event-Driven Architecture: While workflows are coded in a sequential manner, they operate on an event-driven foundation. This approach combines the benefits of event-driven systems with a more intuitive programming model.

These features allow developers to build distributed business processes using familiar coding patterns, while leveraging the advantages of a robust, event-driven architecture.

## Workflow Example

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

## Leveraging Event Data for System Insights

While understanding events isn't necessary to start using Infinitic, they become crucial for advanced use cases such as building custom dashboards or integrating with other systems. Infinitic offers a powerful [event listening mechanism](/docs/events/creation) that allows you to capture and process all events generated by workflows and services. This feature provides deep insights into your distributed system's behavior and enables seamless integration with external tools and processes.

Key benefits of Infinitic's event listening capabilities include:

1. Real-time monitoring: Track the progress and status of workflows and tasks as they execute.
2. Custom analytics: Gather data for performance analysis and system optimization.
3. Audit trails: Maintain detailed records of all operations for compliance and debugging purposes.
4. Integrations: Trigger actions in external systems based on specific workflow or task events.
5. Alerting: Set up notifications for critical events or anomalies in your workflows.

## Advanced Workflow Capabilities

Infinitic's event-driven approach to workflow design offers a powerful combination of scalability, resilience, and flexibility. This architecture unlocks a wide range of possibilities for sophisticated task orchestration:

* Seamless data manipulation: Leverage native language constructs like conditionals and loops to process data between tasks effortlessly.
* [Asynchronous task execution](/docs/workflows/parallel): Optimize performance by dispatching tasks concurrently.
* [Hierarchical workflows](/docs/workflows/parallel#child-workflows): Create modular, reusable workflow components and execute multiple workflow methods in parallel.
* Time-based and event-driven control: Incorporate [timed waits](/docs/workflows/waiting) for specific durations or dates, and respond to external [signals](/docs/workflows/signals) for dynamic workflow behavior.
* [Deferred execution management](/docs/workflows/deferred): Coordinate and wait for the completion of any asynchronous operations within your workflows.
