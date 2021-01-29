---
title: Running Workflows
description: ""
position: 3.2
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic provides a worker implementation that can play [4 different roles](/references/architecture), depending on its configuration:

- task engine
- task executor
- workflow engine
- **workflow executor**

Workflow executors are in charge of processing workflowTasks: they listen Pulsar for instructions, process workflowTasks, and send serialized return value back to Pulsar.

## Implementation

Use `io.infinitic.pulsar.InfiniticWorker` to start a workflow executor:

<code-group><code-block label="Java" active>

```java
InfiniticWorker.fromFile("infinitic.yml").start()
```

</code-block><code-block label="Kotlin">

```kotlin
InfiniticWorker.fromFile("infinitic.yml").start()
```

</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for running a workflow executor:

```yml
pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev

workflows:
  - name: hello.world.workflows.HelloWorld
    class: hello.world.workflows.HelloWorldImpl
    concurrency: 5
```

## Description

Workflow executors are in charge of processing WorkflowTasks.

For each workflow name provided by the configuration, workflow executor:

- starts a Pulsar consumer with a [shared subscription](https://pulsar.apache.org/docs/en/concepts-messaging/#shared) on the workflow-specific Pulsar topic.
- starts n threads in charge of processing. This number can be adjusted through the `concurrency` settings.
- pulls messages from the workflow-specific Pulsar topic when a thread a available and send it to this thread for processing. Once completed, the Pulsar message is finally acknowledged.

## Recommandations

- Launching multiple workflow executors on the same machine is useless (increase the `concurrency` settings instead).
- Launching a workflow executor on multiple machines is useful if you need to increase the throughput or the resilience.

</alert>

When deploying a workflow executor on multiple machines, it is convenient to add a name attribute on the `infinitic.yml` configuration file.

<alert type="warning">

When providing a name in the configuration file, this name MUST be unique among your different machines.

</alert>
