---
title: Terminology
description: This page is your starting point to learn about Services, Tasks, Workflows, and Clients in Infinitic's orchestration framework. Dive into the foundational elements of Infinitic and streamline your knowledge of distributed systems.
---
Welcome to Infinitic! Understanding the key terms used in Infinitic is crucial for effectively utilizing its capabilities. This guide breaks down the essential terminology in simple terms, helping you get a clear picture of how Infinitic operates.

## Services and Tasks

In your distributed application, each **Service** is responsible for a specific domain of work. Examples include:

- `EmailService` for sending emails.
- `NotificationService` for sending notifications.
- `InvoiceService` for managing invoices.

In practice, a Service is implemented through a class that implements an interface, whose public methods define the contract for remote calls to this Service.

A **Task** is essentially a remote call to a public method of a Service. It can perform operations such as database operations, API calls, or any complex action specific to your domain.

Tasks are invoked remotely by [Workflows](#workflows) and processed within [Workers](#worker), built using the provided Infinitic SDK that handles serialization and the management of events for you:

![Tasks](/img/concept-task@2x.png)

## Workflows

Workflows orchestrate the remote calls of various [Tasks](#services-and-tasks) to achieve your business goals.

They are implemented [using code](/docs/workflows/syntax) (offering unparalleled flexibility and control) and executed within [Workers](#worker), built using the provided Infinitic SDK that handles serialization and the management of events for you.

[Workflow Workers](#workers) are stateless and horizontally scalable. The state of workflows is continuously saved in a database.

![Workflows](/img/concept-workflow@2x.png)


## Workers

Workers are Pulsar producers and consumers that run [Services](#services-and-tasks) or [Workflows](#workflows) according to their configuration.

A worker listens to the topics dedicated to each service or workflow it implements. When receiving the instruction to run a task or incrementally move forward a workflow, the worker deserializes the input, triggers the processing, and returns the result to Pulsar in a JSON serialized format. 

Workers are stateless, meaning they don't store any data permanently, and can be scaled to meet demand and ensure resilience.

Workers also catch any failure and manage retries, ensuring that your distributed operations are executed seamlessly.

![Workers](/img/concept-worker@2x.png)

{% callout type="note"  %}

Infinitic uses an orchestration pattern. This is different from a choreography pattern where services need to be aware of the events produced by other services. With orchestration, services are completely independent or decoupled. Here, services don't need to know about each other's events. Workflows only need to know the Services' interfaces.

{% /callout  %}

## Clients

The client is primarily used to initiate new workflow instances. It needs to understand the workflow services' signatures and connect to the Apache Pulsar cluster to start and manage workflows.

![Clients](/img/concept-client@2x.png)
