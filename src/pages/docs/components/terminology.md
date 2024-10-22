---
title: Terminology
description: Explore the key terminology used in Infinitic, including Services, Tasks, Workflows, and Clients. This comprehensive guide provides clear definitions and explanations of essential concepts, helping developers understand and effectively utilize Infinitic's distributed system capabilities for building robust, scalable applications.
---


 Understanding the key terms used in Infinitic is crucial for effectively utilizing its capabilities. This guide breaks down the essential terminology in simple terms, helping you get a clear picture of how Infinitic operates:
- [Services](#services)
- [Tasks](#tasks)
- [Workflows](#workflows)
- [Clients](#clients)

## Services

In your distributed Infinitic application, each Infinitic **Service** is responsible for a specific domain of work. 
Here are some examples of Services in a typical distributed application:

- `OrderService`: Manages order processing and fulfillment
  - Methods: createOrder(), updateOrderStatus(), cancelOrder()

- `InventoryService`: Handles product inventory management
  - Methods: checkStock(), updateInventory(), reserveItems()

- `PaymentService`: Processes payments and refunds
  - Methods: processPayment(), issueRefund(), validatePaymentDetails()

- `UserService`: Manages user accounts and authentication
  - Methods: createUser(), updateUserProfile(), deleteUser()

- `ShippingService`: Coordinates shipping and delivery logistics
  - Methods: calculateShippingCost(), createShippingLabel(), trackPackage()

The Java interface of Services are used [as contracts](/docs/introduction/interfaces) to define the methods that can be invoked remotely.

In practice, those Infinitic Services can embed a complete implementation of their methods, or delegate the implementation to your existing infrastructure, for examples by [calling APIs](/docs/services/practices#task-using-apis).

To have an Infinitic Service operational, you need to deploy:

-  one or more [Service Executor](#service-executor)
- one or more [Service Tag Engine](#service-tag-engine) (*optional*)

To scale your Infinitic Service and handle increased workload, you can allow those components to handle multiple messages simultaneously, and you can distribute the workload by deploying multiple instances of those components. This approach allows for increased throughput and improved fault tolerance.

### Service Executor

{% callout %}
**Service Executors** are stateless components needed to process [tasks](#tasks) for a Service. They contains the implementation of the Service interface and are responsible for executing the methods defined in the Service interface.
{% /callout %}


### Service Tag Engine

{% callout %}
**Service Tag Engines** are stateless components that are useful if you want to process bulk operations on tasks based on their tags. They maintain the relationship between task IDs and task tags within a [database](/docs/infrastructure/databases).
{% /callout %}

## Tasks

An Infinitic **Task** simply represents a remote call to a public method of a Service. A task is embodied as a message containing the method name and its parameters, handled by a service executor, responsable for processing it and managing the possible retries.

## Workflows

An Infinitic **Workflow**  is a high-level orchestration of tasks that defines a business process that orchestrates complex, error-prone, multi-step Service calls, potentially including human interactions, such as:

- **E-commerce Order Processing**: Validating order details, checking inventory, processing payment, allocating items from the warehouse, generating a shipping label, and notifying the customer of the order status.

- **Employee Onboarding**: Creating user accounts (email, HR system, etc.), assigning and shipping equipment, scheduling orientation sessions, collecting necessary documents (tax forms, contracts), setting up payroll, assigning a mentor, and scheduling check-ins for the first month.

-  **Insurance Claim Processing**: Receiving and validating a claim, assigning it to an adjuster, investigating the claim (which may include multiple sub-tasks), evaluating coverage, calculating the payout amount, getting approval for large claims, processing the payment, and closing the claim while notifying the customer.

- **Content Publishing**: Encompass content creation, editorial review, revisions (potentially multiple rounds), final approval, SEO optimization, scheduling publication, publishing the content, and promoting it on social media channels.

- **Loan Application**: Receiving the application, verifying applicant information, checking credit score, assessing risk, determining loan terms, getting approvals (which may involve multiple levels for larger loans), generating loan documents, scheduling signing, and disbursing funds.

These workflows demonstrate how complex business processes can be broken down into discrete steps, each of which could be a task executed by a different Infinitic service. 

When building such process, you usually end-up adding a lot of glue code to manage states, observability, errors and time. Infinitic offers a more efficient way that provides you with:

1. **Automatic State Management**: Infinitic handles the state persistence of your processes, enabling long-running operations without you having to implement checkpointing or state recovery mechanisms.

2. **Built-in Error Handling**: Infinitic provides robust error handling and retry logic out of the box, improving the reliability of your processes without additional coding effort.

3. **Enhanced Observability**: Infinitic offers built-in monitoring and tracking tools for workflows, giving you better visibility into your processes without implementing custom logging or monitoring solutions.

4. **Scalability and Fault Tolerance**: Workflows are designed to be scalable and resilient to failures, handling issues like network problems or service outages transparently.

5. **Versioning and Maintenance**: Workflows can be versioned and updated independently, allowing for easier maintenance and evolution of your business processes over time.

Moreover, these benefits are achieved with minimal additional coding effort. Infinitic allows you to write workflows in a manner similar to coding in a monolithic architecture, despite the distributed nature of the system. 

In practice, a workflow is defined within a Java or Kotlin class that orchestrates remote calls to Services. The Java interface of Workflows are used [as contracts](/docs/introduction/interfaces) to define the methods that can be invoked remotely.

{% callout %}
Although a workflow is defined as a Java or Kotlin class, it's important to understand that there isn't a long-running instance of this class persisting in memory throughout the workflow's execution. Instead, the workflow's execution is managed through a series of messages exchanged and processed by Infinitic components:

1. The workflow state is stored persistently.
2. When a step in the workflow needs to be executed, Infinitic creates a temporary instance of the workflow class.
3. This instance processes the current step and updates the workflow state.
4. The instance is then discarded, freeing up memory.
5. This process repeats for each step of the workflow.

This message-based approach allows Infinitic to manage long-running workflows efficiently, without consuming memory resources for idle workflows.
{% /callout %}

To have an Infinitic Workflow operational, you need to deploy:
- one or more [Workflow Executor](#workflow-executor)
- one or more [Workflow State Engine](#workflow-state-engine)
- one or more [Workflow Tag Engine](#workflow-tag-engine) (*optional*)

To scale your Infinitic Workflow and handle increased workload, you can allow those components to handle multiple messages simultaneously, and you can distributes the workload by deploying multiple instances of those components. This approach allows for increased throughput and improved fault tolerance.

### Workflow Executor

{% callout %}
**Workflow Executors** are stateless components needed to process steps of Workflow. They contains the implementation of the Workflow interface and are responsible for processing the methods defined in the Workflow interface.
{% /callout %}

### Workflow State Engine

{% callout %}
**Workflow State Engines** are stateless components needed to maintain and store the state of the Workflow in a [database](/docs/infrastructure/databases). They are responsible for triggering the Workflow Executor when needed.
{% /callout %}  

### Workflow Tag Engine

{% callout %}
**Workflow Tag Engines** are stateless components that are useful if you want to process bulk operations on workflows based on their tags. They maintain the relationship between workflow IDs and workflow tags within a [database](/docs/infrastructure/databases).
{% /callout %}

## Clients

An Infinitic **Client** is a local proxy to remote Infinitic Services or Workflows. Provided by Infinitic, it is used by your application to start workflows and interact with them. 