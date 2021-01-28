---
title: Writing Workflows
description: ""
position: 3.1
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

<img src="/concept-workflows@2x.png" class="img" width="1280" height="640" alt=""/>

## Workflow Interface

When a client (or a parent workflow) dispatches a workflow, the information sent is:
- a class name
- a method name and its serialized parameters.

This entirely describes the workflow to execute. That's why a client (or a parent workflow) only uses interfaces and does not need to know an actual implementation.

<alert type="warning">

Workflow parameters and return value must be <nuxt-link to="/workflows/serializability"> serializable/deserializable</nuxt-link>

</alert>

<alert type="warning">

Workflow interface must extend `io.infinitic.workflows.Workflow`

</alert>

Here is an example of interface (from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app) describing the signatures of a workflow:

<code-group>
  <code-block label="Java" active>

```java
import io.infinitic.workflows.Workflow;
import javax.annotation.Nullable;

public interface HelloWorld extends Workflow {
    String greet(@Nullable String name);
}
```

  </code-block>
  
  <code-block label="Kotlin">

```kotlin
import io.infinitic.workflows.Workflow

interface HelloWorld : Workflow {
    fun greet(name: String?): String
}
```

  </code-block>
</code-group>

Above, the only parameter and the return value is a primitive (String), so they are <nuxt-link to="/workflows/serializability">serializable/deserializable</nuxt-link>. 

An Infinitic client can dispatch a workflow using this interface:

<code-group>
  <code-block label="Java" active>

```java
infiniticClient.startWorkflowAsync(
    HelloWorld.class,
    t -> t.greet("Infinitic")
);
```

  </code-block>
  
  <code-block label="Kotlin">

```kotlin
infiniticClient.startWorkflow<HelloWorld> { greet("Infinitic") }
```

  </code-block>
</code-group>

## Workflow Implementation

The role of [workflow executor](references/architecture) is to process a [workflowTask](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c), a special task that uses both the workflow implementation and the workflow history to discover what has to be done next for a workflow instance.

So a workflow executor will receive:
- a class name
- a method name and its serialized parameters,
- data related to workflow history

It will instantiate the class registered with this name, inject the history in the workflow instance, deserializes the parameters, and executes the method with them.

<alert type="warning">

Class containing workflows must be public and have an empty constructor.

</alert>

<alert type="warning">

Class containing workflows must extend `io.infinitic.workflows.AbstractWorkflow`.

</alert>

Here are an example of workflow implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group>
  <code-block label="Java" active>

```java
import hello.world.tasks.HelloWorldService;
import io.infinitic.workflows.AbstractWorkflow;

public class HelloWorldImpl extends AbstractWorkflow implements HelloWorld {
    private final HelloWorldService helloWorldService = task(HelloWorldService.class);

    @Override
    public String greet(String name) {
        String str = helloWorldService.sayHello(name);
        String greeting =  helloWorldService.addEnthusiasm(str);
        inline(() -> println(greeting));

        return greeting;
    }

    Object println(String msg) {
        System.out.println(msg);

        return null;
    }
}

```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
import hello.world.tasks.HelloWorldService
import io.infinitic.workflows.AbstractWorkflow
import io.infinitic.workflows.task

class HelloWorldImpl : AbstractWorkflow(), HelloWorld {
    private val helloWorldService = task<HelloWorldService>()

    override fun greet(name: String?): String {
        val str = helloWorldService.sayHello(name)
        val greeting =  helloWorldService.addEnthusiasm(str)
        inline { println(greeting) }

        return  greeting
    }
}
```

  </code-block>
</code-group>

