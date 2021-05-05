---
title: Clients
description: ""
position: 2.3
category: "Components"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/architecture-client@2x.png" class="img" width="1280" height="640" alt=""/>

## Client Instantiation

An Infinitic client lets us start, retry and cancel tasks or workflows, usually from your Web App controllers.

We can instantiate a client using

- a [Pulsar Client](https://pulsar.apache.org/docs/en/client-libraries-java/) ,
- the tenant / namespace dedicated to Infinitic,
- a name (optional):

<code-group><code-block label="Java" active>

```java
import io.infinitic.pulsar.InfiniticClient;
...

InfiniticClient client = InfiniticClient(
    pulsarClient,
    pulsarTenant,
    pulsarNamespace,
    clientName
);
```

</code-block><code-block label="Kotlin">

```kotlin
import io.infinitic.pulsar.InfiniticClient
...

var client = InfiniticClient(
    pulsarClient,
    pulsarTenant,
    pulsarNamespace,
    clientName
)
```

</code-block></code-group>

<alert type="warning">

When providing a name, this name MUST be unique among your different machines, as it will be used as Pulsar producer name.

</alert>

We can also create a client from a configuration file in your file system:

<code-group><code-block label="Java" active>

```java
InfiniticClient client = InfiniticClient.fromConfigFile("infinitic.yml");
```

</code-block><code-block label="Kotlin">

```kotlin
var client = InfiniticClient.fromConfigFile("infinitic.yml")
```

</code-block></code-group>

or in your resource folder

<code-group><code-block label="Java" active>

```java
InfiniticClient client = InfiniticClient.fromConfigResource("/infinitic.yml");
```

</code-block><code-block label="Kotlin">

```kotlin
var client = InfiniticClient.fromConfigResource("/infinitic.yml")
```

</code-block></code-group>

with:

```yml[infinitic.yml]
name: devClient

pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```

## Client Usage
