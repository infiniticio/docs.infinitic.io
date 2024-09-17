---
title: Service Workers
description: This documentation introduces Infinitic's service workers, designed to execute tasks. It explains how to configure and start a service worker, detailing the addition of dependencies, the instantiation process, and the configuration of services including concurrency, timeout, and retry policies. This guide is crucial for developers seeking to implement robust task processing systems with Infinitic's scalable, horizontally distributed workers.
---

## What are Service Executors?

Service Executors are Infinitic Workers configured to execute tasks, by:
 - [Concurrently](#concurrency-level) listening for incoming task messages from Pulsar, as defined by the concurrency settings.
 - [Deserializing](/docs/references/serialization) task arguments.
 - Instantiating the Service class and executing the requested task method with the provided arguments.
 - [Serializing](/docs/references/serialization) the return value and sending it back through Pulsar.
 - Handling [timeouts](#timeout), [exceptions](#retry-policy), and managing [task retries](#retry-policy).

![Service workers](/img/concept-service.png)

The code of Service Executors is provided by Infinitic. However, you need to configure these executors with the specific Service classes that you want to execute.
This configuration tells the executor which Services it should be responsible for and how to instantiate them.

To build a Service Executor, like for all Infinitic Workers, you need first to add the `infinitic-worker` dependency into your project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.16.0"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.16.0")
    ...
}
```

{% /codes %}

## Setup

A Service Executor can be set up throuh [code](#code-based-configuration) or using [YAML](#yaml-based-configuration). 
With both methods, you'll need to:

1. Specify the [Service name](#service-and-task-name) that the executor should handle.

2. Provide a way to instantiate these Service classes. This can be done:

   - By providing the fully qualified name of the Service class, if the Service can be instantiated with a no-argument constructor.
   - Through a factory method that creates and returns an instance of the Service.


3. Define optional settings:

   - Adjust [concurrency](#concurrency) levels to control the number of tasks executed simultaneously by a single executor.
   - Set [timeout](#timeout) policies to prevent indefinite processing.
   - Configure [retry](#retries) policies to handle transient failures and improve task resilience.


Before building a Service Executor, you need to add the `infinitic-worker` dependency into your project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.16.0"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.16.0")
    ...
}
```

{% /codes %}

### Service and Task Name 

The name of the Service is used to identify the Pulsar topic that the Service Executor will listen to.
The name of the task is used to identify the method that the Service Executor will execute.

By default, **the Service name is the fully qualified name of the Service interface**, and **the task name is the name of the method**.

The name of the Service, as well as the name of the tasks, must not change after the Service Executors have been deployed.

If you want to decouple this name from the underlying implementation, 
for example if you want to rename the class or method,
you can use an `@Name` annotation. 

{% callout type="warning" %}

The `@Name` annotation must be used on the Service interface (not on the Service implementation).

{% /callout  %}

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyService")
public interface MyNewService {

    @Name(name = "firstTask")
    FirstTaskOutput newFirstTask(FirstTaskInput input);

