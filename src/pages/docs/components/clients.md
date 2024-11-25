---
title: Infinitic Clients
description: This page provides a comprehensive guide on Infinitic Clients, essential components for interacting with Infinitic applications. Learn how to create, configure, and utilize clients to manage workflows, retry tasks, and perform other crucial operations in your distributed system. Discover the flexibility of builder-based and YAML-based configurations for seamless integration with your Infinitic infrastructure.
---

An Infinitic **Client**  allows you to interact with the Infinitic application. It can be used to start or cancel workflows, retry tasks, etc.

## Creating a Client

To build an Infinitic Client you need first to add the `infinitic-client` dependency into your project:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-client:0.16.2"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-client:0.16.2")
    ...
}
```

{% /codes %}

An Infinitic client can be set up throuh [builders](#builder-based-configuration) or using [YAML](#yaml-based-configuration). 

Whatever the chosen method, you'll need to pecify how to connect to the event broker. 

## Builder-based Configurations

Here is the configuration to create a worker connecting to a Pulsar cluster:

{% codes %}

```java
TransportConfig transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080") 
  .setTenant("infinitic")
  .setNamespace("dev")
  .build();

InfiniticClient client = InfiniticClient.builder()
  .setTransport(transportConfig)
  .build();
```

```kotlin
val transportConfig = PulsarTransportConfig.builder()
  .setBrokerServiceUrl("pulsar://localhost:6650")
  .setWebServiceUrl("http://localhost:8080")
  .setTenant("infinitic")
  .setNamespace("dev")
  .build()

val client = InfiniticClient.builder()
  .setTransport(transportConfig)
  .build()
``` 

{% /codes %}

More configuration options are available, see [Pulsar reference](/docs/references/pulsar).

## YAML-based Configuration

A client can be created directly from a YAML string, a YAML file or a YAML resource:

{% codes %}

```java
// From a YAML string
InfiniticClient client = InfiniticClient.fromYamlString("yaml content here");
// From a YAML file
InfiniticClient client = InfiniticClient.fromYamlFile("infinitic.yml");
// From a YAML resource
InfiniticClient client = InfiniticClient.fromYamlResource("/path/to/infinitic.yml");
```

```kotlin
// From a YAML string
val client = InfiniticClient.fromYamlString("yaml content here")
// From a YAML file
val client = InfiniticClient.fromYamlFile("infinitic.yml")
// From a YAML resource
val client = InfiniticClient.fromYamlResource("/path/to/infinitic.yml")
```

{% /codes %}

Here is a minimal configuration to create a client connecting to a Pulsar cluster:

```yaml
transport:
  pulsar:
    brokerServiceUrl: pulsar://localhost:6650/
    webServiceUrl: http://localhost:8080
    tenant: infinitic
    namespace: dev
```

More configuration options are available, see [Pulsar reference](/docs/references/pulsar).



