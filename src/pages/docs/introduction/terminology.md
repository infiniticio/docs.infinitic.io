---
title: Terminology
description: Quidem magni aut exercitationem maxime rerum eos.

---

Welcome to Infinitic! Understanding the key terms used in Infinitic is crucial for effectively utilizing its capabilities. This guide breaks down the essential terminology in simple terms, helping you get a clear picture of how Infinitic operates.

## Services

**What is a service?** Services are the backbone of Infinitic. They are classes that implement various tasks or functions that you want to perform. Think of services like distinct units in your application, each responsible for a specific type of job. Examples include:

- `EmailService` for handling email-related tasks.
- `NotificationService` for sending notifications.
- `InvoiceService` for managing invoices.

**How Services Work.**
Services are connected and managed through the Apache Pulsar cluster. They can be scaled across multiple [workers](#worker) to handle tasks in parallel, ensuring efficiency and resilience.

![Services](/img/concept-service@2x.png)

## Tasks

A **task** is essentially a method within a [service](#service). It can be anything from a database operation, an API call, to any complex action specific to your domain. Tasks are processed inside [workers](#worker) and are invoked remotely via Apache Pulsar.

![Tasks](/img/concept-task@2x.png)

## Workers

**Understanding Workers.**  Workers are applications that run [services](#service). They embed Apache Pulsar's consumers to listen topics dedicated to each service, deserialize the input, process tasks, and return serialized results to Pulsar. Workers are stateless, meaning they don't store any data permanently, and can be scaled to meet demand. Workers are an integral part of ensuring that your distributed tasks are executed seamlessly by catching any [task](#task) failure, and managing retries.

![Workers](/img/concept-worker@2x.png)

{% callout type="note"  %}

In Infinitic, the complexity of communication between services and workflows is handled seamlessly for us. You don't have to worry about the underlying messages being sent back and forth. Here's a simple breakdown of how it works:

* Automatic Message Handling: Infinitic automatically manages the messages exchanged between services and workflows. This means you can focus on the core functionality of your services without delving into the messaging details.
* Worker Communication: Underneath, workers play a key role in this process. They receive commands to execute tasks, which include all the necessary details about the task. Once a task is completed, workers send back different types of messages (For example `TaskCompleted`: This message is sent if the task finishes successfully, along with the results of the task. `TaskFailed`: In case there's an error in the task, this message is sent, including details about the error).
* Orchestration vs. Choreography: In Infinitic, we use an orchestration pattern. This is different from a choreography pattern where services need to be aware of the events produced by other services. With orchestration, services are completely independent or decoupled. They don't need to know about each other's events; Infinitic coordinates everything.

{% /callout  %}

## Workflows

**Workflow Explained.**  Workflows are special types of [services](#service) that orchestrate the execution of various tasks. Unlike traditional methods, Infinitic workflows are defined [using code](https://medium.com/swlh/code-is-the-best-dsl-for-building-workflows-548d6824f549), offering more flexibility and control.

![Workflows](/img/concept-workflow@2x.png)

**How Workflows Operate.** Workflow workers are also stateless and scalable. They connect to databases like Redis or MySQL to manage the state of each workflow instance, ensuring smooth progress and execution.

{% callout type="note" %}

Workflow services in Infinitic are managed differently compared to typical services. Each workflow services gets its own unique message consumer. This consumer uses a method called a [key-shared subscription](https://pulsar.apache.org/docs/concepts-messaging/#key_shared), which is based on the workflow's ID. This approach is crucial for several reasons:

- Sequential Message Handling: By using a key-shared subscription, Infinitic ensures that all messages related to a specific workflow instance are processed in order. This sequential processing is important to prevent what we call 'race conditions'. Race conditions can occur when multiple messages for the same workflow are handled at the same time, which can lead to unexpected results or errors.
- Workflow State Caching: Each workflow instance maintains a local cache of its state. This means it keeps track of its current status, which is necessary to manage the workflow effectively.
- Avoiding Database Race Conditions: When saving the state of a workflow in the database, it's important to avoid race conditions here too. The sequential handling of messages ensures that updates to the workflow's state in the database are done in the right order, preventing conflicts and maintaining data integrity."

{% /callout  %}

## Clients

**Client's Role.** The client is primarily used to initiate new workflow instances. It needs to understand the workflow services' signatures and connect to the Apache Pulsar cluster to start and manage workflows.

![Clients](/img/concept-client@2x.png)
