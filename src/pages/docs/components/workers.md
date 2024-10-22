---
title: Infinitic Workers
description: Explore Infinitic Workers, the core components for executing tasks and workflows in distributed systems. Learn how to create, configure, and deploy Workers efficiently, enabling scalable and resilient task processing in your Infinitic-powered applications. Discover the flexibility of code-based and YAML-based configurations for optimal performance and maintainability.
---

## Creating a Worker

To build a Worker you need first to add the `infinitic-worker` dependency into your project:

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

An Infinitic Worker can be set up throuh [builders](#builder-based-configuration) or using [YAML](#yaml-based-configuration). 

Whatever the chosen method, you'll need to:

1. Specify how to connect to the event broker. 

2. (Optionally) Specify how to connect to the database.

3. Provide the configuration for the components you want to use.

## Builder-based Configuration

An Infinitic Worker can be created using the builder pattern:

{% codes %}

```java
InfiniticWorker worker = InfiniticWorker.builder()
  ... // configuration here
  .build();
```

```kotlin
val worker = InfiniticWorker.builder()
  ... // configuration here
  .build()
``` 

{% /codes %}

It can be configured by adding the different components you want to use.

### Transport

A worker requires a transport configuration that specifies the event broker to use and the connection details. This configuration is essential for the worker to communicate with the message-driven infrastructure.

Infinitic currently supports:
- Pulsar
- An in-memory implementation for testing purposes

#### Pulsar

Here is the minimal configuration to create a worker connecting to a Pulsar cluster:

{% codes %}

```java
TransportConfig transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080") 
  .setTenant("infinitic")
  .setNamespace("dev")
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  ... // other components configuration here
  .build();
```

```kotlin
val transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080")
  .setTenant("infinitic")
  .setNamespace("dev")
  .build()

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  ... // other components configuration here
  .build()
``` 

{% /codes %}

Look at the builders' methods for more options.

#### In Memory

For testing purposes, you can use an in-memory transport:

{% codes %}

```java
TransportConfigBuilder transportConfig = new InMemoryTransportConfig();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  ... // other components configuration here
  .build();
```

```kotlin
val transportConfig = InMemoryTransportConfig()

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  ... // other components configuration here
  .build()
``` 

{% /codes %}

{% callout type="warning" %}

This transport should only be used for testing purposes, as it does not persist any messages. 
It should be used with *one worker instance only* (embedding all Services and Workflows components), and with the client `worker.client`.

{% /callout %}

### Databases

Here are the different minimal configurations for the databases. Look at the builders' methods for more details.

Storage is used by the following components: [Service Tag Engines](#service-tag-engine), 
[Workflow State Engines](#workflow-state-engine), and [Workflow Tag Engines](#workflow-tag-engine).

#### Redis

{% codes %}

```java
StorageConfig storageConfig = RedisStorageConfig.builder()
  .setHost("localhost")
  .setUsername("redis")
  .setPassword("********")
  .setPort(6379)
  .build();
```

```kotlin
val storageConfig = RedisStorageConfig.builder()
  .setHost("localhost")
  .setPort(6379)
  .setUsername("redis")
  .setPassword("********")
  .build();
``` 

{% /codes %}

#### Postgres

{% codes %}

```java
StorageConfig storageConfig = PostgresStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .build();
```

```kotlin
val storageConfig = PostgresStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .build()
``` 

{% /codes %}

#### MySQL

{% codes %}

```java
StorageConfig storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(3306)
  .setUsername("root")
  .setPassword("********")
  .build();
```

```kotlin
val storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(3306)
  .setUsername("root")
  .setPassword("********")
  .build();
``` 

{% /codes %}

#### In Memory

{% codes %}

```java
StorageConfig storageConfig = InMemoryConfig();
```

```kotlin
val storageConfig = InMemoryConfig();
``` 

{% /codes %}

{% callout type="warning" %}

This storage should only be used for testing purposes, as it does not persist any data.

{% /callout %}

### Service Executor 

Here is the configuration to create a Service Executor associated to a Service named `MyService`. 

{% codes %}

```java
WithRetry withRetry = ... // instance of WithRetry

ServiceExecutorConfig serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory(() -> new MyServiceImpl(/* injections here*/))
  .setConcurrency(10)
  .withRetry(withRetry)
  .setTimeoutSeconds(100.0)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceExecutor(serviceExecutorConfig)
  .build();
```

```kotlin
val withRetry = ... // instance of WithRetry

val serviceExecutorConfig = ServiceExecutorConfig.builder()
  .setServiceName("MyService")
  .setFactory { MyServiceImpl(/* injections here*/) }
  .setConcurrency(10)
  .withRetry(withRetry)
  .setTimeoutSeconds(100.0)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceExecutor(serviceExecutorConfig)
  .build()
``` 

{% /codes %}

This configuration creates a Worker embedding a Service Executor for the `MyService` service that will process up to 10 tasks in parallel, with a [retry policy](/docs/services/references#retry-policy)
and a [timeout](/docs/services/references#task-execution-timeout) of 100 seconds.


### Service Tag Engine 

Here is the configuration to create a Service Tag Engine associated to a Service named `MyService`. 

{% codes %}

```java
ServiceTagEngineConfig serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceTagEngine(serviceTagEngineConfig)
  .build();
```

```kotlin
val serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transport)
  .addServiceExecutor(serviceExecutorConfig)
  .build()
``` 

{% /codes %}

This configuration creates a Worker embedding a Service Tag Engine for the `MyService` service. The `setConcurrency(5)` method sets the concurrency to 5, meaning it will process up to five messages at a time.

{% callout type="warning" %}

To prevent race conditions in the database, Infinitic ensures not to have 2 messages with the same tag (and service name) processed at the same time. Therefore, setting a concurrency higher than your number of tags is not beneficial, as it won't increase processing speed for messages with the same tag. 

{% /callout %}

### Workflow Executor

Here is the configuration to create a Workflow Executor associated to a Workflow named `MyWorkflow`. 

{% codes %}

```java
WorkflowExecutorConfig workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setFactory(() -> new MyWorkflowImpl(/* injections here*/))
  .setConcurrency(10)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addWorkflowExecutor(workflowExecutorConfig)
  .build();
```

```kotlin
val workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setFactory { MyWorkflowImpl(/* injections here*/) }
  .setConcurrency(10)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addWorkflowExecutor(workflowExecutorConfig)
  .build()
``` 

{% /codes %}

This configuration creates a Worker embedding a Workflow Executor for the `MyWorkflow` workflow that will process steps of up to 10 different instances in parallel.

{% callout %}

It's also possible to set a [retry policy](/docs/workflows/references#retry-policy) and a [timeout](/docs/workflows/references#step-execution-timeout) for the workflow executor. But this is not recommended, as a workflow implemention is expected to be deterministic.
{% /callout %}

### Workflow State Engine 

Here is the configuration to create a Workflow State Engine associated to a Workflow named `MyWorkflow`.

{% codes %}

```java
WorkflowStateEngineConfig workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addWorkflowStateEngine(workflowStateEngineConfig)
  .build();
```

```kotlin
val workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transport)
  .addWorkflowStateEngine(workflowStateEngineConfig)
  .build()
``` 

{% /codes %}

This configuration creates a Worker embedding a Workflow State Engine for the `MyWorkflow` workflow. The `setConcurrency(10)` method sets the concurrency to 10, meaning it will process ten messages at a time.

{% callout %}

Infinitic ensures that for a given workflow instance, only one message will be processed at a time, regardless of how many Workflow State Engines are running or their concurrency settings. This guarantees the consistency of the workflow state, and prevents race conditions in the database.

{% /callout %}

### Workflow Tag Engine 

Here is the configuration to create a Workflow Tag Engine associated to a Workflow named `MyWorkflow`.

{% codes %}

```java
WorkflowTagEngineConfig workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addWorkflowTagEngine(workflowTagEngineConfig)
  .build();
```

```kotlin
val workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transport)
  .addWorkflowTagEngine(workflowTagEngineConfig)
  .build()
``` 

{% /codes %}

This configuration creates a Worker embedding a Workflow Tag Engine for the `MyWorkflow` workflow. The `setConcurrency(5)` method sets the concurrency to 5, meaning it will process up to five messages at a time.

{% callout type="warning" %}

To prevent race conditions in the database, Infinitic ensures not to have 2 messages with the same tag (and workflow name) processed at the same time. Therefore, setting a concurrency higher than your number of tags is not beneficial, as it won't increase processing speed for messages with the same tag. 

{% /callout %}

### Event Listener

{% codes %}

```java
EventListenerConfig eventListener = EventListenerConfig.builder()
  .setListener(new TestEventListener())
  .setConcurrency(50)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .setEventListener(eventListener)
  .build();
```

```kotlin
val eventListener = EventListenerConfig.builder()
  .setListener(TestEventListener())
  .setConcurrency(50)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .setEventListener(eventListener)
  .build()
``` 

{% /codes %}

This configuration creates a Worker embedding an Event Listener. The `setConcurrency(50)` method sets the concurrency to 50, meaning it will process up to fifty messages at a time.

### All components

Here is an example of a valid configuration containing all components for a service and a workflow:

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

WorkflowExecutorConfig workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setFactory(() -> new MyWorkflowImpl(/* injections here*/))
  .setConcurrency(10)
  .build();
  
WorkflowStateEngineConfig workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build();

WorkflowTagEngineConfig workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

EventListenerConfig eventListener = EventListenerConfig.builder()
  .setListener(new TestEventListener())
  .setConcurrency(50)
  .build();

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceExecutor(serviceExecutorConfig)
  .addServiceTagEngine(serviceTagEngineConfig)
  .addWorkflowExecutor(workflowExecutorConfig)
  .addWorkflowStateEngine(workflowStateEngineConfig)
  .addWorkflowTagEngine(workflowTagEngineConfig)
  .setEventListener(eventListener)
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
  .build();
  
val serviceTagEngineConfig = ServiceTagEngineConfig.builder()
  .setServiceName("MyService")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

val workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setFactory { MyWorkflowImpl(/* injections here*/) }
  .setConcurrency(10)
  .build();

val workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build();

val workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build();

val eventListener = EventListenerConfig.builder()
  .setListener(TestEventListener())
  .setConcurrency(50)
  .build();

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceExecutor(serviceExecutorConfig)
  .addServiceTagEngine(serviceTagEngineConfig)
  .addWorkflowExecutor(workflowExecutorConfig)
  .addWorkflowStateEngine(workflowStateEngineConfig)
  .addWorkflowTagEngine(workflowTagEngineConfig)
  .setEventListener(eventListener)
  .build()
``` 

{% /codes %}  

## YAML-based Configuration

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

### Transport

#### Pulsar

Here is the minimal configuration to create a worker connecting to a Pulsar cluster:

```yaml
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev
```

#### In Memory

For testing purposes, you can use an in-memory transport:

```yaml
transport:
  inMemory: 
```

{% callout type="warning" %}

This transport should only be used for testing purposes, as it does not persist any messages. 
It should be used with *one worker instance only* (embedding all Services and Workflows components), and with the client `worker.client`.

{% /callout %}

### Databases

Here are the different minimal configurations for the databases. Look at the configuration files for more details.

Storage is used by the following components: [Service Tag Engines](#service-tag-engine), 
[Workflow State Engines](#workflow-state-engine), and [Workflow Tag Engines](#workflow-tag-engine).

#### Redis

```yaml
storage:
  redis:
    host: localhost
    port: 6379
    username: redis
    password: myRedisPassword
```

#### Postgres

```yaml
storage:
  postgres:
    host: localhost
    port: 5432
    username: postgres
    password: myPostgresPassword
```

#### MySQL

```yaml
storage:
  mysql:
    host: localhost
    port: 3306
    username: root
    password: myMysqlPassword
```

#### In Memory

```yaml
storage:
  inMemory: 
```

{% callout type="warning" %}

This storage should only be used for testing purposes, as it does not persist any data.

{% /callout %}

### Service Executor

Here is the configuration to create a Service Executor associated to a Service named `MyService`. 

```yaml
transport:
  ... # Transport configuration here

# Configuration of a Service executor
services:
  - name: MyService
    executor:
      class: example.MyServiceImpl
      concurrency: 10
      timeoutSeconds: 100
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

{% callout type="warning"  %}

Any `class` declared in this configuration file must have an empty constructor.
If your service requires dependencies, consider using builders to create instances.

Additionally, ensure that the class is public and accessible from the worker's classpath. If the class is part of a module, make sure it's properly exported.

{% /callout  %}

This configuration creates a Worker embedding a Service Executor for the `MyService` service that will process up to 10 tasks in parallel, with a [timeout](/docs/services/implementation#task-execution-timeout) of 100 seconds and [retry policy](/docs/services/implementation#retry-policy) using a truncated randomized exponential backoff retry strategy. 

This retry strategy is designed to efficiently handle transient errors while avoiding overwhelming the system. Here's a breakdown of how it works:

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


### Service Tag Engine

Here is the configuration to create a Service Tag Engine associated to a Service named `MyService`. 

```yaml
transport:
  ... # Transport configuration here

# Configuration of a Service Tag Engine
services:
  - name: MyService
    tagEngine:
      concurrency: 5
      storage:
        ... # Storage configuration here
```

This configuration creates a Worker embedding a Service Tag Engine for the `MyService` service. The `setConcurrency(5)` method sets the concurrency to 5, meaning it will process up to five messages at a time.

{% callout type="warning" %}

To prevent race conditions in the database, Infinitic ensures not to have 2 messages with the same tag (and service name) processed at the same time. Therefore, setting a concurrency higher than your number of tags is not beneficial, as it won't increase processing speed for messages with the same tag. 

{% /callout %}

### Workflow Executor

Here is the configuration to create a Workflow Executor associated to a Workflow named `MyWorkflow`. 

```yaml
transport:
  ... # Transport configuration here

# Configuration of a Workflow Executor
workflows:
  - name: MyWorkflow
    executor:
      class: example.MyWorkflowImpl
      concurrency: 10
```
This configuration creates a Worker embedding a Workflow Executor for the `MyWorkflow` workflow that will process steps of up to 10 different instances in parallel.

{% callout %}

It's also possible to set a [retry policy](/docs/workflows/references#retry-policy) and a [timeout](/docs/workflows/references#step-execution-timeout) for the workflow executor. But this is not recommended, as a workflow implemention is expected to be deterministic.
{% /callout %}

### Workflow State Engine


Here is the configuration to create a Workflow State Engine associated to a Workflow named `MyWorkflow`.

```yaml
transport:
  ... # Transport configuration here

# Configuration of a Workflow State Engine
workflows:
  - name: MyWorkflow
    stateEngine:
      concurrency: 10
      storage:
        ... # Storage configuration here
```

This configuration creates a Worker embedding a Workflow State Engine for the `MyWorkflow` workflow. The `setConcurrency(10)` method sets the concurrency to 10, meaning it will process ten messages at a time.

{% callout %}

Infinitic ensures that for a given workflow instance, only one message will be processed at a time, regardless of how many Workflow State Engines are running or their concurrency settings. This guarantees the consistency of the workflow state, and prevents race conditions in the database.

{% /callout %}

### Workflow Tag Engine 

Here is the configuration to create a Workflow Tag Engine associated to a Workflow named `MyWorkflow`.
```yaml
transport:
  ... # Transport configuration here

# Configuration of a Workflow Tag Engine
workflows:
  - name: MyWorkflow
    tagEngine:
      concurrency: 5
      storage:
        ... # Storage configuration here
```

This configuration creates a Worker embedding a Workflow Tag Engine for the `MyWorkflow` workflow. The `setConcurrency(5)` method sets the concurrency to 5, meaning it will process up to five messages at a time.

{% callout type="warning" %}

To prevent race conditions in the database, Infinitic ensures not to have 2 messages with the same tag (and workflow name) processed at the same time. Therefore, setting a concurrency higher than your number of tags is not beneficial, as it won't increase processing speed for messages with the same tag. 

{% /callout %}
### Event Listener

```yaml
transport:
  ... # Transport configuration here

# Configuration of an Event Listener
eventListener:
  listener:
    class: example.MyEventListener
    concurrency: 50
```
### All components

Here is an example of a valid yaml configuration containing all components for a service and a workflow:

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
      concurrency: 10
      timeoutSeconds: 100
      retry:
        minimumSeconds: 1  
        maximumSeconds: 1000
        backoffCoefficient: 2  
        randomFactor: 0.5   
        maximumRetries: 11
    tagEngine:
      concurrency: 5

# Configuration of all components for Workflow MyWorkflow
workflows:
  - name: MyWorkflow
    executor:
      class: example.MyWorkflowImpl
      concurrency: 10
    stateEngine:
      concurrency: 10
    tagEngine:
      concurrency: 5

# Configuration of an Event Listener
eventListener:
  listener:
    class: example.MyEventListener
    concurrency: 50
```

## Starting a Worker

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

fun main() {
  // create the worker config
  val worker = ...
  // start it
  worker.use { it.start() }
}
```

{% /codes %}

