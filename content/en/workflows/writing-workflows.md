---
title: Writing Workflows
description: ""
position: 5.2
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

A workflow is described by a class extending `io.infinitic.workflows.Workflow`.

<alert type="warning">

Workflow's class must extend `io.infinitic.workflows.Workflow`.

</alert>

This class must follow a few constraints described below.

## Constraints

When we dispatch a workflow, the method's parameters are serialized to be transported by Pulsar up to the [workflow executors](references/architecture). There, they will be deserialized to execute the method. Finally, the return value will be serialized and sent back to Pulsar. For this reason:

<alert type="warning">

Workflow's class must be public and have an empty constructor.

</alert>

<alert type="warning">

Workflow's methods parameters and return value must be <nuxt-link to="/workflows/serializability"> serializable and deserializable</nuxt-link>

</alert>

Here are an example of workflow implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group><code-block label="Java" active>

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
</code-block><code-block label="Kotlin">

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
</code-block></code-group>

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

**Those actions can and must be done in tasks**.

</alert>

We likely have the issue above if we encounter a `WorkflowUpdatedWhileRunning` exception without updating the workflow implementation.

</alert>

And finally

<alert type="warning">

We must avoid infinite loop, as it increases the history size of the workflow indefinitely.

</alert>

## Functions

The `Workflow` abstract class provides functions that we can use to code our workflows:

