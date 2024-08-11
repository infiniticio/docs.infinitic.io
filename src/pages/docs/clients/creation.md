---
title: Client Creation
description: This page guides on creating Infinitic clients, essential for starting, retrying, and canceling tasks or workflows. It covers adding the infinitic-client dependency, instantiating a client using a configuration file or resource, and details the required infinitic.yml configuration file structure. This is crucial for developers integrating Infinitic into their projects.
---
An Infinitic client lets us start, retry and cancel tasks or workflows, usually from our Web App controllers.

![Client](/img/concept-client-only@2x.png)

First, add the `infinitic-client` dependency into our
{% code-java %} build.gradle {% /code-java %}
{% code-kotlin %} build.gradle.kts {% /code-kotlin %}
file:

{% codes %}

```java
dependencies {
    ...
    implementation "io.infinitic:infinitic-client:0.15.0"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-client:0.15.0")
    ...
}
```

{% /codes %}

We can then instantiate a client from a configuration file in the file system:

{% codes %}

```java
import io.infinitic.clients.InfiniticClient;
...
InfiniticClient client = InfiniticClient.fromConfigFile("infinitic.yml");
```

```kotlin
import io.infinitic.clients.InfiniticClient
...
val client = InfiniticClient.fromConfigFile("infinitic.yml")
```

{% /codes %}

or in the resource folder:

{% codes %}

```java
import io.infinitic.clients.InfiniticClient;
...
InfiniticClient client = InfiniticClient.fromConfigResource("/infinitic.yml");
```

```kotlin
import io.infinitic.clients.InfiniticClient
...
val client = InfiniticClient.fromConfigResource("/infinitic.yml")
```

{% /codes %}

The infinitic.yml configuration file should contain:

- `name` (optional): Specifies the name of the client
- `pulsar`:  Details the connection parameters for [Pulsar](/docs/references/pulsar)
- `shutdownGracePeriodInSeconds` (optional): Defines the grace period allotted to the client to complete its current actions before shutting down (default is `10.0` seconds).

```yaml
# optional
name: client_name

pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
  ...

# optional
shutdownGracePeriodInSeconds: 10.0
```

{% callout type="warning"  %}

When specifying a name in the `infinitic.yml` configuration file, it must be unique among all clients connected to Pulsar. This name will be utilized as the Pulsar producer name, ensuring distinct identification within Pulsar.

{% /callout  %}
