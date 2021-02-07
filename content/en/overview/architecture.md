---
title: Architecture
description: ""
position: 1.6
category: "Overview"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Let's dive deeper into Infinitic [event-based 's architecture](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c):

<img src="/concept-architecture@2x.png" class="img" width="1280" height="640" alt=""/>

## Clients

Infinitic Client let us start and cancel tasks or workflows, usually from your Web App controllers.

## State Storage

The tasks and workflows' states are stored on Redis* by the task engines and the workflow engines. This storage is mainly used as a backup in case of failure of those engines. 

<alert type="info">
* To minimize the infrastructure overhead, we envision using Pulsar function states (powered by Bookkeeper Table Service) as a primary option for states' storage, instead of Redis. Unfortunately, this feature is not yet production-ready in Pulsar.
</alert>

## Task Executors

Task executors are stateless workers. Their role is to process tasks. 

## Task Engine

Task engines are stateful workers. Their role are:
- to maintain the state of each task request, up to completion or cancellation, 
- to manage retries and timeouts.

## Workflow Executors

Workflow executors are stateless workers. Their role is to process [workflowTasks](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c), that are special tasks deciding what should be done next for a given workflow instance

## Workflow Engine
Workflow engines are stateful workers. Its role is to maintain the state of each workflow instance up to its completion or cancellation


