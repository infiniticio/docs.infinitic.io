---
title: Sequential Tasks
description: ""
position: 4.2
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

A workflow only need to know tasks signature. it uses an internal `newTask` function to create a [stub](https://en.wikipedia.org/wiki/Method_stub) from the task interface:

<code-group><code-block label="Java" active>

```java
public class HelloWorldImpl extends Workflow implements HelloWorld {
    private final HelloWorldService helloWorldService = newTask(HelloWorldService.class);

    @Override
    public String greet(String name) {
        String str = helloWorldService.sayHello(name);
        String greeting =  helloWorldService.addEnthusiasm(str);
        inline(() -> { System.out.println(greeting); return null; });

        return greeting;
    }
}
```

</code-block> <code-block label="Kotlin">

```kotlin
class HelloWorldImpl : Workflow(), HelloWorld {
    private val helloWorldService = newTask<HelloWorldService>()

    override fun greet(name: String): String {
        val str = helloWorldService.sayHello(name)
        val greeting =  helloWorldService.addEnthusiasm(str)
        inline { println(greeting) }

        return  greeting
    }
}
```

</code-block></code-group>

Syntaxicly, this stub can be used as an implementation of the task. Functionally, this stub dispatches the task or provides its return value, depending on the current workflow history. For example, let's consider this line (from the `HelloWorldImpl` workflow above).

<code-group><code-block label="Java" active>

```java
String str = helloWorldService.sayHello(name);
```

</code-block> <code-block label="Kotlin">

```kotlin
val str = helloWorldService.sayHello(name)
```

</code-block></code-group>

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
