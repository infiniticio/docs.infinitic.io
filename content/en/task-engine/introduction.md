---
title: Task Engine
description: ""
position: 5.1
category: "Task Engine"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/overview-task-engine@2x.png" class="img" width="1280" height="640" alt=""/>

Task engines'role are:
- to maintain the state of each task request, up to completion or cancellation,
- to manage retries and timeouts.

## Create a task engine

Use `io.infinitic.pulsar.InfiniticWorker` to start a task engine:

<code-group><code-block label="Java" active>

```java
InfiniticWorker taskEngine = InfiniticWorker.fromConfigFile("infinitic.yml");
```

</code-block><code-block label="Kotlin">

```kotlin
val taskEngine = InfiniticWorker.fromConfigFile("infinitic.yml")
```

</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for running a task engine:

```yml
name: devTaskEngine

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


<alert type="warning">

When providing a worker name, this name MUST be unique among our workers and clients connected to Pulsar.

</alert>

## Start a task engine

<code-group><code-block label="Java" active>

```java
taskEngine.start();
```
</code-block><code-block label="Kotlin">

```kotlin
taskEngine.start()
```
</code-block></code-group>

Notes:
- Do not start multiple task engines on the same machine, but increase the `consumers` settings instead.
- Starting a task engine on multiple machines increases throughput and resilience

## References: topics map

<img src="/task-engine@2x.png" class="img" width="1280" height="640" alt=""/>

