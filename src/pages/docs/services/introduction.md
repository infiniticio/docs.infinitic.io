---
title: Service Introduction
description:
---

## What Are Services?

Services are units of business logic that perform specific tasks or operations within your application. **A service is implemented as a class with methods that represent different operations**. For example, in an e-commerce application, you might have services like:

* **OrderService**: Handles order processing, validation, and management.
   - Methods: createOrder(), updateOrderStatus(), cancelOrder()

* **InventoryService**: Manages product inventory and stock levels.
   - Methods: checkStock(), updateInventory(), reserveItems()

* **PaymentService**: Processes payments and refunds.
   - Methods: processPayment(), issueRefund(), validatePaymentDetails()

* **UserService**: Manages user accounts and authentication.
   - Methods: createUser(), updateUserProfile(), authenticateUser()

In Infinitic, Services are invoked through an event-based Remote Procedure Call (RPC) mechanism. 

![Service workers](/img/concept-service.png)

A method invoked through Infinitic, is called a task. A task encapsulates the Service name, the method name, its arguments, and other relevant metadata. This task is then processed by Service Executors, allowing for distributed and asynchronous execution of your business logic.


## Service Interface as a Contract

The interface of a Service describes all public methods and their parameters. In Infinitic, the interface serves as a crucial contract between the Service implementation and its consumers, which can be a client, another Service or Workflow. This interface defines the public methods that can be invoked as tasks, establishing a clear API for interaction.

This provides several benefits:

* **Simplicity**: By using interfaces, you don't need to write APIs or define event structures. The interface serves as a straightforward contract, making it easier to understand and implement services. 

* **Contract Enforcement**: The interface ensures that the Service implementation adheres to the agreed-upon contract, reducing the risk of breaking changes that could affect consumers.

* **Documentation**: The interface serves as a form of documentation, clearly outlining the available operations and their expected inputs and outputs.

Changes to the interface should be carefully managed to minimize disruption to existing consumers (see [versioning](/docs/services/versioning)). 

{% callout type="note"  %}

To promote accessibility and reuse, Service interfaces (and the objects they contain) can be grouped in a common module shared across different teams. This approach facilitates clear communication and collaboration between teams, as they can easily understand and use the services provided by other parts of the organization.

{% /callout  %}

## Event-Based Service Invocation

Services are invoked through an event-based Remote Procedure Call (RPC) mechanism. Here's how it works:

1. **Task Creation**: When a method on a Service is called, Infinitic creates a task command that encapsulates all the necessary information to execute the method, including:
   - The Service name
   - The method name
   - The serialized method arguments
   - The potential tags and metadata

2. **Event Publishing**: The task command is published to a message broker. This decouples the caller from the Service implementation, allowing for asynchronous processing.

3. **Event Consumption**: Service Executors subscribe to these task commands. When a relevant command is received, the Executor:
   - Deserializes the task information
   - Instantiates the appropriate Service, based on the Service name
   - Invokes the specified method with the provided arguments after deserializing them

4. **Result Handling**: After method execution, the result (or any exception) is serialized and published back to the message broker as a new task event.

5. **Result Retrieval**: The original caller can then retrieve the result asynchronously.

This event-based RPC approach offers several advantages:

- **Scalability**: Services can be scaled independently based on their workload.
- **Fault Tolerance**: If a Service Executor fails, the task can be automatically retried on another instance.
- **Observability**: The event-based nature allows for easy tracking and monitoring of task execution.






