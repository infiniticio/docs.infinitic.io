---
title: Service Workers
description: This documentation introduces Infinitic's service workers, designed to execute tasks. It explains how to configure and start a service worker, detailing the addition of dependencies, the instantiation process, and the configuration of services including concurrency, timeout, and retry policies. This guide is crucial for developers seeking to implement robust task processing systems with Infinitic's scalable, horizontally distributed workers.
---

## What are Service Executors?

Service Executors are Infinitic Workers configured to execute tasks, by:
 - Concurrently listening for incoming task messages from Pulsar, as defined by the concurrency settings.
 - Deserializing task arguments.
 - Instantiating the Service class and executing the requested task method with the provided arguments.
 - Serializing the return value and sending it back through Pulsar.
 - Handling timeouts, exceptions, and managing task retries.

![Service workers](/img/concept-service.png)

The code of Service Executors is provided by Infinitic. However, you need to configure an executor to tell which Services it should be responsible for and how to instantiate them.

## Creating a Service Executor

To build a Service Executor, like for all Infinitic Workers, you need first to add the `infinitic-worker` dependency into your project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.18.1"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.18.1")
    ...
}
```

{% /codes %}

A Service Executor can be set up throuh [code](#code-based-configuration) or using [YAML](#yaml-based-configuration). 

Whatever the chosen method, you'll need to:

1. Specify how to connect to the event broker. 

2. Specify the names of all Services you want the Service Executor to handle. A service name indicates which topic to listen for execution commands.

3. Provide a way to instantiate the corresponding Service classes. This can be done:

   - For YAML-based configuration, by providing the fully qualified name of the Service class (only if the Service can be instantiated with a no-argument constructor).
   - For code-based configuration, through a factory method that creates and returns an instance of the Service.

4. Provide some optional settings relative to the execution, such as:

   - the [concurrency](/docs/services/references#concurrency) to control the number of tasks executed simultaneously by this executor.
   - an optional, but recommended, [retry policy](/docs/services/references#retry-policy) to handle transient failures.
   - an optional [timeout](/docs/services/references#task-timeout) to prevent indefinite processing.


### Builder-based Configuration

In the example below, we create an Infinitic Worker containing a Service Executor for the `HotelBookingService` service, with a concurrency of 5, a timeout of 100 seconds and a retry policy of exponential backoff with a maximum of 11 retries.

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
  .setTransport(transport)
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
val transport = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080")
  .setTenant("infinitic")
  .setNamespace("dev")
  .build()

val withRetry = WithExponentialBackoffRetry(
  minimumSeconds = 1,
  maximumSeconds = 1000,
  backoffCoefficient = 2,
  randomFactor = 0.5,
  maximumRetries = 11
)

val worker = InfiniticWorker.builder()
  .setTransport(transport)
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("HotelBookingService")
      .setFactory { HotelBookingServiceImpl(/* injections here*/) }
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
The argument to the `withRetry` method should be an instance of the [`WithRetry`](/docs/services/references#using-with-retry-interface) interface.


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

This configuration contains:

- an optional worker name, this name must be unique among all our workers and clients connected to the same Pulsar namespace. It's used for logging purposes only
- the [Pulsar settings](/docs/references/pulsar), describing how to connect to your Pulsar cluster
- the description of services executor per Service Name:

    | Name                 | Type        | Description                                         | Default   |
    | -------------------- | ----------- | --------------------------------------------------- | --------- |
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
