---
title: Pulsar Setup
description: ""
position: 2.1
category: "Setup"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Before using Infinitic on your Pulsar cluster we recommend creating a dedicated [tenant](https://pulsar.apache.org/docs/en/concepts-multi-tenancy/#tenants) and multiple [namespaces](https://pulsar.apache.org/docs/en/concepts-multi-tenancy/#namespaces). 

Namespaces are useful to isolate messages and avoiding to mix things. For example, you may want to create one namespace per developer, plus one for staging and one for production. 

<alert type="info">

If in a hurry, we can use the command included in the [example app](/overview/example-app#pulsar-configuration). Just make sure to update the settings in `configs/infinitic.yml` file accordingly.

</alert>

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

Note: another option is to use our own [PulsarAdmin](https://pulsar.apache.org/api/admin/org/apache/pulsar/client/admin/PulsarAdmin.html) to instantiate an `InfiniticAdmin`:

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

