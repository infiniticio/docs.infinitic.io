---
title: Workflow Engine
description: ""
position: 7.1
category: "Workflow Engine"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/overview-workflow-engine@2x.png" class="img" width="1280" height="640" alt=""/>

Workflow engines are stateful workers. their role are:

- to maintain the state of each workflow instance, up to its completion or cancellation,
- to manage retries and timeouts.

## Create a workflow engine

Use `io.infinitic.pulsar.InfiniticWorker` to start a task executor:

<code-group><code-block label="Java" active>

```java
InfiniticWorker workflowEngine = InfiniticWorker.fromConfigFile("infinitic.yml");
```

</code-block><code-block label="Kotlin">

```kotlin
val workflowEngine = InfiniticWorker.fromConfigFile("infinitic.yml")
```

</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for workflow engines:

```yml
name: devWorkflowEngine

pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev

redis:
  host: localhost
  port: 6379
  user:
  password:
  database: 0

workflowEngine:
  consumers: 10
  stateStorage: redis
```

The configuration file is straight-forward. The `consumers` number describes how many Pulsar consumers will be created. Each of these consumers will have a dedicated thread to handle receiving messages. They are using a [key-shared](https://pulsar.apache.org/docs/en/concepts-messaging/#key_shared) subscription based on the workflow's id. This key-shared subscription guarantees that the state of a given workflow is always managed by the same thread, avoiding potential race conditions and allowing in-memory cache management.

<alert type="warning">

When providing a name in the configuration file, this name MUST be unique among your different machines.

</alert>

## Start a workflow engine

<code-group><code-block label="Java" active>

```java
workflowEngine.start();
```

</code-block><code-block label="Kotlin">

```kotlin
workflowEngine.start()
```

</code-block></code-group>

Notes:

- Do not start multiple workflow engines on the same machine, but increase the consumers settings instead.
- Starting a workflow engine on multiple machines increases throughput and resilience

## References: topics map

<img src="/workflow-engine@2x.png" class="img" width="1280" height="640" alt=""/>
