---
title: Service Deployment 
description: Learn how to deploy and configure Infinitic Services in your applications. This guide covers Service Executors, Service Tag Engines, configuration options, and best practices for deploying Services with both builder and YAML approaches. Discover essential settings for transport, storage, batching, retries and timeouts to optimize your Services deployments.
---
This guide covers three essential components for deploying Infinitic Services:


1. **[Service Executors](#service-executors)**: These are stateless components that execute tasks for a Service. They contain the implementation of your Service interface and are responsible for executing its methods (aka tasks). A Service Executor:
   - Listens for tasks from the message broker
   - Deserializes the task arguments
   - Executes the task using the Service implementation
   - Serializes the task result
   - Sends the result to the message broker
   - Handles task completion and failures

2. **[Service Tag Engines](#service-tag-engines)**: These are stateless components that manage service tags in a database. They:
   - Track relationships between a service tag and the service IDs of services that share this tag
   - Enable bulk operations on existing services based on a tag


## Service Executors

You can setup an Infinitic Worker to run a Service Executor throuh builders or using a YAML configuration. Whatever the chosen method, you'll need:

1. The **transport configuration**, describes how to connect to the event broker. 

2. The **Service Executor configuration**, describes how to instanciate Service classes for a given service name, and defines optional parameters such as the concurrency level, batching policy, retry policy, execution timeout.

Once an Infinitic Worker is created and configured to run a Service Executor, it can be started with the `start()` method.

Service Executor have the following optional configuration parameters:

- `concurrency`: the number of tasks that can be executed concurrently by the Service Executor.
- `batch`: the batching policy for receiving and sending messages from and to the message broker.
- `retry`: the retry policy to use when a task fails.
- `timeout`: the execution timeout for a task.


### Prerequisites

To build a Worker you need first to add the `infinitic-worker` dependency into your project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.16.2"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.16.2")
    ...
}
```

{% /codes %}
### Minimal Example Using Builders

{% codes %}

```java
public class App {
  public static void main(String[] args) {
    // create the transport config
    TransportConfig transportConfig = PulsarTransportConfig.builder()
      .setBrokerServiceUrl("pulsar://localhost:6650")
      .setWebServiceUrl("http://localhost:8080")
      .setTenant("infinitic")
      .setNamespace("dev")
      .build();

    // create the service executor config for service MyService
    ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
      .setServiceName("MyService")
      .setFactory(() -> new MyServiceImpl(/* injections here*/))
      .build();

    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.builder()
        .setTransport(transportConfig)
        .addServiceExecutor(serviceExecutorConfig)
        .build()
    ) { 
        worker.start();
    }
  }
}
```

```kotlin
fun main() {
  // create the transport configuration for a local Pulsar
  val transportConfig = PulsarTransportConfig.builder()
    .setBrokerServiceUrl("pulsar://localhost:6650")
    .setWebServiceUrl("http://localhost:8080")
    .setTenant("infinitic")
    .setNamespace("dev")
    .build()

  // create the service executor configuration for service MyService
  val serviceExecutorConfig = ServiceExecutorConfig.builder()
    .setServiceName("MyService")
    .setFactory { MyServiceImpl(/* injections here*/) }
    .build();

  // create and start the worker
  val worker = InfiniticWorker.builder()
    .setTransport(transportConfig)
    .addServiceExecutor(serviceExecutorConfig)
    .build()
  worker.use { it.start() }
}
```

{% /codes %}

### Minimal Example Using YAML Configuration

Here is a minimal `infinitic.yml` configuration file to create a Service Executor for a Service `MyService`. 

```yaml
# Transport configuration for a local Pulsar
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Service Executor configuration for service MyService
services:
  - name: MyService
    executor:
      class: example.MyServiceImpl
