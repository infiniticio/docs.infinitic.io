---
title: Serializability
description: This page explains the importance of serializability in Infinitic for tasks and workflows, detailing the requirements and best practices for ensuring data is correctly serialized and deserialized across distributed systems.
---
_Why must task and workflow parameters and return values be serializable?_

- when a [client](/docs/introduction/terminology#client) dispatches a task/workflow, it serializes parameters before sending them (along with class name and method name)
- when a [service worker](/docs/introduction/terminology#worker) receives a task to execute, it deserializes those parameters
- when a [workflow worker](/docs/introduction/terminology#worker) uses a task output in a workflow, it deserializes it

Primitives (number, string, etc...) being natively serializable, this requirement must be checked only for objects contained in task parameters or return values.

## Checking Serializability In Java

For Java, Infinitic uses [FasterXML/jackson](https://github.com/FasterXML/jackson-docs) to serialize/deserialize into/from JSON.

If `o1` is a `CarRentalCart` object used in the parameters of a task (or as a return value), we should be able to run this:

```java
import io.infinitic.serDe.java.Json;
...
ObjectMapper objectMapper = Json.getMapper();
String json = objectMapper.writeValueAsString(o1);
String o2 = objectMapper.readValue(json, o1.getClass());
assert o1.equals(o2);
```

It's also possible to use a custom object mapper before using an Infinitic client or starting an Infinitic worker:

```java
import io.infinitic.serDe.java.Json;
...
// introduce a custom object mapper for current client or worker
ObjectMapper updatedMapper = Json.getMapper().configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);
Json.setMapper(updatedMapper);
```

{% callout type="warning"  %}

If you use a custom object mapper, ensure it is used consistently in both clients and workers.
Also, avoid changing the object mapper without verifying that the new one can deserialize previously serialized data,
if there are still running workflows.

{% /callout  %}

## Checking Serializability In Kotlin

For Kotlin, we recommend using [kotlinx-serialization-json](https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/serialization-guide.md) in our models.

An easy way is to use [data classes](https://kotlinlang.org/docs/reference/data-classes.html) with a `kotlinx.serialization.Serializable` annotation. For example :

```kotlin
@Serializable
data class CarRentalCart(
    val cartId: String
)
```

{% callout type="note"  %}

If `kotlinx-serialization-json` is not used, the fallback serialization/deserialization method will be [FasterXML/jackson](https://github.com/FasterXML/jackson-docs) as for Java.

{% /callout  %}

If `o1` is a `CarRentalCart` object used in the parameters of a task (or as a return value), we should be able to run this:

```kotlin
import io.infinitic.serDe.kotlin.json
...
val jsonData = json.encodeToString(CarRentalCart.serializer(), o1)
val o2 = json.decodeFromString(CarRentalCart.serializer(), jsonData)
require(o1 == o2)
```

It's also possible to use a custom object mapper before using an Infinitic client or starting an Infinitic worker:

```kotlin
import io.infinitic.serDe.kotlin.json
import kotlinx.serialization.json.Json
...
// introduce a custom object mapper for current client or worker
json = Json {
  classDiscriminator = "#klass"
  ignoreUnknownKeys = true
}
```

{% callout type="warning"  %}

If you use a custom object mapper, ensure it is used consistently in both clients and workers.
Also, avoid changing the object mapper without verifying that the new one can deserialize previously serialized data,
if there are still running workflows.

{% /callout  %}
