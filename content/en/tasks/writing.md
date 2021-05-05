---
title: Writing Tasks
description: ""
position: 5.1
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

A task is a Java/Kotlin class that:

<alert type="warning">

- must extend `io.infinitic.tasks.Task` abstract class
- must have an empty constructor
- have [serializable](/references/serializability) methods parameters and return value
- must be thread-safe

</alert>

Beside that, it can contains arbitrary code. The `Task` abstract class is very simple, it contains only:

- a [context](/tasks/context) variable (maintained by Infinitic),
- a `getDurationBeforeRetry` method, we can overide to describe how the task will react in case of [failure](/tasks/failure)

The other constraints are implied by the execution process: when receiving instructions to run a task, a task worker uses the empty constructor to instantiate the class, deserializes the parameters, executes the requested method and returns the serialized result. The class must be thread-safe to be run in parallel if we chose to.    


Here is an example of task implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group><code-block label="Java" active>

```java
import io.infinitic.tasks.Task;

public class HelloWorldServiceImpl extends Task implements HelloWorldService {
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
</code-block><code-block label="Kotlin">

```kotlin
import io.infinitic.tasks.Task

class HelloWorldServiceImpl: Task(), HelloWorldService {
    override fun sayHello(name: String) = "Hello $name"

    override fun addEnthusiasm(str: String) = "$str!"
}
```
</code-block></code-group>