```

{% callout type="warning"  %}

Any `class` declared in this configuration file must have an empty constructor.
If your service requires dependencies, consider using builders to create instances.

Additionally, ensure that the class is public and accessible from the worker's classpath. If the class is part of a module, make sure it's properly exported.

{% /callout  %}

This Service Executor can be started with:

{% codes %}

```java
public class App {
  public static void main(String[] args) {
    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.fromYamlFile("infinitic.yml")
    ) { 
        worker.start();
    }
  }
}
```

```kotlin
fun main() {
  // create and start the worker
  val worker = InfiniticWorker.fromYamlFile("infinitic.yml")
  worker.use { it.start() }
}
```

{% /codes %}

Note: Infinitic proposes multiple ways to create a worker from a YAML configuration:

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



### Concurrency

**By default, tasks are executed sequentially, one after another, within the same Service Executor.** However, we can increase the level of parallelism with the `concurrency` parameter. 

With `concurrency = 50`, a Service Executor will execute up to 50 tasks concurrently. If 50 tasks are already running, the worker will stop consuming messages until a slot becomes available. 

{% callout  %}

This parallel execution can significantly improve throughput, but it's important to consider the resource implications and potential contention issues when setting a high concurrency value.

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory(() -> new MyServiceImpl(/* injections here*/))
  .setConcurrency(50)
  .build();
```

```kotlin
val serviceExecutorConfig = ServiceExecutorConfig.builder()
    .setServiceName("MyService")
    .setFactory { MyServiceImpl(/* injections here*/) }
    .setConcurrency(50)
    .build();
```

{% /codes %}

#### Configuration Using YAML

```yaml
executor:
  class: example.MyServiceImpl
  concurrency: 50
```

### Batching

Batching refers to the process of grouping multiple messages together into a single batch before receiving from or sending to the message broker. This technique improves efficiency and reduces latency, especially for high-throughput applications, by reducing the number of network calls required.

Batching can be configured with 2 parameters:

- `maxMessages` (int): the maximal number of messages in a batch.
- `maxSeconds` (double): the maximal duration of a batch in seconds.

{% callout  %}

To be efficient, `maxMessages` should be set typically set to the same number than the `concurrency` parameter and `maxSeconds` should be set small enough to not add delay to the tasks processing. 

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WithRetry withRetry = ...

ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory(() -> new MyServiceImpl(/* injections here*/))
  .setBatch(1000, 0.1)
  .build();
```

```kotlin
val serviceExecutorConfig = ServiceExecutorConfig.builder()
    .setServiceName("MyService")
    .setFactory { MyServiceImpl(/* injections here*/) }
    .setBatch(1000, 0.1)
    .build();
```

{% /codes %}

#### Configuration Using YAML

```yaml
executor:
  class: example.MyServiceImpl
  batch: 
    maxMessages: 1000
    maxSeconds: 0.1
```

### Retry Policy

**By default, failed tasks are not retried.** But Infinitic provides a robust retry mechanism for tasks that fail during execution. This mechanism can handle transient errors and improves the reliability of your services. 

#### Configuration Using Builders

{% codes %}

```java
WithRetry withRetry = ...

ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory(() -> new MyServiceImpl(/* injections here*/))
  .withRetry(withRetry)
  .build();
```

```kotlin
val withRetry: WithRetry = ...

val serviceExecutorConfig = ServiceExecutorConfig.builder()
    .setServiceName("MyService")
    .setFactory { MyServiceImpl(/* injections here*/) }
    .withRetry(withRetry)
    .build();
```

{% /codes %}

Here `withRetry` is an instance of `WithRetry` interface. Infinitic has a built-in `WithExponentialBackoffRetry` class that implements the `WithRetry` interface as described below.

#### Configuration Using YAML

```yaml
executor:
  class: example.MyServiceImpl
  retry:
    minimumSeconds: 1  
    maximumSeconds: 1000 
    backoffCoefficient: 2  
    randomFactor: 0.5   
    maximumRetries: 11
    ignoredExceptions:   
      - # fully qualified name of an exception to ignore
      - # fully qualified name of an second exception to ignore
