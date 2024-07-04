---
title: Serializability
description: This page explains the importance of serializability in Infinitic for tasks and workflows, detailing the requirements and best practices for ensuring data is correctly serialized and deserialized across distributed systems.
---
_Why must task and workflow parameters and return values be serializable?_

- when a [client](/docs/introduction/terminology#client) dispatches a task/workflow, it serializes parameters before sending them (along with class name and method name)
- when a [service worker](/docs/introduction/terminology#worker) receives a task to execute, it deserializes those parameters
- when a [workflow worker](/docs/introduction/terminology#worker) uses a task output in a workflow, it deserializes it

Primitives (number, string, etc...) being natively serializable, this requirement must be checked only for objects contained in task parameters or return values.

## Using Java

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

### JsonView support

Since version 0.15.0, Infinitic supports Jackson's `@JsonView` annotation, which helps refine object serialization.

#### In Service Interface

In Infinitic, interfaces serve as contracts for remote services:

```java
import com.fasterxml.jackson.annotation.JsonView;
import io.infinitic.annotations.Name;

@Name(name = "UserService")
public interface UserService {
    
    @JsonView(View.R1.class)
    User getUser(@JsonView(View.P1.class) Request request);
}
```

- the `request` object (parameter of the RPC call) is serialized using the `View.P1.class` Jackson view.
- the `user` object (response of the RPC call) is *deserialized* using the `View.R1.class` view.

#### In Service Implementation

In Service workers where the actual implementation runs:

```java
import com.fasterxml.jackson.annotation.JsonView;

public class UserServiceImpl implements UserService {
    
    @Override
    @JsonView(View.R2.class)
    public String getUser(@JsonView(View.P2.class) Request request) {
        ...
        return user
    }
}
```

- the `request` object (parameter of the RPC call) is *deserialized* using the `View.P2.class` Jackson view.
- the `user` object (response of the RPC call) is *serialized* using the `View.R2.class` view.

{% callout %}

Often, you won't need `@JsonView` annotations in the Service implementation, as Infinitic will use the same views defined in the interface. If you do not want to use any view, simply add an empty `@JsonView` annotation.

{% /callout  %}

#### Workflow Interface

Interfaces also serve as contracts for remote workflows:

```java
import com.fasterxml.jackson.annotation.JsonView;
import io.infinitic.annotations.Name;

@Name(name = "UserWorkflow")
public interface UserWorkflow {

    @JsonView(View.R1.class)
    Status welcome(@JsonView(View.P1.class) Registration registration);
}
```
 
- the `registration` object (parameter of the RPC call) is serialized using the `View.P1.class` Jackson view.
- the `status` object (response of the RPC call) is *deserialized* using the `View.R1.class` view.

#### In Workflow Implementation

In Workflow workers where the actual implementation runs:

```java
import io.infinitic.annotations.Name;

import com.fasterxml.jackson.annotation.JsonView;
import hello.world.services.HelloWorldService;
import io.infinitic.workflows.Workflow;

public class UserWorkflowImpl extends Workflow implements UserWorkflow {

    @Override
    @JsonView(View.R2.class)
    Status welcome(@JsonView(View.P2.class) Registration registration) {

        ...
        return status;
    }
}
```

- the `registration` object (parameter of the RPC call) is *deserialized* using the `View.P2.class` Jackson view.
- the `status` object (response of the RPC call) is *serialized* using the `View.R2.class` view.

{% callout %}

Often, you won't need `@JsonView` annotations in the Workflow implementation, as Infinitic will use the same views defined in the interface. If you do not want to use any view, simply add an empty `@JsonView` annotation.

{% /callout  %}

## Using Kotlin

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
