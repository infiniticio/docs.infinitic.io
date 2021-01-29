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

The information needed to dispatch a workflow are:
- a class name
- a method name
- the parameters of the method

To ensure that a client (or a parent workflow) provides the right number and type of parameters, it's convenient for clients (and parent workflow) to use the interface of the workflows they dispatch.

<alert type="warning">

Workflow interface must extend `io.infinitic.workflows.Workflow`

</alert>

Here is an example of workflow interface from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

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

When a workflow is dispatched, the values of the method's parameters are serialized to be transported by Pulsar up to the [workflow executors](references/architecture). There, they will be deserialized to execute the method. Finally, the return value will be serialized and sent back to Pulsar. For this reason:

<alert type="warning">

Workflow's methods parameters and return value must be <nuxt-link to="/workflows/serializability"> serializable and deserializable</nuxt-link>

</alert>

If the method's parameters and return value are primitives - as in the example above (String) - then you can't have serialization issue.

## Workflow Implementation

The role of [workflow executor](references/architecture) is to process a [workflowTask](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c): a special task that uses both the workflow implementation and the workflow history to discover what has to be done next for a workflow instance.

So when a workflow executor receives:
- a class name
- a method name and its serialized parameters,
- data related to workflow history

it instantiates the class from its name, inject the history in the workflow instance, deserializes the parameters, and executes the method with them.

<alert type="warning">

Workflow's class must be public and have an empty constructor.

</alert>

<alert type="warning">

Workflow's class must extend `io.infinitic.workflows.AbstractWorkflow`.

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

    String println(String msg) {
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

Because workflows are processed multiple times (see `task` below), they must implement only a logical flow. In particular:

<alert type="warning">

Workflows must NOT contain any action with side-effects or potentially changing values, such as:
- database request
- file access 
- API call
- use of environment variables 
- use of the current date
- use of random values 
- use of Thread or any asynchronous coding style
Those actions belong to tasks, where they are perfectly fine.

</alert>

Moreover, you should avoid also:
- infinite loop, as it increases the history size of the workflow indefinitely
- `try / catch`, as it is useless (remember that tasks are processed elsewhere) 


## Workflow Functions

`AbstractWorkflow` provides a few  functions, useful to implement the logic of our workflows: 
- `task`
- `workflow`
- `inline`
- `async`

### `task` proxy
When applied on a task interface, this function provides a proxy for this task. Syntaxicly, this proxy can be use as an implementation of the task. Functionally, this proxy dispatches the task or provides its return value, depending on the current workflow history. 

For example, let's consider this line (from the `greet` method of `HelloWorldImpl` above).

<code-group>
  <code-block label="Java" active>

```java
String str = helloWorldService.sayHello(name);
```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
val str = helloWorldService.sayHello(name)
```

  </code-block>
</code-group>

Here `helloWorldService` is a proxy based on `HelloWorldService` interface. When a workflow executor processes  the `greet` method and reach this line for the first time, it will dispatches a `HelloWorldService::sayHello` task and stop its execution there.

After completion of this task, a workflow executor will process the `greet` method again, but with an updated workflow history. When reaching this line, the proxy will - this time - provide the deserialized return value of the task and the `greet` method will continue its execution. 

And so on. As we can guess now, the code below will guarantee that `sayHello` and `addEnthusiasm` tasks are processed sequentially, the second using the return value of the first one.

<code-group>
  <code-block label="Java" active>

```java
String str = helloWorldService.sayHello(name);
String greeting =  helloWorldService.addEnthusiasm(str);
```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
val str = helloWorldService.sayHello(name)
val greeting =  helloWorldService.addEnthusiasm(str)
```

  </code-block>
</code-group>

### `workflow` proxy
The `workflow` function behaves as the `task` function, but will dispatch a (sub)workflow, instead of a task. When the (sub)workflow completes, the return value is returned to the parent workflow.

### `inline` 

As stated above, being processed multiple times, workflows must NOT contain any action with side-effects or potentially changing values. In some cases, it can be tedious to write a task for a straightforward action, such as getting a random number or the current date.

The `inline` function provides an easy way to "inline" such a task. The provided lambda is processed by the workflow executor only the first time the instruction is reached. Another time, the returned value will be found directly from the workflow history.


<alert type="info">

There is no retry mechanism for inlined tasks, so the `inline` function should be used only if the lambda can not fail.

</alert>

Example of use to manipulate the current date in a workflow:

<code-group><code-block label="Java" active>

```java
Date now = inline(() -> new Date());
```

</code-block><code-block label="Kotlin">

```kotlin
val now = inline { Date() }
```
</code-block></code-group>

### `async`

The `async` function provides a way to have asynchronous branches within your workflow.