---
title: Infrastructure
description: This page provides an overview of the components that make up an Infinitic application, including the message broker, databases, workers, and clients. Learn how each component contributes to the overall functionality and reliability of your distributed system.
---

An Infinitic applications (running Services and Workflows) is composed of the following components:
- [Message Broker](#message-broker)
- [Databases](#databases)
- [Workers](#workers)
- [Clients](#clients)

## Message Broker

Infinitic requires a message broker to enable message transport between components. This broker must possess the following essential capabilities for maintaining the reliability, consistency, and fault-tolerance of the Infinitic distributed system:

1. **Persistent Storage**: Messages are stored reliably and persistently until explicitly acknowledged by the consumer, ensuring no data loss.
2. **Exclusive Consumption Model**: Each message is guaranteed to be consumed by only one consumer, preventing duplicate processing when scaling consumers.
3. **Key-Based Consumption Model**: Two messages with a same key are guaranteed not to be consumed at a same time, ensuring consistency.
4. **Scheduled Delivery**: The broker supports scheduling messages for future delivery at a specified time, enabling time-based operations.
5. **Retry Mechanism**: In case of consumer processing failures, the broker can automatically retry message delivery, enhancing system resilience.
6. **At-least-once Delivery Guarantee**: The broker ensures that each message is delivered at least once, safeguarding against message loss due to network or system failures.

Infinitic currently supports [Apache Pulsar](https://pulsar.apache.org/) as message broker. If you're new to it, [managed instances](/docs/references/pulsar#using-infinitic-with-third-party-providers) are an excellent solution. You don't need to master it, as Infinitic handles everything for you.

## Databases

Infinitic requires one or more databases to store various types of data:

1. Workflow States: The Workflow State Engine utilizes a database to persistently store the current state of each workflow instance. This enables workflows to resume from their last known state, even after a failure, without the need to keep the state in memory during the workflow execution.

2. Tags <> Workflow IDs relationship: The Workflow Tag Engine uses a database to maintain relationships between workflow IDs and their associated tags. This enables management of workflows based on their tags.

3. Tags <> Task IDs relationship: The Service Tag Engine uses a database to maintain relationships between task IDs and their associated tags. This enables management of tasks based on their tags.

Currently, Infinitic supports the following databases:
- **Redis** 
- **PostgreSQL**
- **MySQL**

Adding support for other databases is typically a straightforward process that can often be completed within a few days, depending on the specific database and its capabilities. If you're interested in adding support for a new database, [contact us](/docs/community/contact).

## Workers

Infinitic Workers are stateless components that produce and consume messages from the message broker. Infinitic provides the core code for these workers, which you can configure to perform various roles:

- [Service Executors](/docs/components/terminology#service-executor)
- [Service Tag Engine](/docs/components/terminology#service-tag-engine) (*Optional*)
- [Workflow Executors](/docs/components/terminology#workflow-executor)
- [Workflow State Engine](/docs/components/terminology#workflow-state-engine)
- [Workflow Tag Engine](/docs/components/terminology#workflow-tag-engine) (*Optional*)
- [Event Listeners](/docs/components/terminology#event-listener) (*Optional*)

You have the flexibility to configure workers based on your needs:

1. Development: For ease of setup, you may start with a single worker that includes all various components for all services and workflows.

2. Production: For better scalability and resource management, it's recommended to specialize workers:
   - Dedicate each worker to a specific component (executor, tag engine, state engine) and a specific Service or Workflow type
   - Deploy multiple instances of each specialized worker to handle the workload efficiently

This approach allows for fine-tuned scaling and improved performance in production environments.

## Clients

An Infinitic **Client**  allows you to interact with the Infinitic application. It can be used to start or cancel workflows, retry tasks, etc.

Infinitic currently supports Java and Kotlin clients.