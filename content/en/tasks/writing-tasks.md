---
title: Writing Tasks
description: ""
position: 2.1
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/concept-tasks@2x.png" class="img" width="1280" height="640" alt=""/>

## Task Interface

The information needed to dispatch a task are:
- a class name
- a method name
- the parameters of the method

To ensure that a client (or a workflow) provides the right number and type of parameters, it's convenient for clients (and workflow) to use the interface of the tasks they dispatch.

Here is an example of task interface from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group>
  <code-block label="Java" active>

```java
public interface HelloWorldService {
    String sayHello(String name);

    String addEnthusiasm(String str);
}
```

  </code-block>
  
  <code-block label="Kotlin">

```kotlin
interface HelloWorldService {
    fun sayHello(name: String?): String

    fun addEnthusiasm(str: String): String
}
```

  </code-block>
</code-group>

An Infinitic client can dispatch a task using this interface:

<code-group>
  <code-block label="Java" active>

```java
// first create a stub from the HelloWorldService interface
HelloWorldService helloWorldService = infiniticClient.task(HelloWorldService.class);

// then use this stub to dispatch the desired task
String id = infiniticClient.async(helloWorldService, t -> t.sayHello("Infinitic"));
```
  </code-block>
  
  <code-block label="Kotlin">

```kotlin
// first create a stub from the HelloWorldService interface
val helloWorldService = infiniticClient.task<HelloWorldService>()

// then use this stub to dispatch the desired task
val id = infiniticClient.async(helloWorldService) { sayHello("Infinitic") }
```

  </code-block>
</code-group>

When a task is dispatched, the values of the method's parameters are serialized to be transported by Pulsar up to the [task executors](references/architecture). There, they will be deserialized to execute the method and the return value will be serialized and sent back to Pulsar. For this reason:

<alert type="warning">

Task's methods parameters and return value must be <nuxt-link to="/tasks/serializability"> serializable and deserializable</nuxt-link>

</alert>

If method's parameters and return value are primitives - as in the exemple above (String) - then you can't have serialization issue. 

## Task Implementation

When a [task executor](references/architecture) receives the data to run a task:
- a class name
- a method name
- the serialized parameters of the method

it instantiates the class from its name, deserializes the parameters, and executes the method with them.

<alert type="warning">

Task's class must be public and have an empty constructor.

</alert>

Here is an example of task implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group>
  <code-block label="Java" active>

```java
public class HelloWorldServiceImpl implements HelloWorldService {
    @Override
    public String sayHello(String name) {
        return "Hello " + ((name == null) ? "World" : name);
    }

    @Override
    public String addEnthusiasm(String str) {
        return str + "!";
    }
}
```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
class HelloWorldServiceImpl : HelloWorldService {
    override fun sayHello(name: String?) = "Hello ${name ?: "World"}"

    override fun addEnthusiasm(str: String) = "$str!"
}
```

  </code-block>
</code-group>
