---
title: Sequential Tasks
description: ""
---

For infinitic, a [task](/docs/services/syntax) is basically the method of a class. The implementation of this class is only needed in [workers](/docs/services/workers) where the task is actually processed.

Within workflows, we should know only the interface of the class, used by the `newService` workflow function to create a [stub](https://en.wikipedia.org/wiki/Method_stub). Syntactically, this stub can be used as an implementation of the task:

{% codes %}

```java
public class HelloWorldImpl extends Workflow implements HelloWorld {
    // create a stub for the HelloWorldService
    private final HelloWorldService helloWorldService = newService(HelloWorldService.class);

    @Override
    public String greet(String name) {
        // synchronous call of HelloWorldService::sayHello
        String str = helloWorldService.sayHello(name);

        // synchronous call of HelloWorldService::addEnthusiasm
        String greeting =  helloWorldService.addEnthusiasm(str);

        // inline task to display the result
        inlineVoid(() -> System.out.println(greeting));

        return greeting;
    }
}
```

```kotlin
class HelloWorldImpl : Workflow(), HelloWorld {
    // create a stub for the HelloWorldService
    private val helloWorldService = newService(HelloWorldService::class.java)

    override fun greet(name: String): String {
        // synchronous call of HelloWorldService::sayHello
        val str = helloWorldService.sayHello(name)

        // synchronous call of HelloWorldService::addEnthusiasm
        val greeting =  helloWorldService.addEnthusiasm(str)

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

For example, let's consider this line (from the `HelloWorldImpl` workflow above).

{% codes %}

```java
String str = helloWorldService.sayHello(name);
```

```kotlin
val str = helloWorldService.sayHello(name)
```

{% /codes %}

Here `helloWorldService` is a stub of the `HelloWorldService` interface. When a workflow worker processes the workflow and reaches this line for the first time, it will dispatch a `HelloWorldService::sayHello` task and stop its execution here.

After completion of this task, a workflow worker will process the workflow again, but with an updated workflow history. When reaching this line, the stub will - this time - provide the deserialized return value of the task, and the workflow will continue its execution.

And so on.

As we can guess now, the code below will guarantee that `sayHello` and `addEnthusiasm` tasks are processed sequentially, the second task using the return value of the first one.

{% codes %}

```java
String str = helloWorldService.sayHello(name);
String greeting =  helloWorldService.addEnthusiasm(str);
```

```kotlin
val str = helloWorldService.sayHello(name)
val greeting =  helloWorldService.addEnthusiasm(str)
```

{% /codes %}

![Hello World](/img/hello-world@2x.png)
