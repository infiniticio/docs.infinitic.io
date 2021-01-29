---
title: Running Task Engine
description: ""
position: 4.2
category: "Task Engine"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic provides a worker that can have [4 different roles](/references/architecture), depending on its configuration:

- **task engine**
- task executor
- workflow engine
- workflow executor

## Implementation

Use `io.infinitic.pulsar.InfiniticWorker` to start a task engine:

<code-group><code-block label="Java" active>

```java
InfiniticWorker.fromFile("infinitic.yml").start()
```
</code-block><code-block label="Kotlin">

```kotlin
InfiniticWorker.fromFile("infinitic.yml").start()
```
</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for running a task engine:

```yml
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

taskEngine:
  consumers: 10
  stateStorage: redis
```

The configuration file is straight-forward. The `consumers` number describes how many Pulsar consumers will be created. Each of these consumers will have a dedicated thread to handle receiving messages. They are using a [key-shared](https://pulsar.apache.org/docs/en/concepts-messaging/#key_shared) subscription based on the task's id as key. This key-shared subscription guarantees that the state of a given task is always managed by the same thread, avoiding potential race conditions and allowing in-memory caching.

## Recommandations

- Launching multiple task engines on the same machine is useless (increase the `consumers` settings instead).
- Launching a task engine on multiple machines is useful if you need to increase the throughput and the resilience

When deploying a task engine on multiple machines, it is convenient to add a name attribute on the `infinitic.yml` configuration file. 

<alert type="warning">

When providing a name in the configuration file, this name MUST be unique among your different machines. 

</alert>