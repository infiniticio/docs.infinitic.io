---
title: Sequential Tasks
description: This documentation covers the implementation of sequential tasks within workflows, showcasing how tasks are executed one after another, with practical examples.
---

For infinitic, a [task](/docs/services/syntax) is basically the method of a class. The implementation of this class is only needed in [workers](/docs/services/workers) where the task is actually processed.

Within workflows, we should know only the interface of the class, used by the `newService` workflow function to create a [stub](https://en.wikipedia.org/wiki/Method_stub). Syntactically, this stub can be used as an implementation of the task:

{% codes %}

```java
public class HelloWorkflowImpl extends Workflow implements HelloWorkflow {
    // create a stub for the HelloService
    private final HelloService helloService = newService(HelloService.class);

    @Override
    public String greet(String name) {
        // synchronous call of HelloService::sayHello
        String str = helloService.sayHello(name);

        // synchronous call of HelloService::addEnthusiasm
        String greeting =  helloService.addEnthusiasm(str);

        // inline task to display the result
        inlineVoid(() -> System.out.println(greeting));

        return greeting;
    }
}
```

```kotlin
class HelloWorkflowImpl : Workflow(), HelloWorkflow {
    // create a stub for the HelloService
    private val helloService = newService(HelloService::class.java)

    override fun greet(name: String): String {
        // synchronous call of HelloService::sayHello
        val str = helloService.sayHello(name)

        // synchronous call of HelloService::addEnthusiasm
        val greeting =  helloService.addEnthusiasm(str)

        // inline task to display the result
        inline { println(greeting) }

        return  greeting
    }
}
```

{% /codes %}

Functionally, the stub behave as follows:

- when the return value of the task is not known yet, this stub dispatches a message to Pulsar towards the workers asking for the task execution
- when the return value is known in the workflow history, the stub returns this value.

For example, let's consider this line (from the `HelloWorkflowImpl` workflow above).

{% codes %}

```java
String str = helloService.sayHello(name);
```

```kotlin
val str = helloService.sayHello(name)
```

{% /codes %}

Here `helloService` is a stub of the `HelloService` interface. When a workflow worker processes the workflow and reaches this line for the first time, it will dispatch a `HelloService::sayHello` task and stop its execution here.

After completion of this task, a workflow worker will process the workflow again, but with an updated workflow history. When reaching this line, the stub will - this time - provide the deserialized return value of the task, and the workflow will continue its execution.

And so on.

As we can guess now, the code below will guarantee that `sayHello` and `addEnthusiasm` tasks are processed sequentially, the second task using the return value of the first one.

{% codes %}

```java
String str = helloService.sayHello(name);
String greeting =  helloService.addEnthusiasm(str);
```

```kotlin
val str = helloService.sayHello(name)
val greeting =  helloService.addEnthusiasm(str)
```

{% /codes %}

![Hello World](/img/hello-world@2x.png)
