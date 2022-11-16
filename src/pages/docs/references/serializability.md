---
title: Serializability
description: ""
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
ObjectMapper objectMapper = new ObjectMapper();
String json = objectMapper.writeValueAsString(o1);
CarRentalCart o2 = objectMapper.readValue(json, o1.getClass());
assert o1.equals(o2);
```

(`ObjectMapper` being `com.fasterxml.jackson.databind.ObjectMapper`)

## Checking Serializability In Kotlin

For Kotlin, we recommend using [kotlinx-serialization-json](https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/serialization-guide.md) in our models.

If `o1` is a `CarRentalCart` object used in the parameters of a task (or as a return value), we should be able to run this:

```kotlin
val json = Json.encodeToString(CarRentalCart.serializer(), o1)
val o2 = Json.decodeFromString(CarRentalCart.serializer(), json)
require(o1 == o2)
```

(`Json` being `kotlinx.serialization.json.Json`)

An easy way to reach this requirement is to use [data classes](https://kotlinlang.org/docs/reference/data-classes.html) with a `kotlinx.serialization.Serializable` annotation. For example :

```kotlin
@Serializable
data class CarRentalCart(
    val cartId: String
)
```

If `kotlinx-serialization-json` is not used, the fallback serialization/deserialization method will be [FasterXML/jackson](https://github.com/FasterXML/jackson-docs) as for Java.
