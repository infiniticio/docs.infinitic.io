---
title: Terminology
description: Quidem magni aut exercitationem maxime rerum eos.
---

## Service

**Services** are classes that implement domain-driven methods, called [tasks](#task) in Infinitic terminology.
Typical self-explanatory examples are:

- `EmailService`
- `NotificationService`
- `InvoiceService`
- `HotelBookingService`
- `BankService`

Services are exposed through our Apache Pulsar cluster by [workers](#worker).

![Services](/img/concept-service@2x.png)

As illustrated above:

- one worker can contain multiple instances of the same service. This is useful for a worker to run multiple [tasks](#task) in parallel.
- the same service can be deployed through multiple workers. This is useful to scale the service horizontally and ensure resiliency to the failure of a worker.

A worker can also contain different services if needed.

## Task

A **task** is a [service](#service)'s method. It can be

- a database call;
- an API call;
- a complex domain-driven action;
- actually anything!
Tasks are processed inside [workers](#worker) and remotely invoked through Apache Pulsar.

![Tasks](/img/concept-task@2x.png)

## Worker

A **worker** is a running application connected to our Apache Pulsar cluster and configured to run one or multiple [services](#service). For each service that it contains, a worker does:

- listen to the Apache Pulsar's topic dedicated to the service;
- consume and deserialize their messages and process [tasks](#task) accordingly;
- send back the serialized results.
Workers are stateless and can be scaled horizontally.

![Workers](/img/concept-worker@2x.png)

{% callout type="note"  %}

When using Infinitic, we do not need to know anything about the messages exchanged between services and workflows. Infinitic handles that for us. under the hood, workers receive `ExecuteTask` command messages (with task's details) and return `TaskCompleted` (with task's result) or `TaskFailed` (with task's error) event messages. When using a choreography pattern, services need to know the events produced by other services. This is not the case here as we use an orchestration pattern. Services are fully decoupled.

{% /callout  %}

## Workflow

A **workflow** is a special service dedicated to orchestrating the execution of different tasks (or sub-workflows) according to an execution logic directly described in its methods. Infinitic does not define workflows through JSON or Yaml files but with imperative code, following a modern [_workflow as code_](https://medium.com/swlh/code-is-the-best-dsl-for-building-workflows-548d6824f549) pattern.

![Workflows](/img/concept-workflow@2x.png)

Workers running workflows are also stateless and can be scaled horizontally. They connect to a database storing the state of each workflow instance. Infinitic automatically maintains those states as workflow executions progress.

Today, supported databases are Redis and MySQL. Adding another database is trivial; please [contribute](https://github.com/infiniticio/infinitic).
Soon, workflow services could be deployed as [Pulsar stateful functions](https://pulsar.apache.org/docs/functions-overview/), removing the need to manage another database.

{% callout type="note" %}

Contrary to "normal" services, each workflow instance has its own message consumer using a [key-shared subscription](https://pulsar.apache.org/docs/concepts-messaging/#key_shared) on workflow's ID to ensure that all messages related to the same workflow instance are handled sequentially. This is needed to:

- avoid race conditions induced by parallel handling of multiple messages related to the same workflow instance
- maintain locally a cache of the workflow state
- avoid race conditions when saving workflow state in the database

{% /callout  %}

## Client

We use a _client_ mainly to start new workflow instances. To do so, clients need to know the signature of workflow services and be able to connect to our Apache Pulsar cluster.

![Clients](/img/concept-client@2x.png)
