---
title: Task Executor
description: ""
position: 3.1
category: "Task Executor"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/overview-task-executor@2x.png" class="img" width="1280" height="640" alt=""/>

A task executor is in charge of processing tasks: 
- it listens to Pulsar for messages from the task engine,
- when receiving a message, it processes the task according to its parameters, 
- and sends serialized return value back to a task engine through Pulsar.

## Create a task executor

Use `io.infinitic.pulsar.InfiniticWorker` to start a task executor:

<code-group><code-block label="Java" active>

```java
InfiniticWorker taskExecutor = InfiniticWorker.fromConfigFile("infinitic.yml");
```
</code-block><code-block label="Kotlin">

```kotlin
val taskExecutor = InfiniticWorker.fromConfigFile("infinitic.yml")
```
</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for a task executor:

```yml
name: devTaskExecutor

pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev

tasks:
  - name: example.booking.tasks.carRental.CarRentalService
    class: example.booking.tasks.carRental.CarRentalServiceFake
    concurrency: 5
    shared: false
  - name: example.booking.tasks.flight.FlightBookingService
    class: example.booking.tasks.flight.FlightBookingServiceFake
    concurrency: 5
  - name: example.booking.tasks.hotel.HotelBookingService
    class: example.booking.tasks.hotel.HotelBookingServiceFake
    concurrency: 5
```
This configuration contains a worker name (optional), the Pulsar settings, and for each task:
| Name                       | Type      | Description                                                                              |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `name  `                   | string    |  the name of the task (its interface)  |
| `class`                    | string    |  the name of the class to instantiate |
| `concurrency`              | integer   | the number of threads available to process this task   |
| `shared`                   | boolean   | (default true) if false, a new instance of `class` is created for each task execution |

<alert type="warning">

When providing a worker name, this name MUST be unique among our workers and clients connected to Pulsar.

</alert>

## Start a task executor

<code-group><code-block label="Java" active>

```java
taskExecutor.start();
```
</code-block><code-block label="Kotlin">

```kotlin
taskExecutor.start()
```
</code-block></code-group>

For each entry under the `tasks` section of the configuration, a task executor will:

- start a Pulsar consumer with a [shared subscription](https://pulsar.apache.org/docs/en/concepts-messaging/#shared) on a Pulsar topic (automatically created and dedicated to this task);
- start n (`concurrency` settings) threads in charge of executing this task;
- pull messages from Pulsar as soon as a thread is available to process it. Then this thread deserializes parameters from the message, and run the requested method on a `class` instance. Once completed, the Pulsar message is acknowledged, and the thread becomes available for another message.

<alert type="warning">

A task executor must contain the implementation of all `class` described in its configuration file.

</alert>

Notes:

- The task executor catches any exception sent by the `class` during its execution (see [task failure](/task-executor/task-failures)).
- Do not start multiple task executors on the same machine, but increase the `concurrency` settings instead.
- Starting task executor on multiple machines increases throughput and resilience:

  <alert type="info">

  Task executors are stateless. We can scale them horizontally.

  </alert>