```

This configuration creates a retry policy using a truncated randomized exponential backoff retry strategy. This retry strategy is designed to efficiently handle transient errors while avoiding overwhelming the system. Here's a breakdown of how it works:

1. Exponential backoff: The delay between retries increases exponentially with each attempt.
2. Randomization: A random factor is applied to prevent synchronized retries from parallel tasks.
3. Truncation: The delay is capped at a maximum value to avoid excessively long waits.

If an exception occurs during task execution that is not listed in `ignoredExceptions`, and the `maximumRetries` limit has not been reached, the task will be retried after a calculated delay. The delay (in seconds) is determined by the following formula:

```
min(
  maximumSeconds, 
  minimumSeconds * (backoffCoefficient ** attempt)) * 
    (1 + randomFactor * (2 * random() - 1)
)
```

where `random()` is a random value between `0` and `1`.

#### Precedence

There are multiple ways to define a retry policy for a Service Executor. The retry policy will be determined based on the first configuration found in the following order:

1) Service Executor's configuration
2) `@Retry` method annotation
3) `@Retry` class annotation
4) `WithRetry` interface
5) Defaulted to no retry
   
### Execution Timeout

**By default, tasks have no execution timeout defined.** This timeout refers to a maximum duration allowed for a task to complete an execution attempt. If an execution attempt exceeds this time limit, the Service Executor will automatically throw a `TimeoutException`.

When timed-out, the task will be automatically retried - or not - based on its [retry policy](#retry-policy).

#### Configuration Using Builders

{% codes %}

```java
WithRetry withRetry = ...

ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory(() -> new MyServiceImpl(/* injections here*/))
  .setTimeoutSeconds(100.0)
  .build();
```

```kotlin
val serviceExecutorConfig = ServiceExecutorConfig.builder()
    .setServiceName("MyService")
    .setFactory { MyServiceImpl(/* injections here*/) }
    .setTimeoutSeconds(100.0)
    .build();
```

{% /codes %}

#### Configuration Using YAML

```yaml
executor:
  class: example.MyServiceImpl
  timeoutSeconds: 100.0
```
#### Precedence

There are multiple ways to define an execution timeout for a Task. The timeout policy used will be the first found in this order:

1) Service Executor's configuration
2) `@Timeout` method annotation
3) `@Timeout` class annotation
4) `WithTimeout` interface
5) Defaulted to no timeout

{% callout type="warning"  %}

When defined in the interface, a timeout has a different meaning. It represents the maximal duration of the task dispatched by workflows (including retries and transportation) before a timeout is thrown at the workflow level.

{% /callout  %}


## Service Tag Engines

{% callout %}
*Service Tag Engines* are stateless components that are needed if you want to command operations on tasks based on their tags. They maintain the relationship between task IDs and task tags within a [database](/docs/components/infrastructure#databases).
{% /callout %}

You can easily setup an Infinitic Worker to run a Service Tag Engine throuh builders or using a YAML configuration. Whatever the chosen method, you'll need:

1. The **transport configuration**, describes how to connect to the event broker.

2. The **Service Tag Engine configuration**, describes where to store the relationship between task IDs and task tags, and defines optional parameters.

Once an Infinitic Worker is created and configured to run a Service Tag Engine, it can be started with the `start()` method.

Service Tag Engine have the following configuration parameters:

- storage: the storage configuration to use to store the relationship between task IDs and task tags.
- batch: the batching policy when receiving and sending messages from and to the message broker.

### Minimal Example Using Builders

Here is a minimal configuration to create and start a Service Tag Engine associated to a Service `MyService`. 

{% codes %}

```java
public class App {
  public static void main(String[] args) {
    // Transport configuration for a local Pulsar
    TransportConfig transportConfig = PulsarTransportConfig.builder()
      .setBrokerServiceUrl("pulsar://localhost:6650")
      .setWebServiceUrl("http://localhost:8080") 
      .setTenant("infinitic")
      .setNamespace("dev")
      .build();

    // Storage configuration
    StorageConfig storageConfig = PostgresStorageConfig.builder()
      .setHost("localhost")
      .setPort(5432)
      .setUsername("postgres")
      .setPassword("********")
      .build();

    // Service Tag Engine configuration
    ServiceTagEngineConfig serviceTagEngineConfig = ServiceTagEngineConfig.builder()
      .setServiceName("MyService")
      .setStorage(storageConfig)
      .build();

    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.builder()
        .setTransport(transportConfig)
        .addServiceTagEngine(serviceTagEngineConfig)
        .build();
    ) { 
        worker.start();
    }
  }
}
```

```kotlin
fun main() {
  // Transport configuration for a local Pulsar
  val transportConfig = PulsarTransportConfig.builder()
    .setBrokerServiceUrl("pulsar://localhost:6650")
    .setWebServiceUrl("http://localhost:8080")
    .setTenant("infinitic")
    .setNamespace("dev")
    .build()

  // Storage configuration for a local Postgres
  val storageConfig = PostgresStorageConfig.builder()
    .setHost("localhost")
    .setPort(5432)
    .setUsername("postgres")
    .setPassword("********")
    .build()
  
  // Service Tag Engine configuration
  val serviceTagEngineConfig = ServiceTagEngineConfig.builder()
    .setServiceName("MyService")
    .setStorage(storageConfig)
    .build()

  // create and start the worker
  val worker = InfiniticWorker.builder()
    .setTransport(transportConfig)
    .addServiceTagEngine(serviceTagEngineConfig)
    .build()
  worker.use { it.start() }
}
``` 

{% /codes %}  

### Minimal Example Using YAML


Here is a minimal `infinitic.yml` configuration file to create a Service Tag Engine associated to a Service `MyService`. 

```yaml
# Transport configuration for a local Pulsar
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Service Tag Engine Configuration for a local Redis
services:
  - name: MyService
    tagEngine:
      storage:
        postgres:
          host: localhost
          port: 5432
          username: postgres
          password: ********