- [`newTask`](#newTask)
- [`newWorkflow`](#newWorkflow)
- [`inline`](#inline)
- [`async`](#async)
- [`timer`](#timer)

### `newTask`

When applied on a task interface, this function provides a [stub](https://en.wikipedia.org/wiki/Method_stub) for this task:

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

### `newWorkflow`

The `newWorkflow` function behaves as the `newTask` function but dispatches a (sub)workflow, instead of a task. When the (sub)workflow completes, the return value is sent back to the parent workflow.

The illustration below illustrates this, with a workflow of 3 sequential tasks:

<img src="/workflow-function@2x.png" class="img" width="640" height="640" alt=""/>

For example, a distributed (and inefficient) way to calculate `n!` is shown below, using n workflows, each of them - excepted the last one - dispatching a child-workflow.

<code-group><code-block label="Java" active>

```java
public class Calculate extends Workflow implements CalculateInterface {
    private final Calculate calculate = newWorkflow(CalculateInterface.class);

    @Override
    public Long factorial(Long n) {
        if (n > 1) {
          return n * calculate.factorial(n - 1);
        }
        return 1;
    }
}
```

</code-block> <code-block label="Kotlin">

```kotlin
class Calculate() : Workflow(), CalculateInterface {
    private val calculate = workflow<CalculateInterface>()

    override fun factorial(n: Long) = when {
        n > 1 -> n * workflow.factorial(n - 1)
        else -> 1
    }
}
```

</code-block></code-group>

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

A `Deferred` has some useful methods:

- `await()`: waits for the completion (or cancellation) of the deferred and returns its result
- `isCompleted()`: boolean indicating if this `Deferred` is completed by now
- `isCanceled()`: boolean indicating if this `Deferred` is canceled by now
- `isOngoing()`: boolean indicating if this `Deferred` is still ongoing

For example:

<code-group><code-block label="Java" active>

```java
task.a1();

Deferred<String> deferred = async(() -> {
    task.b1();
    return task.b2();
});

task.a2();

if (deferred.isOngoing()) {
    task.a3();
}

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

if (deferred.isOngoing()) {
    task.a3()
}

val o = deferred.await()

task.a4(o);

```

</code-block></code-group>

<img src="/async-example-2@2x.png" class="img" width="640" height="640" alt=""/>

### `timer`

The `timer` function lets us suspend the execution of a workflow for a duration or up to a chosen date:

<code-group><code-block label="Java" active>

```java
...
Instant now = timer(Duration.ofHours(48)).await()
...
```

</code-block><code-block label="Kotlin">

```kotlin
...
val now = timer(Duration.ofHours(48)).await()
...
```

</code-block></code-group>

<img src="/timer-function@2x.png" class="img" width="640" height="640" alt=""/>

<alert type="info">

No resource dedicated to this workflow is kept running during this waiting time.

</alert>

The `timer` function can receive:

- a `java.time.Duration` object for waiting for a specific duration (for example, 2 days)
- a `java.time.Instant` object for waiting up to a specific instant (for example, the 3rd of April 2021 at 9 pm). The time must be provided according to UTC.

<alert type="warning">

If the provided duration is negative or the provided Instant is in the past, the `await()` method returns immediately.

</alert>

The `timer` function immediately starts and returns a `Deferred<Instant>`. The workflow is blocked only by the `await()` method. In the example below, if the `sayHello` method lasts for 40 seconds, then the `wait` method will last for 20 seconds.

<code-group><code-block label="Java" active>

```java
Deferred<Instant> timer = timer(Duration.ofSeconds(60));

helloWorldService.sayHello(name);

Instant now = timer.await();
```

</code-block><code-block label="Kotlin">

```kotlin
val timer = timer(Duration.ofHours(48))

helloWorldService.sayHello(name)

val now = timer.await()
```

</code-block></code-group>

<img src="/timer-example@2x.png" class="img" width="640" height="640" alt=""/>

The result of the `await()` method is an Instant object representing the moment this timer was completed according to the workflow engine (so when the workflow resumes from the `await()`, the `Instant` returned is the current time).

### `channel`

Channels introduce a way to send "events" (any serializable object actually) to a running workflow from the "outside." A typical use of Channels is to wait for human actions, such as opening an email.

In the Client section, we have described [how to send events](/clients/managing-workflows#send-an-object-to-a-running-workflow) to a running workflow. Here, we will describe how to handle them.

<alert type="info">

In the examples below, `Channel<String>` is used as an example. But `Channel` supports any [serializable](tasks/serializability) type, not only String.

</alert>

#### Channel definition

To use a channel, just add it to the workflow interface using the `channel` workflow's method. For example,

<code-group><code-block label="Java" active>

```java
public interface HelloWorld {
    SendChannel<String> getNotificationChannel();

    ...
}
```

</code-block><code-block label="Kotlin">

```kotlin
interface HelloWorld {
    val notificationChannel: SendChannel<String>

    ...
}
```

</code-block></code-group>

And in our workflow implementation:

<code-group><code-block label="Java" active>

```java
public class HelloWorldImpl extends Workflow implements HelloWorld {
    final Channel<String> notificationChannel = channel();

    @Override
    public Channel<String> getNotificationChannel() {
        return notificationChannel;
    }

   ...
}
```

</code-block><code-block label="Kotlin">

```kotlin
class HelloWorldImpl : Workflow(), HelloWorld {
    val notificationChannel = channel<String>()

    ...
}
```

</code-block></code-group>

#### Channel usage

We receive only the events that we are waiting for. Per default, events sent to a workflow are discarded. To receive an event, we need to explicitly ask for it, using the `receive` method:

<code-group><code-block label="Java" active>

```java
...
Deferred<String> deferred = getNotificationChannel().receive();
...
```

</code-block><code-block label="Kotlin">

```kotlin
...
val result: Deferred<String> = notificationChannel.receive()
...
```

</code-block></code-group>

All events sent to the workflow before it reaches the above line will be discarded. The first event sent to the workflow after it reaches this line will be caught. The following events will be rejected unless the receive method is used again.

As all `Deferred` we use the `await()` method if we want to pause the workflow up to actually receiving an event:

<img src="/channel-function@2x.png" class="img" width="640" height="640" alt=""/>

Once received, the workflow will resume and the `result` variable will contain "success" in the above example.

If we do not care when an event has been received but only if it was received, then we can apply the `receive` method earlier, for example at workflow start:

<code-group><code-block label="Java" active>

```java
Deferred<String> deferredNotification = getNotificationChannel().receive();
...
String result = deferredNotification.await();
```

</code-block><code-block label="Kotlin">

```kotlin
val deferredNotification: Deferred<String> = notificationChannel.receive()
...
val result: String = deferredNotification.await()
```

</code-block></code-group>

<img src="/deferred-channel-function@2x.png" class="img" width="640" height="640" alt=""/>

The first String received during the period represented by the brace will be the `await()` method result.

#### Filtering events by type

Let's say we have a `Channel<Event>` channel receiving objects of type `Event`. If we want our workflow to wait only for a sub-type `ValidationEvent`:

<code-group><code-block label="Java" active>

```java
Deferred<ValidationEvent> deferred = getEventChannel().receive(ValidationEvent.class);
```

</code-block><code-block label="Kotlin">

```kotlin
val deferred: Deferred<ValidationEvent> = eventChannel.receive(ValidationEvent::class)
```

</code-block></code-group>

#### Filtering events by attributes

If we want our workflow to wait only for an `Event` with specific attributes, we can write a requirement using a [JSONPath predicate](https://github.com/json-path/JsonPath#predicates) that will be applied on the serialized event. For example, if we want to receive an `Event` with a specific `ef20b7a9-849b-41f8-89e9-9c5492efb098` userId, we can do:

<code-group><code-block label="Java" active>

```java
Deferred<Event> deferred =
    getEventChannel().receive("[?(\$.userId == \"ef20b7a9-849b-41f8-89e9-9c5492efb098\")]");
```

</code-block><code-block label="Kotlin">

```kotlin
val deferred: Deferred<Event> =
    eventChannel.receive("[?(\$.userId == \"ef20b7a9-849b-41f8-89e9-9c5492efb098\")]")
```

</code-block></code-group>

or using a [filter predicate](https://github.com/json-path/JsonPath#filter-predicates) (after adding `com.jayway.jsonpath:json-path:2.5.0` to our project)

<code-group><code-block label="Java" active>

```java
Deferred<Event> deferred =
    getEventChannel().receive("[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"));
```

</code-block><code-block label="Kotlin">

```kotlin
val deferred: Deferred<Event> =
    eventChannel.receive("[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"))
```

</code-block></code-group>

#### Filtering events by type and attributes

At last, if we want to receive an event having both a specific type and specific attributes:

<code-group><code-block label="Java" active>

```java
Deferred<ValidationEvent> deferred =
    getEventChannel().receive(ValidationEvent.class, "[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"));
```

</code-block><code-block label="Kotlin">

```kotlin
val deferred: Deferred<ValidationEvent> =
    eventChannel.receive(ValidationEvent::class, "[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"))
```

</code-block></code-group>

#### Unit testing predicates

In our unit tests, we would like to check if an `event` is correctly filtered by a JSONPath predicate - below is an example of statements that should be true if `event` has the right `userId`:

<code-group><code-block label="Java" active>

```java
import io.infinitic.common.workflows.data.channels.ChannelEventFilter;
import io.infinitic.common.workflows.data.channels.ChannelEvent;
import com.jayway.jsonpath.Criteria.where;
...

ChannelEventFilter
  .from("[?(\$.userId == \"ef20b7a9-849b-41f8-89e9-9c5492efb098\")]")
  .check(ChannelEvent.from(event));

// or

ChannelEventFilter
  .from("[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"))
  .check(ChannelEvent.from(event));
```

</code-block><code-block label="Kotlin">

```kotlin
import io.infinitic.common.workflows.data.channels.ChannelEventFilter
import io.infinitic.common.workflows.data.channels.ChannelEvent
import com.jayway.jsonpath.Criteria.where
...

ChannelEventFilter
  .from("[?(\$.userId == \"ef20b7a9-849b-41f8-89e9-9c5492efb098\")]")
  .check(ChannelEvent.from(event))

// or

ChannelEventFilter
  .from("[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"))
  .check(ChannelEvent.from(event))
```

</code-block></code-group>
