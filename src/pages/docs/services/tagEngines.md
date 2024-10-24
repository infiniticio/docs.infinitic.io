---
title: Service Tag Engines
description: This documentation introduces Infinitic's service workers, designed to execute tasks. It explains how to configure and start a service worker, detailing the addition of dependencies, the instantiation process, and the configuration of services including concurrency, timeout, and retry policies. This guide is crucial for developers seeking to implement robust task processing systems with Infinitic's scalable, horizontally distributed workers.
---

## What are Service Tag Engines?

Service Tag Engines are specialized components in Infinitic that manage the relationship between tags and task IDs. They play a crucial role when using tags in your workflows to identify and manage tasks.

Key functions of Service Tag Engines include:

1. **Tag-Task Association**: They maintain a mapping between tags and their corresponding task IDs. This allows for efficient retrieval and management of tasks based on their tags.

2. **Tag-Based Operations**: They support operations that involve tags, such as dispatching tasks to Service Executors based on tag information.

3. **Consistency Management**: They ensure that the tag-task relationships remain consistent across the distributed system, even in the face of concurrent operations or system failures.

4. **Scalability Support**: By managing tag-task associations, they enable Infinitic to scale horizontally while maintaining the ability to work with tagged tasks efficiently.

When you use tags in your workflows to identify tasks or groups of tasks, the Service Tag Engines work behind the scenes to make these operations possible and efficient. They act as a layer between your workflow logic and the actual task execution, allowing you to work with higher-level abstractions (tags) rather than dealing directly with individual task IDs.

{% callout type="note"  %}

Service Tag Engines are designed for horizontal scalability. To increase the overall throughput of your application and improve its fault tolerance, you can simply deploy multiple instances of service tag engines. Each additional worker contributes to the system's ability to handle more tasks concurrently, while also providing redundancy in case of individual worker failures. 

{% /callout  %}


{% callout type="warning" %}

Service Tag Engines are optional. You need them only if you are using Services tags inside your workflows 

{% /callout  %}

Service Tag Engines are responsible for:
 - Storing and maintaining the associations between task tags and task IDs.
 - Supporting operations based on tags, by dispatching tasks to Service Executors.


## Configuration

Before building a Service Executor, you need to add the `infinitic-worker` dependency into our project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.16.1"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.16.1")
    ...
}
```

{% /codes %}

A Service Tag Engine can be configurated 
throuh [code](#code-based-configuration-2) or [YAML](#yaml-based-configuration-2). 
This configuration must contains the following information:

- How to connect to Pulsar
- For each Service Tag Engine:
    - the Service name
    - the [concurrency](#concurrency) level
    - the [storage](#storage) details

### Concurrency Level

**By default, a Service Tag Engine will create one consumer to handle messages one by one.**  We can increase this number with the `concurrency` parameter (see below). For example, with `concurrency = 50`, a Service Tag Engine will create 50 consumers to execute up to 50 messages concurrently. 

{% callout  %}

Each tag is automatically assigned to a specific consumer to prevent race conditions when updating the associations between tags and task IDs. This design ensures data consistency but also means that increasing the concurrency level beyond the number of unique tags won't provide additional performance benefits.

{% /callout  %}


### Storage Details

The storage Details are describing how to access the storage system used to store the one-to-many relation between a tag and the tasks IDs of the tasks having this tag. 


## YAML-based Configuration

An `InfiniticWorker` object can be obtained directly from a YAML string, a YAML file or a YAML resource:

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

# Pulsar settings
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev

# Default Storage details
storage:
  cache:
    expireAfterWrite: 600
  mysql: 
    host: localhost
    port: 3306
    database: infinitic
    username: root
    password: 

# Configuration of Services Tag Engines
services:
  - name: CarRentalService
    tagEngine:
  - name: FlightBookingService
    tagEngine:
      concurrency: 5
  - name: HotelBookingService
    tagEngine:
      concurrency: 5
```

This configuration contains several key components:

1. Worker Name (Optional):
   - A unique identifier for the worker among all workers and clients connected to the same Pulsar namespace.
   - Used primarily for logging purposes.

