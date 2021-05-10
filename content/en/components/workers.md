---
title: Workers
description: ""
position: 2.4
category: "Components"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/architecture-worker@2x.png" class="img" width="1280" height="640" alt=""/>

Infinitic provides a generic worker in charge of task or workflow execution based on its configuration.
The roles of workers are:

- to listen to Pulsar for messages
- to process task or workflow accordingly and send back the return value
- to maintain the state of task or workflow.

### Worker Instantiation

A worker can be instantiate through a configuration file (or resource by using `fromConfigResource("/infinitic.yml")`):

<code-group><code-block label="Java" active>

```java
PulsarInfiniticWorker worker = PulsarInfiniticWorker.fromConfigFile("infinitic.yml");
```

</code-block><code-block label="Kotlin">

```kotlin
val worker = PulsarInfiniticWorker.fromConfigFile("infinitic.yml")
```

</code-block></code-group>

Here is an example of a valid `infinitic.yml` file for a worker:

```yml
pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev

workflows:
  - name: example.booking.workflows.BookingWorkflow
    class: example.booking.workflows.BookingWorkflowImpl
    concurrency: 10

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

This configuration contains a worker name (optional), the Pulsar settings, and for each task or workflow:
| Name | Type | Description |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `name` | string | name of the task / workflow (its interface) |
| `class` | string | name of the class to instantiate |
| `concurrency` | integer | maximum number of messages processed in parallel |

<alert type="warning">

When providing a worker name, this name MUST be unique among our workers and clients connected to Pulsar.

</alert>

<alert type="warning">

A worker must contain the code of all `class` described in its configuration file.

</alert>

As illustrated above, a worker can handle multiple task or workflow, but we can also specialize a worker per task or per workflow. We just have to update to `infinitic.yml` file accordingly, for example:

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
```

### Worker Start

Just use the `start()`method to start listening Pulsar:

<code-group><code-block label="Java" active>

```java
worker.start();
```

</code-block><code-block label="Kotlin">

```kotlin
worker.start()
```

</code-block></code-group>

Notes:

- The worker catches any exception sent by the `class` during its execution (see [task failure](/tasks/failure)). Use a logger to see the errors.
- Do not start multiple workers with same configuration on one machine, but increase the `concurrency` settings instead.
- Starting workers on multiple machines increases throughput and resilience

  <alert type="info">

  Workers can be scaled horizontally.

  </alert>
