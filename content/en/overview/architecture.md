---
title: Architecture
description: ""
position: 1.2
category: "Overview"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic [event-based 's architecture](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) is organized around:

- clients, used mainly to start tasks or workflows
- a transport layer (Pulsar), moving messages between clients, engines, and executors
- a storage layer (Redis*) transiently storing states of running tasks and workflows
- a storage layer (Pulsar) permanently storing all events (used only by dashboards)
- 4 worker types:
  - _TaskExecutor_, whose role is to execute tasks
  - _WorkflowExecutor_, whose role is to execute [workflowTasks](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) (special tasks whose role is to decide what should be done next for each workflow instance)
  - _TaskEngine_, whose role is to send tasks to TaskExecutors and to maintain the state of each of them, up to its completion or cancellation,
  - _WorkflowEngine_, whose role is to send [workflowTasks](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) to WorkflowExecutors and to maintain the state of each workflow, up to its completion or cancellation

<img src="/overview-architecture.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/overview-architecture.png" class="dark-img" width="1280" height="640" alt=""/>

<alert type="info">
* To minimize the infrastructure overhead, we want to use Pulsar function states (powered by Bookkeeper Table Service) as a primary option for states' storage, instead of Redis. Unfortunately, this feature is not yet production-ready.
</alert>