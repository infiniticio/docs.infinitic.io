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

[Infinitic Client](/clients/infinitic-client) let us start and cancel tasks or workflows, usually from your Web App controllers.

## Infinitic Workers

Infinitic provides a worker that can have 4 different roles, depending on its configuration:

- task executor
- workflow executor
- task engine
- workflow engine

Those workers can be run separately or on the same binary (as for our [hello world app](/overview/hello-world)), depending on the configuration you choose. 


<alert type="warning">

At least a task executor and a task engine must be running to be able to process tasks. Add at least a workflow executor and a workflow engine to be able to run workflows.

</alert>

### Task Executor

[Task executors](/task-executor/introduction) are stateless workers. Their role is to process our tasks.

### Workflow Executor

[Workflow executors](/workflow-executor/introduction) are stateless workers. Their role is to process [workflowTasks](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) (special tasks using our workflows to decide what should be done next, based on current workflow history).

### Task Engine

[Task engines](/task-engine/introduction) are stateful workers. Their roles are:

- to maintain the state of each task request, up to completion or cancellation,
- to manage retries and timeouts.

The state of tasks are stored on Redis* by the task engines. This storage is mainly used as a backup in case of failure of those engines.

### Workflow Engine

[Workflow engines](/workflow-engine/introduction) are stateful workers. their role are:

- to maintain the state of each workflow instance, up to its completion or cancellation,
- to manage retries and timeouts.

The state of workflows are stored on Redis* by the workflow engines. This storage is mainly used as a backup in case of failure of those engines.


<alert type="info">
*We envision using Pulsar function states as a primary option for states' storage, instead of Redis. Unfortunately, this feature is not yet production-ready in Pulsar.
</alert>