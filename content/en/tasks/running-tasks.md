---
title: Running Tasks
description: ""
position: 2.6
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

As described [here](/references/architecture), Infinitic provides a worker implementation that can play 4 different roles, depending on its configuration:

- task engine
- **task executor**
- workflow engine
- workflow executor

Task executors are in charge of processing tasks: they listen Pulsar for instructions, process tasks, and send serialized return value back to Pulsar.

## Implementation

To start a task executor, just do:

<code-group><code-block label="Java" active>

```java
InfiniticWorker.fromFile("infinitic.yml").start()
```
</code-block><code-block label="Kotlin">

```kotlin
InfiniticWorker.fromFile("infinitic.yml").start()
```
</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for running a task executor:

```yml
pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev

tasks:
  - name: example.booking.tasks.carRental.CarRentalService
    class: example.booking.tasks.carRental.CarRentalServiceFake
    concurrency: 5
  - name: example.booking.tasks.flight.FlightBookingService
    class: example.booking.tasks.flight.FlightBookingServiceFake
    concurrency: 5
  - name: example.booking.tasks.hotel.HotelBookingService
    class: example.booking.tasks.hotel.HotelBookingServiceFake
    concurrency: 5
```

## Description

Task executors are in charge of processing tasks. 

For each task name provided by the configuration, they start a Pulsar consumer with a shared subscription on a task-specific topic. The `concurrency` settings describes for each task how many [coroutines](https://kotlinlang.org/docs/reference/coroutines-overview.html) are dedicated to the processing of this task. A message is pulled from the consumer once a coroutine is available to process it. The Pulsar message is finally ackowledged after completion (or failure) of the task. 

<alert type="info">

We do not need to launch multiple task executors on the same machine (increase the `concurrency` settings instead).

But it makes sense to launch task executors on multiple machines. 

</alert>

<alert type="warning">

When deploying task executors on multiple machines, it may be convenient to add a name attribute on the configuration file. Make sure that this name is unique among your different machines.

</alert>