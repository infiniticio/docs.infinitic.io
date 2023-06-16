---
title: Client Creation
description: Quidem magni aut exercitationem maxime rerum eos.
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
    implementation "io.infinitic:infinitic-client:0.11.+"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("io.infinitic:infinitic-client:0.11.+")
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

- a `name` (optional)
- a `pulsar` entry describing how to connect to [Pulsar](/docs/references/pulsar)

```yaml
# name is optional
name: client_name

pulsar: ...
```

{% callout type="warning"  %}

When providing a name, it must be unique among all clients connected to Pulsar, as it will be used as Pulsar producer name.

{% /callout  %}