```

The Infinitic Worker embedding this Service Tag Engine can be created and startedwith:

{% codes %}

```java
public class App {
  public static void main(String[] args) {
    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.fromYamlFile("infinitic.yml")
    ) { 
      worker.start();
    }
  }
}
```

```kotlin
fun main() {
  // create and start the worker
  val worker = InfiniticWorker.fromYamlFile("infinitic.yml") 
  worker.use { it.start() }
}
```

{% /codes %}

### Storage

Configuring a storage is mandatory to run a Service Tag Engine, to store the relationship between task IDs and task tags.
See [Storage](/docs/references/storage) for more details.


### Batching (beta)

Batching refers to the process of grouping multiple messages together into a single batch before receiving from or sending to the message broker. This technique improves efficiency and reduces latency, especially for high-throughput applications, by reducing the number of network calls required.

Batching can be configured with 2 parameters:

- `maxMessages` (int): the maximal number of messages in a batch.
- `maxSeconds` (double): the maximal duration of a batch in seconds.

#### Configuration Using Builders

{% codes %}

```java
ServiceTagEngineConfig serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setBatch(1000, 0.1)
  .build();
```

```kotlin
val serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setBatch(1000, 0.1)
  .build()
```

{% /codes %}

#### Configuration Using YAML

```yaml
tagEngine:
  batch: 
    maxMessages: 1000
    maxSeconds: 0.1
  storage:
    # storage configuration
```


## Mixing Components

It's possible to mix different components from different services or workflows in a single Infinitic Worker:

{% callout %}

This capability is useful during development to have a single worker running all components. But in production, we recommend having one worker per component. 

{% /callout %}

#### Example Using Builders

{% codes %}

```java
TransportConfig transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080") 
  .setTenant("infinitic")
  .setNamespace("dev")
  .build();

StorageConfig storageConfig = PostgresStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .build();

ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory(() -> new MyServiceImpl(/* injections here*/))
  .setConcurrency(10)
  .withRetry(withRetry)
  .setTimeoutSeconds(100.0)
  .build();

ServiceTagEngineConfig serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceExecutor(serviceExecutorConfig)
  .addServiceTagEngine(serviceTagEngineConfig)
  .build();
```

```kotlin
val transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080")
  .setTenant("infinitic")
  .setNamespace("dev")
  .build()

val storageConfig = PostgresStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .build()

val serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory { MyServiceImpl(/* injections here*/) }
  .setConcurrency(10)
  .withRetry(withRetry)
  .setTimeoutSeconds(100.0)
  .build()
  
val serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build()

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceExecutor(serviceExecutorConfig)
  .addServiceTagEngine(serviceTagEngineConfig)
  .build()
``` 

{% /codes %}  

#### Example Using YAML

```yaml
# Transport settings
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# We can define default Storage settings here to avoid repeating it
storage:
  redis:
    host: localhost
    port: 6379
    username: redis
    password: myRedisPassword

# Configuration of all components for Services MyService
services:
  - name: MyService
    executor:
      class: example.MyServiceImpl
      concurrency: 100
      timeoutSeconds: 100
      retry:
        minimumSeconds: 1  
        maximumSeconds: 1000
        backoffCoefficient: 2  
        randomFactor: 0.5   
        maximumRetries: 11
    tagEngine:
      batch: 
        maxMessages: 1000
        maxSeconds: 0.1
```
