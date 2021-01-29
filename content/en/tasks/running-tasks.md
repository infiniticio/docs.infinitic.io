---
title: Running Tasks
description: ""
position: 2.2
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic provides a worker implementation that can play [4 different roles](/references/architecture), depending on its configuration:

- task engine
- **task executor**
- workflow engine
- workflow executor

Task executors are in charge of processing tasks: they listen Pulsar for instructions, process tasks, and send serialized return value back to Pulsar.

## Implementation

Use `io.infinitic.pulsar.InfiniticWorker` to start a task executor:

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
    shared: false
  - name: example.booking.tasks.flight.FlightBookingService
    class: example.booking.tasks.flight.FlightBookingServiceFake
    concurrency: 5
  - name: example.booking.tasks.hotel.HotelBookingService
    class: example.booking.tasks.hotel.HotelBookingServiceFake
    concurrency: 5
```

## Actions

For each entry under the `tasks` section of the configuration, a task executor will:
- start a Pulsar consumer with a [shared subscription](https://pulsar.apache.org/docs/en/concepts-messaging/#shared) on a Pulsar topic automatically created and dedicated to this task;
- start n threads in charge of processings (this number is the `concurrency` settings - 1 by default);
- pull messages from Pulsar as soon as a thread is available to process it. Once the processing completed, the Pulsar message is acknowledged, and the thread becomes available for another message.

## Recommandations

- Launching multiple task executors on the same machine is useless (increase the `concurrency` settings instead).
- Launching a task executor on multiple machines is useful if you need to increase the throughput and the resilience:

    <alert type="info">

    Task executors are stateless. They can be scaled horizontally.

    </alert>

When deploying a task executor on multiple machines, it is convenient to add a name attribute on the `infinitic.yml` configuration file. 

<alert type="warning">

When providing a name in the configuration file, this name MUST be unique among your different machines. 

</alert>