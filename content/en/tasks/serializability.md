---
title: Serializability
description: ""
position: 2.5
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

_Why must task parameters and return value be serializable/deserializable?_

- when a [client](/overview/architecture) (or a [workflow executor](/overview/architecture)) dispatches a task, it serializes parameters before sending them (along with class name and method name)
- when a [task executor](/overview/architecture) receives a task to execute, it deserializes those parameters
- when a [task executor](/overview/architecture) completes a task, it serializes the output and sent it back
- when a [workflow executor](/overview/architecture) uses a task output in a workflow, it deserializes it

Primitives (number, string, etc...) being natively serializable/deserializable, this requirement must be checked only for objects contained in tasks parameters or return value.

## Checking Serializability In Java

For Java, Infinitic uses [FasterXML/jackson](https://github.com/FasterXML/jackson-docs) to serialize/deserialize into/from JSON.

If `o1` is a `CarRentalCart` object used in the parameters of a task (or as return value), we should be able to run this:

```java
ObjectMapper objectMapper = new ObjectMapper();
String json = objectMapper.writeValueAsString(o1);
CarRentalCart o2 = objectMapper.readValue(json, o1.getClass());
assert o1.equals(o2);
```

(`ObjectMapper` being `com.fasterxml.jackson.databind.ObjectMapper`)

## Checking Serializability In Kotlin

For Kotlin, we recommend using [kotlinx-serialization-json](https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/serialization-guide.md) in our models.

If `o1` is a `CarRentalCart` object used in the parameters of a task (or as return value), we should be able to run this:

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
