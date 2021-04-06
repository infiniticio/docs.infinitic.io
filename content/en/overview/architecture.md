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

<img src="/overview-architecture@2x.png" class="img" width="1280" height="640" alt=""/>

## Infinitic Client

[Infinitic Client](/clients/building-client) let us start and cancel tasks or workflows, usually from your Web App controllers.

## Infinitic Workers

Infinitic provides a worker that can have four different roles, depending on its configuration:

- task executor
- workflow executor
- task engine
- workflow engine
- tag engine

Those workers can be run separately or on the same binary (as for our [hello world app](/overview/hello-world)), depending on the configuration you choose.

<alert type="warning">

At least a task executor and a task engine must be running to be able to process tasks. Add at least a workflow executor and a workflow engine to be able to run workflows.

</alert>

### Task Executor

[Task executors](/tasks/running) are stateless workers. Their role is to process our tasks.

### Workflow Executor

[Workflow executors](/workflows/running) are stateless workers. Their role is to process [workflowTasks](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) (special tasks using our workflows to decide what should be done next, based on current workflow history).

### Task Engine

[Task engines](/task-engines/running) are stateful workers. Their roles are:

- to maintain the state of each task request, up to completion or cancellation,
- to manage retries and timeouts.

The states of running tasks are stored on Redis\* by the task engines. As Infinitic implements an in-memory cache, we use this storage:
- as a backup in case of failure of those engines, 
- for retrieving states of long-running tasks.

### Workflow Engine

[Workflow engines](/workflow-engines/running) are stateful workers. their role are:

- to maintain the state of each workflow instance, up to its completion or cancellation,
- to manage retries and timeouts.

The states of running workflows are stored on Redis\* by the workflow engines. As Infinitic implements an in-memory cache, we use this storage:
- as a backup in case of failure of those engines, 
- for retrieving states of long-running workflows.

<alert type="info">
*We envision using Pulsar function states as a primary option for states' storage instead of Redis. Unfortunately, this feature is not yet production-ready in Pulsar.
</alert>

### Tag Engine

The role of tag engines is to maintain the list of *running* tasks and *running* workflows associated to each tag.

This relation is currently stored on Redis\* as a Set data structure.