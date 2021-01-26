---
title: Writing Tasks
description: ""
position: 2.1
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/concept-introduction.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/concept-introduction.png" class="dark-img" width="1280" height="640" alt=""/>

## Task Interface

When a client (or a workflow) dispatches a task, the information sent is:
- a class name
- a method name and its serialized parameters.

This entirely describes the task to execute. That's why a client (or a workflow) only uses interfaces (and does not need to know any actual implementation).

<alert type="warning">

Task parameters and return value must be <nuxt-link to="/tasks/serializability"> serializable/deserializable</nuxt-link>

</alert>

Here is an example of interface (from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app) describing the signatures of two tasks:

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

For both tasks, the only parameter and the return value is a primitive (String), so they are <nuxt-link to="/tasks/serializability">serializable/deserializable</nuxt-link>. 

An Infinitic client can dispatch a task using this interface:

<code-group>
  <code-block label="Java" active>

```java
infiniticClient.startTaskAsync(
    HelloWorldService.class,
    t -> t.sayHello("Infinitic")
);
```

  </code-block>
  
  <code-block label="Kotlin">

```kotlin
infiniticClient.startTask<HelloWorldService> { sayHello("Infinitic" }
```

  </code-block>
</code-group>

## Task Implementation

When a [task executor](references/architecture) receives the instruction to run a task:
- a class name
- a method name and its serialized parameters.

It instantiates the class registered with this name, deserializes the parameters, and executes the method with them.

<alert type="warning">

Class containing tasks must be public and have an empty constructor.

</alert>

Here are two examples of task implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group>
  <code-block label="Java" active>

```kotlin
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