    @Name(name = "secondTask")
    SecondTaskOutput newSecondTask(SecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyService")
interface MyNewService {
    
    @Name("firstTask")
    fun newFirstTask(input: FirstTaskInput): FirstTaskOutput

    @Name("secondTask")
    fun newSecondTask(input: SecondTaskInput): SecondTaskOutput
}
```

{% /codes %}


### Concurrency Level

**By default, tasks are executed sequentially, one after another, within the same Service Executor.** However, we can increase the level of parallelism with a `concurrency` parameter (see below). For example, with `concurrency = 50`, a Service Executor will execute up to 50 tasks concurrently. If more than 50 tasks are running, the worker will stop consuming messages until a slot becomes available. 

{% callout  %}

This parallel execution can significantly improve throughput, but it's important to consider the resource implications and potential contention issues when setting a high concurrency value.

{% /callout  %}

### Timeout Policy

**By default, tasks have no timeout defined.** A timeout refers to a maximum duration allowed for a task to complete its execution. If a task exceeds this specified time limit, a `io.infinitic.exceptions.tasks.TimeoutException` exception will be thrown (but the task execution will NOT be forcibly terminated). When timed-out, the task will be automatically retried - or not - based on its retry policy.

{% callout  %}

This timeout exception will not be triggered if the worker terminates unexpectedly (e.g., due to a system crash or forced shutdown). This limitation is why we generally recommend implementing timeout policies at the workflow level instead of relying solely on task-level timeouts.

When setting a timeout at the workflow level, it's important to account for the cumulative time of all potential retry attempts.

{% /callout  %}

### Retry Policy

**By default, failed tasks are not retried.** But Infinitic provides a robust retry mechanism for tasks that fail during execution. This mechanism handles transient errors and improves the overall reliability of your services. 

{% callout  %}

The workflow that dispatched a task remains unaware of any retry attempts occurring for that task. From the workflow's perspective, it only receives the final outcome: either the task has succeeded after potentially multiple retry attempts, or it has ultimately failed once all retry attempts have been exhausted. This abstraction allows the workflow to focus on the overall task completion status rather than the intricacies of the retry mechanism.

{% /callout  %}

### Code-based Configuration

A ServiceExecutor can be created with builders. 
In the example below, we create an Infinitic Worker containing 3 Service Executors:
-  for the `CarRentalService` service, with a concurrency of 5, no timeout and no retry policy.
-  for the `FlightBookingService` service, with a concurrency of 5, no timeout and no retry policy.
-  for the `HotelBookingService` service, with a concurrency of 5, a timeout of 100 seconds and a retry policy of exponential backoff with a maximum of 11 retries.

{% codes %}

```java
TransportConfigBuilder transport = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080") 
  .setTenant("infinitic")
  .setNamespace("dev");

WithRetryBuilder withRetry = WithExponentialBackoffRetry.builder()
  .setMinimumSeconds(1)
  .setMaximumSeconds(1000)
  .setBackoffCoefficient(2)
  .setRandomFactor(0.5)
  .setMaximumRetries(11);

InfiniticWorker worker = InfiniticWorker.builder()
  .setName("gilles_worker")
  .setTransport(transport)
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("CarRentalService")
      .setFactory(() -> new CarRentalServiceImpl(/* injections here*/))
      .setConcurrency(5)
  )
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("FlightBookingService")
      .setFactory(() -> new FlightBookingServiceImpl(/* injections here*/))
      .setConcurrency(5)
  )
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("HotelBookingService")
      .setFactory(() -> new HotelBookingServiceImpl(/* injections here*/))
      .setTimeoutSeconds(100.0)
      .withRetry(withRetry)
  )
  .build();
```

```kotlin
val transport = PulsarTransportConfig(
  brokerServiceUrl = "pulsar://localhost:6650",
  webServiceUrl = "http://localhost:8080",
  tenant = "infinitic",
  namespace = "dev"
)

val withRetry = WithExponentialBackoffRetry(
  minimumSeconds = 1,
  maximumSeconds = 1000,
  backoffCoefficient = 2,
  randomFactor = 0.5,
  maximumRetries = 11
)

val worker = InfiniticWorker.builder()
  .setName("gilles_worker")  
  .setTransport(transport)
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("CarRentalService")
      .setFactory { CarRentalServiceImpl(/* injections here*/) }
      .setConcurrency(5)
  )
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("FlightBookingService")
      .setFactory { FlightBookingServiceImpl(/* injections here*/) }
      .setConcurrency(5)
  )
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("HotelBookingService")
      .setFactory { ServiceExample(/* injections here*/) }
      .setConcurrency(5)
      .setTimeoutSeconds(100.)
      .withRetry(withRetry)
  )
  .build()
``` 

{% /codes %}

{% callout %}

While it's possible to configure multiple Service Executors within a single Worker, we generally recommend 
having only one Service Executor per Worker in production. This improves resource isolation, and simplifies monitoring and debugging.

{% /callout  %}
The argument to the `withRetry` should be an instance of the `io.infinitic.tasks.WithRetry` interface requiring a method:
{% codes %}

```java
Double getSecondsBeforeRetry(Int retry, Exception e);
```

```kotlin
fun getSecondsBeforeRetry(retry: Int, e: Exception): Double?
```
{% /codes %}



### YAML-based Configuration

A ServiceExecutor can be created directly from a YAML string, a YAML file or a YAML resource:

{% codes %}

```java
// From a YAML string
InfiniticWorker worker = InfiniticWorker.fromYamlString("yaml content here");
// From a YAML file
InfiniticWorker worker = InfiniticWorker.fromYamlFile("infinitic.yml");
// From a YAML resource
InfiniticWorker worker = InfiniticWorker.fromYamlResource("/path/to/infinitic.yml");
```

```kotlin
// From a YAML string
val worker = InfiniticWorker.fromYamlString("yaml content here")
// From a YAML file
val worker = InfiniticWorker.fromYamlFile("infinitic.yml")
// From a YAML resource
val worker = InfiniticWorker.fromYamlResource("/path/to/infinitic.yml")
```

{% /codes %}


Here is an example of a valid yaml configuration:

```yaml
# (Optional) Worker name
name: gilles_worker

