---
title: Workflow Deployment 
description: 
---

This guide covers three essential components for deploying Infinitic Workflows:

1. **[Workflow Executors](#workflow-executors)**: These are stateless components that execute workflow logic. They contain the implementation of your workflow interface and determine the sequence of tasks and sub-workflows to run. When triggered by the Workflow State Engine, a Workflow Executor:
   - Replays the workflow method from the beginning
   - Uses the existing history to skip already completed steps but inject the results of these steps into the current execution
   - Determines what new steps should be executed next
   - Dispatches new tasks or sub-workflows as needed
   - Handles workflow completion and failures

2. **[Workflow State Engines](#workflow-state-engines)**: These are stateless components that maintain workflow state in a database. They coordinate the overall workflow execution by:
   - Listening for events from Service and Workflow Executors
   - Recording workflow history and state changes
   - Dispatching commands to Workflow Executors to advance workflow instances

3. **[Workflow Tag Engines](#workflow-tag-engines)**: These are stateless components that manage workflow tags in a database. They:
   - Track relationships between a workflow tag and the workflow IDs of workflow instances that share this tag
   - Enable bulk operations on existing workflows based on a tag

Each component can be configured through either builders or YAML configuration files. The following sections detail how to set up and configure each component type.

## Workflow Executors

You can setup an Infinitic Worker to run a Workflow Executor throuh builders or using a YAML configuration. Whatever the chosen method, you'll need:

1. The **transport configuration**, describes how to connect to the event broker. 

2. The **Workflow Executor configuration**, describes how to instanciate Workflow classes for a given workflow name, and defines optional parameters such as the concurrency level, batching policy, retry policy, execution timeout.

Once an Infinitic Worker is created and configured to run a Workflow Executor, it can be started with the `start()` method.

Workflow Executor have the following optional configuration parameters:

- `concurrency`: the number of steps that can be executed concurrently by the Workflow Executor.
- `batch`: the batching policy for receiving and sending messages from and to the message broker.
- `retry`: the retry policy to use when a task fails.
- `timeout`: the execution timeout for a task.

### Prerequisites

To build a Worker you need first to add the `infinitic-worker` dependency into your project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.17.1"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.17.1")
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

    // create the Workflow Executor config for workflow MyWorkflow
    WorkflowExecutorConfig workflowExecutorConfig = WorkflowExecutorConfig.builder()
      .setWorkflowName("MyWorkflow")
      .setFactory(() -> new MyWorkflowImpl(/* injections here*/))
      .build();

    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.builder()
        .setTransport(transportConfig)
        .addWorkflowExecutor(workflowExecutorConfig)
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

  // create the workflow executor configuration for workflow MyWorkflow
  val workflowExecutorConfig = WorkflowExecutorConfig.builder()
    .setWorkflowName("MyWorkflow")
    .setFactory { MyWorkflowImpl(/* injections here*/) }
    .build();

  // create and start the worker
  val worker = InfiniticWorker.builder()
    .setTransport(transportConfig)
    .addWorkflowExecutor(workflowExecutorConfig)
    .build()
  worker.use { it.start() }
}
```

{% /codes %}

### Minimal Example Using YAML Configuration

Here is a minimal `infinitic.yml` configuration file to create a Workflow Executor for a Workflow `MyWorkflow`. 

```yaml
# Transport configuration for a local Pulsar
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Workflow Executor configuration for workflow MyWorkflow
workflows:
  - name: MyWorkflow
    executor:
      class: example.MyWorkflowImpl
```

This Workflow Executor can be started with:

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

**By default, messages are executed sequentially, one after another, within the same Workflow Executor.** However, we can increase the level of parallelism with the `concurrency` parameter. 

With `concurrency = 50`, a Workflow Executor will execute up to 50 messages concurrently. If 50 messages are already running, the worker will stop consuming messages until a slot becomes available. 

{% callout  %}

By design, Infinitic guarantees that only one Workflow Executor can process a given workflow instance at ta given time. 

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WorkflowExecutorConfig workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setFactory(() -> new MyWorkflowImpl(/* injections here*/))
  .setConcurrency(50)
  .build();
```

```kotlin
val workflowExecutorConfig = WorkflowExecutorConfig.builder()
    .setWorkflowName("MyWorkflow")
    .setFactory { MyWorkflowImpl(/* injections here*/) }
    .setConcurrency(50)
    .build();
```

{% /codes %}

#### Configuration Using YAML

```yaml
executor:
  class: example.MyWorkflowImpl
  concurrency: 50
```

### Batching (Beta)

Batching refers to the process of grouping multiple messages together into a single batch:
- while receiving messages from the broker;
- while processing messages;
- while sending messages to the broker.

This technique improves efficiency and reduces latency, especially for high-throughput applications, by reducing the number of network calls required.

Batching can be configured with 2 parameters:

- `maxMessages` (int): the maximal number of messages in a batch.
- `maxSeconds` (double): the maximal duration of a batch in seconds.

{% callout  %}

When batching, the `concurrency` settings indicates how many batches are processed in parallel.

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WithRetry withRetry = ...

WorkflowExecutorConfig workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setFactory(() -> new MyWorkflowImpl(/* injections here*/))
  .setBatch(1000, 0.1)
  .build();
```

```kotlin
val workflowExecutorConfig = WorkflowExecutorConfig.builder()
    .setWorkflowName("MyWorkflow")
    .setFactory { MyWorkflowImpl(/* injections here*/) }
    .setBatch(1000, 0.1)
    .build();
```

{% /codes %}

#### Configuration Using YAML

```yaml
executor:
  class: example.MyWorkflowImpl
  batch: 
    maxMessages: 1000
    maxSeconds: 0.1
```

### Retry Policy

{% callout %}
It's possible to set a retry policy for the workflow executor, in the same way as for the [Service Executor](/docs/services/deployment#retry-policy). But this is not recommended, as a workflow implemention is expected to be deterministic ans should not have transiant errors.
{% /callout %}
   
### Execution Timeout

{% callout %}
It's possible to set an execution timeout for the workflow executor, in the same way as for the [Service Executor](/docs/services/deployment#execution-timeout). But this is not recommended, as a workflow processing is expected to be short.
{% /callout %}


## Workflow State Engines

You can setup an Infinitic Worker to run a Workflow State Engine throuh builders or using a YAML configuration. Whatever the chosen method, you'll need:

1. The **transport configuration**, describes how to connect to the event broker.

2. The **Workflow State Engine configuration**, describes where to store the state of workflows, and defines optional parameters.

Once an Infinitic Worker is created and configured to run a Workflow State Engine, it can be started with the `start()` method.

Workflow State Engine have the following configuration parameters:

- storage: the storage configuration to use to store the state of workflows.
- batch: the batching policy when receiving and sending messages from and to the message broker.

### Minimal Example Using Builders

Here is a minimal configuration to create and start a Workflow Tag Engine associated to a Workflow `MyWorkflow`. 

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

    // Workflow State Engine configuration
    WorkflowStateEngineConfig workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
      .setWorkflowName("MyWorkflow")
      .setStorage(storageConfig)
      .build();

    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.builder()
        .setTransport(transportConfig)
        .addWorkflowStateEngine(workflowStateEngineConfig)
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
  
  // Workflow State Engine configuration
  val workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
    .setWorkflowName("MyWorkflow")
    .setStorage(storageConfig)
    .build()

  // create and start the worker
  val worker = InfiniticWorker.builder()
    .setTransport(transportConfig)
    .addWorkflowStateEngine(workflowStateEngineConfig)
    .build()
  worker.use { it.start() }
}
``` 

{% /codes %}  

### Minimal Example Using YAML


Here is a minimal `infinitic.yml` configuration file to create a Workflow State Engine associated to a Workflow `MyWorkflow`. 

```yaml
# Transport configuration for a local Pulsar
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Workflow State Engine Configuration for workflow MyWorkflow
workflows:
  - name: MyWorkflow
    stateEngine:
      storage:
        postgres:
          host: localhost
          port: 5432
          username: postgres
          password: ********
```

The Infinitic Worker embedding this Workflow State Engine can be created and started with:

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

Configuring a storage is mandatory to run a Workflow State Engine.
See [Storage](/docs/references/storage) for more details.

### Concurrency

**By default, messages are executed sequentially, one after another, within the same Workflow State Engine.** However, we can increase the level of parallelism with the `concurrency` parameter. 

With `concurrency = 10`, a Workflow State Engine will execute up to 10 messages concurrently. If 10 messages are already running, the worker will stop consuming messages until a slot becomes available. 

{% callout  %}

By design, Infinitic guarantees that only one Workflow State Engine can process a given workflow instance at a given time. 

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WorkflowStateEngineConfig workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build();
```

```kotlin
val workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
    .setWorkflowName("MyWorkflow")
    .setStorage(storageConfig)
    .setConcurrency(10)
    .build();
```

{% /codes %}

#### Configuration Using YAML

```yaml
workflows:
  - name: MyWorkflow
    stateEngine:
      concurrency: 10
      storage:
        # storage configuration
```

### Batching (Beta)

Batching refers to the process of grouping multiple messages together into a single batch:
- while receiving messages from the broker;
- while processing messages;
- while sending messages to the broker.

This technique improves efficiency and reduces latency, especially for high-throughput applications, by reducing the number of network calls required.

Batching can be configured with 2 parameters:

- `maxMessages` (int): the maximal number of messages in a batch.
- `maxSeconds` (double): the maximal duration of a batch in seconds.

{% callout  %}

When batching, the `concurrency` settings indicates how many batches are processed in parallel.

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WorkflowStateEngineConfig workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setBatch(1000, 0.1)
  .build();
```

```kotlin
val workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setBatch(1000, 0.1)
  .build()
```

{% /codes %}

#### Configuration Using YAML

```yaml
stateEngine:
  batch: 
    maxMessages: 1000
    maxSeconds: 0.1
  storage:
    # storage configuration
```


## Workflow Tag Engines

You can setup an Infinitic Worker to run a Workflow Tag Engine throuh builders or using a YAML configuration. Whatever the chosen method, you'll need:

1. The **transport configuration**, describes how to connect to the event broker.

2. The **Workflow Tag Engine configuration**, describes where to store the relationship between workflow IDs and workflow tags, and defines optional parameters.

Once an Infinitic Worker is created and configured to run a Workflow Tag Engine, it can be started with the `start()` method.

Workflow Tag Engine have the following configuration parameters:

- storage: the storage configuration to use to store the relationship between workflow IDs and workflow tags.
- batch: the batching policy when receiving and sending messages from and to the message broker.

### Minimal Example Using Builders

Here is a minimal configuration to create and start a Workflow Tag Engine associated to a Workflow `MyWorkflow`. 

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

    // Workflow Tag Engine configuration
    WorkflowTagEngineConfig workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
      .setWorkflowName("MyWorkflow")
      .setStorage(storageConfig)
      .build();

    // create and start the worker
    try(
      InfiniticWorker worker = InfiniticWorker.builder()
        .setTransport(transportConfig)
        .addWorkflowTagEngine(workflowTagEngineConfig)
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
  
  // Workflow Tag Engine configuration
  val workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
    .setWorkflowName("MyWorkflow")
    .setStorage(storageConfig)
    .build()

  // create and start the worker
  val worker = InfiniticWorker.builder()
    .setTransport(transportConfig)
    .addWorkflowTagEngine(workflowTagEngineConfig)
    .build()
  worker.use { it.start() }
}
``` 

{% /codes %}  

### Minimal Example Using YAML


Here is a minimal `infinitic.yml` configuration file to create a Workflow Tag Engine associated to a Workflow `MyWorkflow`. 

```yaml
# Transport configuration for a local Pulsar
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Workflow Tag Engine Configuration for workflow MyWorkflow
workflows:
  - name: MyWorkflow
    tagEngine:
      storage:
        postgres:
          host: localhost
          port: 5432
          username: postgres
          password: ********
```

The Infinitic Worker embedding this Workflow Tag Engine can be created and started with:

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

### Concurrency

**By default, messages are executed sequentially, one after another, within the same Workflow Tag Engine.** However, we can increase the level of parallelism with the `concurrency` parameter. 

With `concurrency = 10`, a Workflow Tag Engine will execute up to 10 messages concurrently. If 10 messages are already running, the worker will stop consuming messages until a slot becomes available. 

{% callout  %}

By design, Infinitic guarantees that only one Workflow Tag Engine can process a message for a specific workflow tag at a given time. 

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WorkflowTagEngineConfig workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build();
```

```kotlin
val workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build()
```

{% /codes %}

#### Configuration Using YAML

```yaml
tagEngine:
  concurrency: 10
  storage:
    # storage configuration
```

### Batching (Beta)

Batching refers to the process of grouping multiple messages together into a single batch:
- while receiving messages from the broker;
- while processing messages;
- while sending messages to the broker.

This technique improves efficiency and reduces latency, especially for high-throughput applications, by reducing the number of network calls required.

Batching can be configured with 2 parameters:

- `maxMessages` (int): the maximal number of messages in a batch.
- `maxSeconds` (double): the maximal duration of a batch in seconds.

{% callout  %}

When batching, the `concurrency` settings indicates how many batches are processed in parallel.

{% /callout  %}

#### Configuration Using Builders

{% codes %}

```java
WorkflowTagEngineConfig workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setBatch(1000, 0.1)
  .build();
```

```kotlin
val workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
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

WorkflowExecutorConfig workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .addFactory(() -> new MyWorkflowImpl(/* injections here*/))
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

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addWorkflowExecutor(workflowExecutorConfig)
  .addWorkflowStateEngine(workflowStateEngineConfig)
  .addWorkflowTagEngine(workflowTagEngineConfig)
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

val workflowExecutorConfig = WorkflowExecutorConfig.builder()
  .setWorkflowName("MyWorkflow")
  .addFactory { MyWorkflowImpl(/* injections here*/) }
  .setConcurrency(10)
  .build()

val workflowStateEngineConfig = WorkflowStateEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(10)
  .build()

val workflowTagEngineConfig = WorkflowTagEngineConfig.builder()
  .setWorkflowName("MyWorkflow")
  .setStorage(storageConfig)
  .setConcurrency(5)
  .build()

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addWorkflowExecutor(workflowExecutorConfig)
  .addWorkflowStateEngine(workflowStateEngineConfig)
  .addWorkflowTagEngine(workflowTagEngineConfig)
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
```