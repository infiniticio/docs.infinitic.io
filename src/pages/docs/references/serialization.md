---
title: Serialization
description: This page explains the importance of serialization in Infinitic for tasks and workflows, detailing the requirements and best practices for ensuring data is correctly serialized and deserialized across distributed systems.
---

## How Infinitic uses serialization

Serialization is fundamental to the distributed nature of tasks and workflows in Infinitic. It enables data transfer between different components of the system. Let's examine how serialization is used in different scenarios.

Consider a method `myMethod` in a Service or Workflow interface:

{% codes %}

```java
Bar myMethod(Foo foo);
```

```kotlin
fun myMethod(foo: Foo): Bar;
```

{% /codes %}

### In Workflows

When `myMethod` is part of a Workflow interface and an Infinitic Client synchronously dispatches this method:

* The Client serializes the `Foo` argument to JSON, and sent it in a command to a Workflow worker.

* The Workflow worker receiving the command, deserializes the JSON to a `Foo` object and executes `myMethod`  using this deserialized object.

* Once the method completed, the Workflow worker serializes the `Bar` result to JSON, and send it in an event back to the initial Client.

* When receiving the event, the Client deserializes the JSON to a `Bar` object, and uses it.


### In Services

When `myMethod` is part of a Service interface and an Infinitic Workflow worker synchronously dispatches this method as a task:

* The Workflow worker serializes the `Foo` argument to JSON, and send it in a command to a Service worker.

* The Service worker receiving the event deserializes the JSON to a `Foo` object and executes `myMethod`  using this deserialized object.

* Once the method completed, the Service worker serializes the `Bar` result to JSON, and send it in an event to a Workflow worker.

* The Workflow worker receiving the event deserializes the JSON to a `Bar` object, and continues the workflow execution.


### Key Points

* Serialization occurs at every transition between system components (client, workflow worker, service worker).
* JSON is used as the serialization format for data transfer.
* Both method arguments (`Foo`) and return values (`Bar`) must be serializable.
* Proper serialization/deserialization ensures data integrity across the distributed system.
* While serialization enables distributed processing, it can impact performance for large data structures or high-frequency operations

## Java Serialization

