---
title: Pulsar
description: ""
position: 2.2
category: "Components"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/architecture-pulsar@2x.png" class="img" width="1280" height="640" alt=""/>

## Pulsar Installation 

To install Pulsar, please see the [prerequisistes](/overview/prerequisites) or refer to the [Pulsar](http://pulsar.apache.org/docs/en/standalone/) documentation. 

## Pulsar Setup

Before using Infinitic on our Pulsar cluster we need to create a dedicated [tenant](https://pulsar.apache.org/docs/en/concepts-multi-tenancy/#tenants) and configure the [namespaces](https://pulsar.apache.org/docs/en/concepts-multi-tenancy/#namespaces) we want to use. 

Namespaces are useful to isolate messages and avoid mixing things up. For example, we may want to create one namespace per developer, plus one for staging and one for production.

To create a `"infinitic"` Pulsar tenant with a `"dev"` Pulsar namespace, just do 

<code-group><code-block label="Java" active>

```java
admin.setupPulsar();
```
</code-block><code-block label="Kotlin">

```kotlin
admin.setupPulsar()
```
</code-block></code-group>

where `admin` is an `io.infinitic.pulsar.InfiniticAdmin` instance:

<code-group><code-block label="Java" active>

```java
InfiniticAdmin admin = InfiniticAdmin.fromConfigFile("infinitic.yml");
```
</code-block><code-block label="Kotlin">

```kotlin
val admin = InfiniticAdmin.fromConfigFile("configs/infinitic.yml")
```
</code-block></code-group>

Here is an example of a valid `infinitic.yml` file:

```yml
pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```

If we want to use a custom [PulsarAdmin](https://pulsar.apache.org/api/admin/org/apache/pulsar/client/admin/PulsarAdmin.html) instance, we can instantiate an `InfiniticAdmin` instance through:

<code-group><code-block label="Java" active>

```java
InfiniticAdmin admin = InfiniticAdmin(pulsarAdmin, "infinitic", "dev");
```
</code-block><code-block label="Kotlin">

```kotlin
val admin = InfiniticAdmin(pulsarAdmin, "infinitic", "dev")
```
</code-block></code-group>




The `setupPulsar()` method creates the namespaces with some options useful for Infinitic such as [deduplication enabled](https://pulsar.apache.org/docs/en/cookbooks-deduplication/), [partitioned topics](https://pulsar.apache.org/docs/en/concepts-messaging/#partitioned-topics), [schema enforced](https://pulsar.apache.org/docs/en/schema-get-started/) and [retention policies](https://pulsar.apache.org/docs/en/cookbooks-retention-expiry/).

We recommend using [Pulsar Manager](https://github.com/apache/pulsar-manager) if you want more control over namespace settings.

