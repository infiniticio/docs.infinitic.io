---
title: Writing Workflows
description: ""
position: 4.2
category: "Workflow Executor"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>


When a workflow is dispatched, the values of the method's parameters are serialized to be transported by Pulsar up to the [workflow executors](references/architecture). There, they will be deserialized to execute the method. Finally, the return value will be serialized and sent back to Pulsar. For this reason:

<alert type="warning">

Workflow's class must be public and have an empty constructor.

</alert>

<alert type="warning">

Workflow's methods parameters and return value must be <nuxt-link to="/workflows/serializability"> serializable and deserializable</nuxt-link>

</alert>

Moreover,

<alert type="warning">

Workflow's class must extend `io.infinitic.workflows.Workflow`.

</alert>

Here are an example of workflow implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group>
  <code-block label="Java" active>

```java
import hello.world.tasks.HelloWorldService;
import io.infinitic.workflows.Workflow;

public class HelloWorldImpl extends Workflow implements HelloWorld {
    private final HelloWorldService helloWorldService = task(HelloWorldService.class);

    @Override
    public String greet(String name) {
        String str = helloWorldService.sayHello(name);
        String greeting =  helloWorldService.addEnthusiasm(str);
        inline(() -> { System.out.println(greeting); return null; });

        return greeting;
    }
}
```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
import hello.world.tasks.HelloWorldService
import io.infinitic.workflows.Workflow
import io.infinitic.workflows.task

class HelloWorldImpl : Workflow(), HelloWorld {
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

**Those actions belong to tasks**, where they are perfectly fine.

</alert>

If we encounter a `WorkflowUpdatedWhileRunning` exception, without having updated the workflow implementation, it's very likely that we have the issue above.

</alert>

You should avoid also infinite loop, as it increases the history size of the workflow indefinitely.

## Workflow Functions

`Workflow` provides a few functions, useful to implement the logic of our workflows:

- `task`
- `workflow`
- `inline`
- `async`

### `task`

When applied on a task interface, this function provides a [stub](https://en.wikipedia.org/wiki/Method_stub) for this task. Syntaxicly, this stub can be used as an implementation of the task. Functionally, this stub dispatches the task or provides its return value, depending on the current workflow history.

For example, let's consider this line (from the `HelloWorldImpl` workflow above).

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

Here `helloWorldService` is a stub of the `HelloWorldService` task. When a workflow executor processes the workflow and reaches this line for the first time, it will dispatch a `HelloWorldService::sayHello` task and stop its execution here.

After completing this task, a workflow executor will process the workflow again, but with an updated workflow history. When reaching this line, the stub will - this time - provide the deserialized return value of the task, and the workflow will continue its execution.

And so on.

As we can guess now, the code below will guarantee that `sayHello` and `addEnthusiasm` tasks are processed sequentially, the second using the return value of the first one.

<code-group><code-block label="Java" active>

```java
String str = helloWorldService.sayHello(name);
String greeting =  helloWorldService.addEnthusiasm(str);
```

</code-block> <code-block label="Kotlin">

```kotlin
val str = helloWorldService.sayHello(name)
val greeting =  helloWorldService.addEnthusiasm(str)
```

</code-block></code-group>

<img src="/hello-world@2x.png" class="img" width="1280" height="640" alt=""/>

### `workflow`

The `workflow` function behaves as the `task` function but dispatches a (sub)workflow, instead of a task. When the (sub)workflow completes, the return value is sent back to the parent workflow.

The illustration below illustrates this, with a workflow of 3 sequential tasks:

<img src="/workflow-function@2x.png" class="img" width="640" height="640" alt=""/>

### `inline`

As stated above, workflow's code is processed repeatedly, so it must NOT contain any action with side-effects or whose value changes with time. When this is the case, we must put those actions within a task. For simple actions (as getting a random number or the current date), it can be tedious to do.

The `inline` function provides an easy way to "inline" such a task. The provided lambda is processed by the workflow executor only the first time. After that, the returned value will be found directly from the workflow history.

<alert type="info">

There is no retry mechanism for inlined tasks, so the `inline` function should be used only if the lambda can not fail.

</alert>

For example, we can use the current date in a workflow like this:

<code-group><code-block label="Java" active>

```java
...
Date now = inline(() -> new Date());
...
```

</code-block><code-block label="Kotlin">

```kotlin
...
val now = inline { Date() }
...
```

</code-block></code-group>

<img src="/inline-function@2x.png" class="img" width="640" height="640" alt=""/>

### `async`

The `async` function provides a way to run some parts of our workflows in parallel. For example:

<code-group><code-block label="Java" active>

```java
task.a1();

async(() -> {
    task.b1();
    return task.b2();
});

task.a2();
task.a3();
```

</code-block><code-block label="Kotlin">

```kotlin
task.a1()

async {
    task.b1()
    task.b2()
}

task.a2()
task.a3()
```

</code-block></code-group>

<img src="/async-example@2x.png" class="img" width="640" height="640" alt=""/>

The return value of a `async` function is a `io.infinitic.workflows.Deferred<T>`, `T` being the type of the return value of the provided lambda.

A `Deferred` has 2 useful methods in a workflow:

- `await()`: waits for the completion (or cancellation) of the deferred and returns its result
- `status()`: gets the current status of the deferred (`ONGOING`, `COMPLETED`, `CANCELED`)

For example:

<code-group><code-block label="Java" active>

```java
task.a1();

Deferred<String> deferred = async(() -> {
    task.b1();
    return task.b2();
});

task.a2();
task.a3();

String o = deferred.await()

task.a4(o);
```

</code-block><code-block label="Kotlin">

```kotlin
task.a1()

val deferred = async {
    task.b1()
    task.b2()
}

task.a2()
task.a3()

val o = deferred.await()

task.a4(o);

```

</code-block></code-group>

<img src="/async-example-2@2x.png" class="img" width="640" height="640" alt=""/>