2. Pulsar Settings:
   - Configures the connection to Apache Pulsar.
   - Includes broker service URL, web service URL, tenant, and namespace.
   - For more details, see the [Pulsar settings documentation](/docs/references/pulsar).

3. Default Storage Configuration:
   - Defines the default storage settings for all Engines.
   - Includes compression & cache settings, and database connection details.
   - Will be used for any Engine that doesn't specify its own storage configuration.

4. Service Tag Engine Configurations, defined for each Service by name.
   - Concurrency Level (Optional, default to 1)
   - Storage Configuration (Optional, but then the default storage configuration will be used).


##Code-based Configuration

A  Service Tag Engine configuration can also be created with builders:

{% codes %}

```java
TransportConfigBuilder transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080") 
  .setTenant("infinitic")
  .setNamespace("dev");

StorageConfigBuilder storage = MySQLStorageConfig.builder()
  .setCompression(CompressionConfig.bzip2)
  .setCache(
    CaffeineCacheConfig.builder().setExpireAfterWrite(600) 
  )
  .setHost("localhost")
  .setPort(3306)
  .setDatabase("infinitic")
  .setUsername("root")
  .setPassword("***");

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("CarRentalService")
      .setConcurrency(5)
      .setStorage(storage)  
  )
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("FlightBookingService")
      .setConcurrency(5)
      .setStorage(storage)
  )
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("HotelBookingService")
      .setConcurrency(5)
      .setStorage(storage)  
  )
  .build();
```

```kotlin
val transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080")
  .setTenant("infinitic")
  .setNamespace("dev")
  .build()

val storage = MySQLStorageConfig.builder()
  .setCompression(CompressionConfig.bzip2)
  .setCache(
    CaffeineCacheConfig.builder().setExpireAfterWrite(600)
  )
  .setHost("localhost")
  .setPort(3306)
  .setDatabase("infinitic")
  .setUsername("root")
  .setPassword("***")

val worker = InfiniticWorker.builder()
  .setTransport(transportConfig)
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("CarRentalService")
      .setConcurrency(5)
      .setStorage(storage)
  )
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("FlightBookingService")
      .setConcurrency(5)
      .setStorage(storage)
  )
  .addServiceTagEngine(
    "HotelBookingService",
    ServiceTagEngineConfig.builder()
      .setServiceName("HotelBookingService")
      .setConcurrency(5)
      .setStorage(storage)  
  )
  .build()
``` 

{% /codes %}

## Mixing Service Workers and Tag Engines

It's possible to mix Service Workers and Service Tag Engines in the same worker. 

Here is an example of a valid yaml configuration for a worker that embeds both the executor and the tag engine for a `CarRentalService`:

```yaml
# Transport settings
transport:
  ...

# Storage settings
storage:
  ...

# Configuration of Services
services:
  - name: CarRentalService
    executor:
      class: example.booking.services.carRental.CarRentalServiceImpl
      concurrency: 50
    tagEngine:
      concurrency: 10
```

Or the same configuration in code:

{% codes %}

```java
TransportConfigBuilder transport = ...

StorageConfigBuilder storage = ...

InfiniticWorker worker = InfiniticWorker.builder()
  .setTransport(transport)
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("CarRentalService")
      .addFactory(() -> new CarRentalServiceImpl(/* injections here*/))
      .setConcurrency(5)
  )
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("CarRentalService")
      .setConcurrency(5)
      .setStorage(storage)  
  )
  .build();
```

```kotlin
val transport = ...

val storage = ...

val worker = InfiniticWorker.builder()
  .setTransport(transport)
  .addServiceExecutor(
    ServiceExecutorConfig.builder()
      .setServiceName("CarRentalService")
      .setFactory(() -> new CarRentalServiceImpl(/* injections here*/))
      .setConcurrency(5)
  )
  .addServiceTagEngine(
    ServiceTagEngineConfig.builder()
      .setServiceName("CarRentalService")
      .setConcurrency(5)
      .setStorage(storage)  
  )
  .build()
``` 

{% /codes %}