For Java, Infinitic uses [FasterXML/jackson](https://github.com/FasterXML/jackson-docs) to serialize/deserialize into/from JSON.

### Serialization Testing

To verify if `Foo` is properly serializable, use the following test pattern with `foo` being an object of type `Foo` (the same applies for `Bar`) :

```java
import io.infinitic.serDe.java.Json;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.ObjectReader;
...
// Get Foo Type object
Type fooType = Foo.class;
// get writer for Foo 
ObjectWriter objectWriter = Json.getMapper().writerFor(fooType);
// string representation of the foo object
String json = objectMapper.writeValueAsString(foo);
// get reader for Foo 
ObjectReader objectReader = Json.getMapper().readerFor(fooType);
// deserialize json to Foo 
String foo2 = objectReader.readValue(json);
// checking everything is ok
assert foo2.equals(foo);
```

### Handling Different Types

1. Concrete Classes: The above pattern works directly for concrete classes.

2. Hierarchical Classes: If `Foo` is an open class, that only have 2 subclasses `FooA` and `FooB`, add Jackson annotations to provide type information:

    ```java
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "klass", visible = true)
    @JsonSubTypes({
            @JsonSubTypes.Type(value = FooA.class, name = "FooA"),
            @JsonSubTypes.Type(value = FooB.class, name = "FooB")
    })
    abstract class Foo {
    ```

3. Interfaces: If `Foo` is an interface, only implemented by classes `FooA` and `FooB`, add Jackson annotations to provide type information:

    ```java
    @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "klass")
    @JsonSubTypes({
            @JsonSubTypes.Type(value = FooA.class, name = "FooA"),
            @JsonSubTypes.Type(value = FooB.class, name = "FooB")
    })
    interface Foo {
    ```

4. Complex Types: 

    If `Foo` is a complex type (e.g., collections, arrays, maps), it should be serializable if all its components are serializable. Note that the test above must be updated to extract the generic type from the method signature:

    ```java
    Method method = klass.getMethod("myMethod", Foo.class);
    Type fooType = Arrays.stream(method).getGenericParameterTypes()).findFirst().orElseThrow();
    ```

    If `Bar` is a complex type (e.g., collections, arrays, maps), it should be serializable if all its components are serializable. Note that the test above must be updated to extract the generic type from the method signature:

    ```java
    Method method = klass.getMethod("myMethod", Foo.class);
    Type barType = method.getGenericReturnType();
    ```


### Custom Object Mapper

Infinitic allows you to customize the Jackson ObjectMapper used for serialization and deserialization. This feature is useful when you need to adjust serialization behavior to match your specific requirements. Here's how to implement a custom ObjectMapper:

```java
import io.infinitic.serDe.java.Json;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.MapperFeature;

// Retrieve the current ObjectMapper
ObjectMapper customMapper = Json.getMapper();

// Configure the ObjectMapper as needed
customMapper.configure(MapperFeature.ACCEPT_CASE_INSENSITIVE_PROPERTIES, true);

// Add more configurations as required
// customMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
// customMapper.registerModule(new JavaTimeModule());

// Set the customized ObjectMapper for Infinitic to use
Json.setMapper(customMapper);

// Now, initialize your Infinitic client or worker
```

Key points:
- Always start with Json.getMapper() to ensure you're building upon Infinitic's base configuration.
- Apply your custom configurations to this ObjectMapper instance.
- Set the customized ObjectMapper using Json.setMapper() before initializing Infinitic clients or workers.
- This customization affects all subsequent serialization/deserialization within Infinitic.
- Ensure it is used consistently in both clients and workers
- Ensure it is used consistently with existing messages


### JsonView Support

Since version 0.15.0, Infinitic supports Jackson's `@JsonView` annotation, which helps refine object serialization.

#### Service Interface

In Infinitic, interfaces serve as contracts for remote services:

```java
import com.fasterxml.jackson.annotation.JsonView;

public interface UserService {
    
    @JsonView(View.R1.class)
    User getUser(@JsonView(View.P1.class) Request request);
}
```

- the `request` object (parameter of the RPC call) is serialized using the `View.P1.class` Jackson view.
- the `user` object (response of the RPC call) is *deserialized* using the `View.R1.class` view.

#### Service Implementation

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

public interface UserWorkflow {

    @JsonView(View.R1.class)
    Status welcome(@JsonView(View.P1.class) Registration registration);
}
```
 
- the `registration` object (parameter of the RPC call) is serialized using the `View.P1.class` Jackson view.
- the `status` object (response of the RPC call) is *deserialized* using the `View.R1.class` view.

#### Workflow Implementation

In Workflow workers where the actual implementation runs:

```java
import io.infinitic.annotations.Name;

import com.fasterxml.jackson.annotation.JsonView;
import hello.world.services.HelloService;
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

## Kotlin Serialization


For Kotlin, we recommend using [kotlinx-serialization](https://github.com/Kotlin/kotlinx.serialization/blob/master/docs/serialization-guide.md), a native serialization library developed by JetBrains.

To use `kotlinx.serialization` in your Infinitic project:

* Add the `kotlinx.serialization` plugin to your build script.
* Apply the `@Serializable` annotation to your data classes.

See the [Kotlin documentation](https://kotlinlang.org/docs/serialization.html) for more details.

{% callout type="warning"  %}

If `kotlinx.serialization` is not used (i.e., your classes don't have a built-in Kotlin serializer), Infinitic will fall back to  [FasterXML/jackson](/docs/references/serialization#java-serialization) for serialization/deserialization, as it does for Java. In this case, the guidelines below do not apply.

{% /callout  %}

### Serialization Testing

To verify if `Foo` is properly serializable, use the following test pattern with `foo` being an instance of `Foo` (the same applies for `Bar`) :

```kotlin
import kotlinx.serialization.serializer
import kotlinx.serialization.json.Json
import kotlin.reflect.typeOf
...
// Get Json Kotlin serializer
val json = Json
// Get Foo serializer
val serializer = serializer(typeOf<Foo>())
// string representation of the foo object
val jsonStr = json.encodeToString(serializer, foo)
// deserialize json to Foo 
val foo2 = json.decodeFromString(serializer, jsonStr)
// checking everything is ok
require(foo2 == foo)
```

### Handling Different Types

1. Concrete Classes: The easiest way is to use [data classes](https://kotlinlang.org/docs/reference/data-classes.html) with a `kotlinx.serialization.Serializable` annotation. For example :

    ```kotlin
    import kotlinx.serialization.Serializable

    @Serializable
    data class Foo(
    ```

2. Hierarchical Classes: If `Foo` is an open class, the easiest way to use a `sealed class`:
    ```kotlin
    import kotlinx.serialization.Serializable

    @Serializable
    sealed class Foo(
    ```
    {% callout type="note"  %}

    If `Foo` is not sealed, you need to provide the polymorphic info to the serializer. 
    
    {% /callout  %}
    
    For example if `Foo` is not sealed and only has 2 subclasses `FooA` and `FooB`:

    ```kotlin
    import io.infinitic.serDe.kotlin.json
    import kotlinx.serialization.json.Json
    import kotlinx.serialization.modules.SerializersModule
    ...
    // set a custom Json serializer
    json = Json {
        serializersModule = SerializersModule {
            polymorphic(Foo::class, FooA::class, FooA.serializer())
            polymorphic(Foo::class, FooB::class, FooB.serializer())
        }
    }
    ```

3. Interfaces: If `Foo` is an interface, the easiest way to use a `sealed interface`:

    ```kotlin
    import kotlinx.serialization.Serializable

    @Serializable
    sealed interface Foo {
    ```

    {% callout type="note"  %}

    If `Foo` is not sealed, you need to provide the polymorphic info to the serializer. 

    {% /callout  %}
    
    For example, if `Foo` is not sealed and only implemented by classes `FooA` and `FooB`:

    ```kotlin
    import io.infinitic.serDe.kotlin.json
    import kotlinx.serialization.json.Json
    import kotlinx.serialization.modules.SerializersModule
    ...
    // set a custom Json serializer
    json = Json {
        serializersModule = SerializersModule {
            polymorphic(Foo::class, FooA::class, FooA.serializer())
            polymorphic(Foo::class, FooB::class, FooB.serializer())
        }
    }
    ```

     

4. Complex Types: If `Foo` is a complex type (e.g., collections, arrays, maps), it should be serializable as soon as its components are serializable using Kotlin serializer. 

### Custom Json Serializer

Infinitic allows you to customize the `io.infinitic.serDe.kotlin.json` object used for serialization and deserialization. This feature is useful when you need to adjust serialization behavior to match your specific requirements, for example to add polymorphic info as described above. Here's how to implement a custom one:

```kotlin
import io.infinitic.serDe.kotlin.json
import kotlinx.serialization.json.Json
...
// set a custom Json serializer
json = Json {
  classDiscriminator = "#klass"
  ignoreUnknownKeys = true
}
// Now, initialize your Infinitic client or worker
```

Key points:
- Mutate the property `io.infinitic.serDe.kotlin.json` before initializing Infinitic clients or workers.
- This customization affects all subsequent serialization/deserialization operations within Infinitic.
- Ensure it is used consistently in both clients and workers
- Ensure it is used consistently with existing messages
