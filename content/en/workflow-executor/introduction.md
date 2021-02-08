---
title: Workflow Executor
description: ""
position: 4.1
category: "Workflow Executor"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/overview-workflow-executor@2x.png" class="img" width="1280" height="640" alt=""/>

Workflow executors are stateless workers. Their role is to process [workflowTasks](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) (special tasks using our workflows to decide what should be done next, based on current workflow history):

- it listens to Pulsar for messages from the task engine,
- when receiving a message, it processes the workflowTask according to its parameters,
- and sends serialized return value back to a task engine through Pulsar.


## Create a workflow executor

Use `io.infinitic.pulsar.InfiniticWorker` to start a workflow executor:

<code-group><code-block label="Java" active>

```java
InfiniticWorker workflowExecutor = InfiniticWorker.fromConfigFile("infinitic.yml");
```

</code-block><code-block label="Kotlin">

```kotlin
val workflowExecutor = InfiniticWorker.fromConfigFile("infinitic.yml")
```

</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for a workflow executor:

```yml
name: devWorkflowEngine

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

This configuration contains a worker name (optional), the Pulsar settings, and for each workflow:
| Name                       | Type      | Description                                                                              |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `name  `                   | string    |  the name of the workflow (its interface)  |
| `class`                    | string    |  the name of the class to instantiate |
| `concurrency`              | integer   | the number of threads available to process this workflowTask   |

<alert type="warning">

When providing a worker name, this name MUST be unique among our workers and clients connected to Pulsar.

</alert>

## Start a workflow executor

<code-group><code-block label="Java" active>

```java
taskExecutor.start();
```
</code-block><code-block label="Kotlin">

```kotlin
workflowExecutor.start()
```
</code-block></code-group>

For each entry under the `workflows` section of the configuration, a workflow executor will:

- start a Pulsar consumer with a [shared subscription](https://pulsar.apache.org/docs/en/concepts-messaging/#shared) on a Pulsar topic (automatically created and dedicated to this task);
- start n (`concurrency` settings) threads in charge of executing this workflow;
- pull messages from Pulsar as soon as a thread is available to process it. Then this thread deserializes parameters from the message, and run the workflowTask on a `class` instance. Once completed, the Pulsar message is acknowledged, and the thread becomes available for another message.


Notes:
- Do not start multiple workflow executors on the same machine, but increase the `concurrency` settings instead.
- Starting workflow executor on multiple machines increases throughput and resilience. 




