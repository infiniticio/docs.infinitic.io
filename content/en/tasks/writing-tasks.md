---
title: Writing Tasks
description: ""
position: 4.2
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

When receiving the data to run a task, a task executor instantiates the class from its name, deserializes the parameters, and executes the method with them. So the requirements on tasks are the following:

<alert type="warning">

Task's class must be public and have an empty constructor.

</alert>

<alert type="warning">

Task's methods parameters and return value must be <nuxt-link to="/tasks/serializability"> serializable and deserializable</nuxt-link>

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