# Transport settings
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Configuration of Services executors
services:
  - name: CarRentalService
    executor:
      class: example.booking.services.carRental.CarRentalServiceImpl
      concurrency: 5
  - name: FlightBookingService
    executor:
      class: example.booking.services.flight.FlightBookingServiceImpl
      concurrency: 5
  - name: HotelBookingService
    executor:
      class: example.booking.services.hotel.HotelBookingServiceImpl
      timeoutSeconds: 100
      retry:
        minimumSeconds: 1  
        maximumSeconds: 1000   # default = 1000 * minimumSeconds
        backoffCoefficient: 2  
        randomFactor: 0.5   
        maximumRetries: 11
```

This configuration contains

- an optional worker name, this name must be unique among all our workers and clients connected to the same Pulsar namespace. It's used for logging purposes only
- the [Pulsar settings](/docs/references/pulsar), describing how to connect to your Pulsar cluster
- the description of services executor per Service Name:

    | Name                 | Type        | Description                                         | Default   |
    | -------------------- | ----------- | --------------------------------------------------- | --------- |
    | `name`               | string      | Service name    |           |
    | `class`              | string      | Class of the Service                |           |
    | `concurrency`        | integer     | Number of tasks processed in parallel                | 1         |
    | `timeoutSeconds`     | double      | Maximum duration of a task execution before throwing a TimeoutException | none      |
    | `retry`              | RetryPolicy | Retry policy for the tasks of this service          | none      |


{% callout type="warning"  %}

Any `class` declared in this configuration file must have an empty constructor (to be instantiable by workers).
If your service requires dependencies, consider using a [factory](#code-based-configuration) to create instances.

Additionally, ensure that the class is public and accessible from the worker's classpath. If the class is part of a module, make sure it's properly exported.

{% /callout  %}

The `retry` parameter allows you to define a truncated randomized exponential backoff retry strategy, 
which is designed to efficiently handle transient errors while avoiding overwhelming the system. 
Here's a breakdown of how it works:

1. Exponential backoff: The delay between retries increases exponentially with each attempt.
2. Randomization: A random factor is applied to prevent synchronized retries from parallel tasks.
3. Truncation: The delay is capped at a maximum value to avoid excessively long waits.

It's also possible to ignore some exceptions during retries:

```yaml
retry:
  ...
  ignoredExceptions:   
    - # fully qualified name of an exception to ignore
    - # fully qualified name of an second exception to ignore
    - # fully qualified name of an third exception to ignore
```

If an exception occurs during task execution that is not listed in `ignoredExceptions`, and the `maximumRetries` limit has not been reached, the task will be retried after a calculated delay. The delay (in seconds) is determined by the following formula:

```
min(
  maximumSeconds, 
  minimumSeconds * (backoffCoefficient ** attempt)) * 
    (1 + randomFactor * (2 * random() - 1)
)
```

where `random()` is a random value between `0` and `1`.


## Starting a Service Executor

Once an Infinitic Worker is created, it can be started with the `start()` method.

{% codes %}

```java
import io.infinitic.workers.InfiniticWorker;

public class App {
  public static void main(String[] args) {
    // create the worker and start it
    try(InfiniticWorker worker = ...) { 
        worker.start();
    }
  }
}
```

```kotlin
import io.infinitic.workers.InfiniticWorker

    // create the worker config
    val worker = ...
    // start it
    worker.use { it.start() }
}
```

{% /codes %}

The embedded Service Executors will start processing messages when the worker starts.

{% callout type="note"  %}

Service Executors are stateless and designed for horizontal scalability. To increase the overall throughput of your application and improve its fault tolerance, you can simply deploy numerous instances. Each additional Executor contributes to the system's ability to handle more tasks concurrently, while also providing redundancy in case of individual failure. 

{% /callout  %}