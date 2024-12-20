---
title: Workflow Implementation
description: This page provides guidelines on the syntax for defining workflows in Infinitic, emphasizing serializable and thread-safe methods, along with instructions for method versioning and error handling.
---
Here is an example of workflow implementation, from our [Hello World app](/docs/introduction/hello-world):

{% codes %}

```java
import hello.world.services.HelloService;
import io.infinitic.workflows.Workflow;

public class HelloWorkflowImpl extends Workflow implements HelloWorkflow {
    // create a stub from HelloService interface
    private final HelloService helloService = newService(HelloService.class);

    @Override
    public String greet(String name) {
        // dispatch HelloService::sayHello task and wait for its completion
        String str = helloService.sayHello(name);

        // dispatch HelloService::addEnthusiasm task and wait for its completion
        String greeting = helloService.addEnthusiasm(str);

        // run an inline task (returning void)
        inlineVoid(() -> System.out.println(greeting));

        // workflow return value
        return greeting;
    }
}
```

```kotlin
import hello.world.services.HelloService
import io.infinitic.workflows.Workflow

class HelloWorkflowImpl : Workflow(), HelloWorkflow {
    // create a stub from HelloService interface
    private val helloService = newService(HelloService::class.java)

    override fun greet(name: String?): String {
        // dispatch HelloService::sayHello task and wait for its completion
        val str = helloService.sayHello(name)

        // dispatch HelloService::addEnthusiasm task and wait for its completion
        val greeting = helloService.addEnthusiasm(str)

        // run an inline task
        inline { println(greeting) }

        // workflow return value
        return  greeting
    }
}
```

{% /codes %}

As we can see above, a workflow is directly coded in plain java/kotlin - but the processing of this workflow is actually event-based, making Infinitic really scalable and error-resilient.

{% callout type="note"  %}

For more detailed explanations, please read [under the hood of a event-driven workflow engine](https://gillesbarbier.medium.com/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c).

{% /callout  %}

The abstract class `io.infinitic.workflows.Workflow` exposes a set of useful functions to:

- [dispatch a new task](/docs/workflows/implementation#dispatch-a-new-task)
- [dispatch a child-workflow](/docs/workflows/implementation#dispatch-a-child-workflow)
- [inline simple task](/docs/workflows/implementation#inline-task)
- [receive signal](/docs/workflows/implementation#receive-signal)
- [manage time](/docs/workflows/implementation#manage-time)
- [interacting with other workflows](/docs/workflows/implementation#interacting-with-other-workflows)

## Constraints

{% callout  %}

A workflow class must

- extend `io.infinitic.workflows.Workflow`
- be public and have an empty constructor
- have [serializable](/docs/references/serialization) parameters and return value for its methods

{% /callout  %}

{% callout type="warning"  %}

A workflow class must be deterministic and without side effects. As a consequence, the following actions must not be used in workflows (but are perfectly fine in tasks):

- multi-threading
- performing database requests
- performing any file operation
- performing API calls
- using environment variables\*
- using current date\*
- using random values\*

\*can be used in a workflow as [inline](/docs/workflows/inline) tasks.

{% /callout  %}

{% callout type="warning"  %}

The history of a workflow should not grow indefinitely, so we should avoid having more than a few thousand tasks in a workflow. If we need more, we should consider using child workflows to distribute our work.

For example, to manage 1 million tasks, we can have a workflow dispatching 1000 child-workflows managing 1000 tasks each.

{% /callout  %}

## Good Practices

For easier [versioning of workflows](/docs/workflows/versioning), we recommend that:

{% callout type="note"  %}

Each workflow should be given a simple name through the [@Name](#name-annotation) annotation

{% /callout  %}

{% callout type="note"  %}

Public methods should have:

- one parameter of a dedicated type object
- a return value of a dedicated type object

{% /callout  %}

For example,

{% codes %}

```java
import io.infinitic.annotations.Name;

@Name(name = "MyWorkflow")
public interface MyWorkflow {
    RunOutput run(RunInput input);
}
```

```kotlin
import io.infinitic.annotations.Name

@Name("MyWorkflow")
interface MyWorkflow {
    fun run(input: RunInput): RunOutput
}
```

{% /codes %}


## Dispatch A Task

Workflows only need to know the interface of remote services to be able to use them.

By using the `newService` function on the service interface, we create a stub that behaves syntactically as an instance of the remote service, but actually sends a message to Pulsar that will trigger the remote execution of the service.

Each call of a method will dispatch a new task. For example:

{% codes %}

```java
public class MyWorkflow extends Workflow implements MyWorkflowInterface {
    // create a stub of ServiceInterface
    private final ServiceInterface service = newService(ServiceInterface.class);

    @Override
    public String start(String name, String email) {
        // the code below triggers 2 calls of `ServiceInterface::handle(name, email)`,
        // expecting a boolean return type.
        // both tasks will be processed in parallel as the first one is dispatched without waiting

        // dispatching a new task without waiting for the result
        Deferred<Boolean> deferred = dispatch(service::handle, name, email);

        // dispatching a new task and wait for its result
        Boolean result2 = service.handle(name, email);

        // wait and get result of the first call
        Boolean result1 = deferred.await();
    }
}
```

```kotlin
class MyWorkflow : Workflow(), MyWorkflowInterface {
    // create a stub of ServiceInterface
    private val service : ServiceInterface = newService(ServiceInterface::class.java)

    override fun start(name: String, email: String): String {
        // the code below triggers 2 calls of `ServiceInterface::handle(name, email)`,
        // expecting a boolean return type.
        // both tasks will be processed in parallel as the first one is dispatched without waiting

        // dispatching a new task without waiting for the result
        val deferred : Deferred<Boolean> = dispatch(service::handle, name, email)

        // dispatching a new task and wait for its result
        val result2: Boolean = service.handle(name, email)

        // wait and get result of the first call
        val result1: Boolean = deferred.await()
    }
}
```

{% /codes %}

{% callout type="note"  %}

`newService` stubs can to be defined only once. We can use it multiple times to dispatch multiple new tasks.

{% /callout  %}

{% callout type="warning"  %}

JAVA ONLY: If the return type of the task is `void`, we need to use `dispatchVoid` function instead of `dispatch`.

{% /callout  %}

We can also add tags to this stub. If we do that, every task dispatched with it will be tagged as well. It's very useful to target later this instance by tag:

{% codes %}

```java
ServiceInterface service = client.newService(ServiceInterface.class, Set.of("foo", "bar"));
```

```kotlin
val service: ServiceInterface = newService(ServiceInterface::class.java, tags = setOf("foo", "bar"))
```

{% /codes %}

We can define global timeout for tasks at workflow level by adding `@Timeout` annotations to the Servide interface. It's also possible to extend the `WithTimeout`interface.

A global timeout represents the maximal duration of the task dispatched by workflows (including retries and transportation) before a timeout is thrown at workflow level for this task.

Defining global timeouts can be useful to ensure that a workflow is never stuck.

## Dispatch A Child-Workflow

By using the `newWorkflow` function on a workflow interface, we create a stub that behaves syntactically as an instance of the workflow but sends a message to Pulsar that will trigger the remote execution of the workflow.

Each call of a method will dispatch a new [child-workflow](/docs/workflows/parallel#child-workflows). For example:

{% codes %}

```java
public class MyWorkflowImpl extends Workflow implements MyWorkflowInterface {
    // create a stub of OtherWorkflowInterface
    private final OtherWorkflowInterface otherWorkflow = newWorkflow(OtherWorkflowInterface.class);

    @Override
    public String start(String name, UUID userId) {
        // the code below triggers 2 calls of `OtherWorkflowInterface::start(name, userId)`,
        // expecting a boolean return type.
        // both workflows will be processed in parallel as the first one is dispatched without waiting

        // dispatching a new workflow without waiting for the result
        Deferred<Boolean> deferred = dispatch(otherWorkflow::start, name, userId);

        // dispatching a new workflow and wait for its result
        Boolean result2 = otherWorkflow.start(name, userId);

        // get result of the first workflow
        Boolean result1 = deferred.await();
    }
}
```

```kotlin
class MyWorkflowImpl : Workflow(), MyWorkflowInterface {
    // create a stub of OtherWorkflowInterface
    private val otherWorkflow: OtherWorkflowInterface = newWorkflow(OtherWorkflowInterface::class.java)

    override fun start(name: String, UUID userId): String {
        // the code below triggers 2 calls of `OtherWorkflowInterface::start(name, userId)`,
        // expecting a boolean return type.
        // both workflows will be processed in parallel as the first one is dispatched without waiting

        // dispatching a new workflow without waiting for the result
        val deferred : Deferred<Boolean> = dispatch(otherWorkflow::start, name, userId)

        // dispatching a new workflow and wait for its result
        val result2: Boolean = otherWorkflow.start(name, userId)

        // get result of the first task
        val result1: Boolean = deferred.await()
    }
}
```

{% /codes %}

{% callout type="note"  %}

`newWorkflow` stubs can be defined only once. We can use it multiple times to dispatch multiple new workflows.

{% /callout  %}

{% callout type="warning"  %}

If the return type of the method used is `void`, we need to use `dispatchVoid` function instead of `dispatch`.

{% /callout  %}

We can also add tags to this stub. If we do that, every workflow dispatched with it will be tagged as well. It's very useful to target later this instance by tag:

{% codes %}

```java
OtherWorkflow otherWorkflow = newWorkflow(OtherWorkflow.class, Set.of("foo", "bar"));
```

```kotlin
val otherWorkflow: OtherWorkflow = newWorkflow(OtherWorkflow::class.java, setOf("foo", "bar"))
```

{% /codes %}

We can define global timeout for child-workflows at workflow level by adding `@Timeout` annotations to the child Workflow interface. It's also possible to extend the `WithTimeout`interface.

A global timeout represents the maximal duration of the child workflow before a timeout is thrown at workflow level for it.

Defining global timeouts can be useful to ensure that a workflow is never stuck.

## Inline Task

As described [here](/docs/workflows/implementation), any non-deterministic instructions, or instructions with side-effect, should be in tasks, not in workflows. For very simple instructions, it can be frustrating to write such simple tasks. For those cases, we can use inline tasks:

{% codes %}

```java
// get (non-determistic) current date
Date now = inline(() -> new Date());

// get (non-determistic) env variable
String home = inline(() -> System.getEnv("JAVA_HOME"));

// display (side-effect)
inlineVoid(() -> System.out.println("log"));
```

```kotlin
// get (non-determistic) current date
val now = inline { Date() }

// get (non-determistic) env variable
val home = inline { System.getEnv("JAVA_HOME") }

// display (side-effect)
inline { println("log") }
```

{% /codes %}

{% callout type="note"  %}

If the return type of the lambda describing the inline task is `void`, we need to use `inlineVoid` function instead of `inline`.

{% /callout  %}

## Receive Signal

Workflow can receive signals from "outside". Signals are typed and sent through "channels". The workflow interface must have a getter method returning a `SendChannel<Type>`. For example:

{% codes %}

```java
public interface Process {
    ...
    SendChannel<Boolean> getDecisionChannel();
}
```

```kotlin
interface Process {
    val decisionChannel: SendChannel<Boolean>
}
```

{% /codes %}

Workflows implement channels with the `channel` function:

{% codes %}

```java
public class ProcessImpl extends Workflow implements Process {
    // create typed channel
    final private Channel<Boolean> decisionChannel = channel();

    // channel getter
    @Override
    public Channel<Boolean> getDecisionChannel() { return decisionChannel; }

    @Override
    public void start() {
        // the workflow can asynchrounously receive a signal as soon as receive() is applied
        Deferred<Boolean> deferredDecision = decisionChannel.receive();
        ...
        // wait for the decision
        if(deferredDecision.await()) {
            ...
        } else {
            ...
        }
    }
}
```

```kotlin
class ProcessImpl : Workflow(), Process {
    // create typed channel
    override val decisionChannel = channel<Boolean>()

    override fun start() {
        // the workflow can asynchrounously receive a signal as soon as receive() is applied
        val deferredDecision: Deferred<Boolean> = decisionChannel.receive()
        ...
        // wait for the decision
        when(deferredDecision.await()) {
            true -> ...
            false -> ...
        }
    }
}
```

{% /codes %}

{% callout type="note"  %}

Channels can be of any [serializable](/docs/references/serialization) type.

{% /callout  %}

Per default, a signal sent to a running workflow is discarded. Before a workflow can receive a signal, it must first declare that it is waiting for it using the `receive` method on the channel.

## Manage Time

Time can be managed using the `timer` function. A call to the `timer` function creates a `Deferred<Instant>` that will be completed at the given time:

{% codes %}

```java
// create a timer that will complete in 60 seconds
Deferred<Instant> timer = timer(Duration.ofSeconds(60));

...

// the workflow will stop here until the timer completion
timer.await();
```

```kotlin
// create a timer that will complete in 60 seconds
timer(Duration.ofHours(48))

...

// the workflow will stop here until the timer completion
timer.await()
```

{% /codes %}

We can also target a specific Instant:

{% codes %}

```java
// use inline because `LocalDate.now()` is non-deterministic
Instant mondayAt8 = inline(() ->
    LocalDate.now()
        .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY))
        .atTime(8,0)
        .toInstant(ZoneOffset.UTC)
);
// create a timer that will complete next monday at 8:00UTC
Deferred<Instant> timer = timer(mondayAt8);

...

// the workflow will stop here until the timer completion
timer.await();
```

```kotlin
// use inline because `LocalDate.now()` is non-deterministic
val mondayAt8 = inline {
    LocalDate.now()
        .with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY))
        .atTime(8,0)
        .toInstant(ZoneOffset.UTC)
}
// create a timer that will complete next monday at 8:00UTC
val timer = timer(mondayAt8)

...

// the workflow will stop here until the timer completion
timer.await()
```

{% /codes %}

{% callout type="note"  %}

When a workflow is waiting, no resources are consumed.
Internally, a delayed Pulsar message is sent to wake up the workflow when the time is right.

{% /callout  %}

## Properties

[Properties](/docs/workflows/properties) in workflows are saved along with the workflow state. Properties are especially useful in workflows where multiple methods are called, either sequentially or in parallel. They can represent business values updated by these methods. An example can be found in the introduction, illustrating a [Loyalty Program](/docs/introduction/examples#loyalty-program).

## Interacting With Other Workflows

It's possible to interact with another running workflow from a workflow.
To do so, we create the stub of a running workflow from its id:

{% codes %}

```java
HelloWorkflow w = getWorkflowById(HelloWorkflow.class, id);
```

```kotlin
val w : HelloWorkflow = getWorkflowById(HelloWorkflow::class.java, id)
```

{% /codes %}

Alternatively, we can create a stub targeting all running workflow having a given tag:

{% codes %}

```java
HelloWorkflow w = getWorkflowByTag(HelloWorkflow.class, "foo");
```

```kotlin
val w : HelloWorkflow = getWorkflowByTag(HelloWorkflow::class.java, tag = "foo")
```

{% /codes %}

Using this stub, we can:

- send a signal to it
- start another method in parallel
- get current properties

### Sending a signal to another workflow

Once we have the stub of a running workflow, we can easily send a typed signal to it:

{% codes %}

```java
// create stub of a running Process workflow
Process Process = getWorkflowById(Process.class, id);

// send a signal to this running workflow through a channnel
process.getDecisionChannel().send(true);
```

```kotlin
// create stub of a running Process workflow
val process: Process = getWorkflowById(Process::class.java, id)

// send a signal to this running workflow through a channnel
process.decisionChannel.send(true)
```

{% /codes %}

If we target a running workflow by tag, the event will be sent to _all_ running workflows with this tag:

{% codes %}

```java
// create stub of all running Process workflows with this tag
Process Process = getWorkflowByTag(Process.class, tag);

// send a signal to all those workflows through their channnel
process.getDecisionChannel().send(true);
```

```kotlin
// create stub of all running Process workflows with this tag
val process: Process = getWorkflowByTag(Process::class.java, tag)

// send a signal to all those workflows through their channnel
process.decisionChannel.send(true)
```

{% /codes %}

### Starting another method for a running workflow

When we use the stub of a running workflow to start a method,
we actually create another execution running in parallel to the main one.

{% codes %}

```java
// create stub of a running Process workflow
Process Process = getWorkflowById(Process.class, id);

// dispatching a new task without waiting for the result
Deferred<T> deferred = dispatch(service::handle, name, email);
```

```kotlin
// create stub of a running Process workflow
val process: Process = getWorkflowById(Process::class.java, id)

// dispatching a new method without waiting for the result
val deferred : Deferred<T> = dispatch(process::handle, name, email)
```

{% /codes %}

### Get or set current properties of another workflow

{% callout type="note"  %}

When multiple methods (of the same workflow instance) are running in parallel,
they share the instance properties.

{% /callout  %}

For example, dispatching getters or setters of a workflow is a way to get or set properties in another workflow.
In the example below, we can use the getter/setter methods of `points` property from another workflow.
Also, the `bonus` method lets us add a bonus to the current value of `points`.

{% codes %}

```java
public class LoyaltyImpl extends Workflow implements Loyalty {
    private Integer points = 0;

    @Override
    public Integer getPoints() {
        return points;
    }

    @Override
    public Integer bonus(Integer value) {
        points += value;

        return points;
    }

    @Override
    public void start() {
        ...
    }
}
```

```kotlin
class LoyaltyImpl : Workflow(), Loyalty {
    val points: Int = 0

    override fun bonus(value: Int) : Int {
        points += value

        return points
    }

    override fun start() {
        ...
    }
}
```

{% /codes %}

## @Name Annotation

A workflow instance is internally described by both its full java name (package included) and the name of the method called.

We may want to avoid coupling this name with the underlying implementation, for example, if we want to rename the class or method, or if we mix programming languages.

Infinitic provides a `@Name` annotation that let us declare explicitly the names that Infinitic should use internally. For example:

{% codes %}

```java
package hello.world.workflows;

import io.infinitic.annotations.Name;

@Name("HelloWorkflow")
public interface HelloWorkflow {
    @Name(name = "greeting")
    String greet(String name);
}
```

```kotlin[app/src/main/kotlin/hello/world/workflows/HelloWorkflow.kt]
package hello.world.workflows

import io.infinitic.annotations.Name;

@Name("HelloWorkflow")
interface HelloWorkflow {
    @Name("greeting")
    fun greet(name: String): String
}
```

{% /codes %}

When using this annotation, the Service `name` setting in [Workflow workers](/docs/workflows/workers) configuration file should be the one provided by the annotation:

```yaml
workflows:
  - name: HelloWorkflow
    class: hello.world.workflows.HelloWorkflowImpl
```

## @Ignore Annotation

At each step of the execution of a workflow, its properties are automatically serialized and stored. Those properties are part of the state of the workflow.

The `@Ignore` (io.infinitic.annotations.Ignore) annotation lets us tag other properties that are not part of the workflow state and should not be serialized during the workflow execution.

## Workflow Context

In some cases, it is useful to understand more about the context in which a workflow is executed.

The `io.infinitic.workflows.Workflow` class provides the following static properties:


| Name             | Type        | Description                          |
| ---------------- | ----------- | ------------------------------------ |
| `workflowId`   | String        | Unique identifier of the workflow instance  |
| `workflowName` | String        | Name of the workflow                 |
| `methodId`     | String        | Unique identifier of the method run  |
| `methodName`   | String        | Name of the method currently running |
| [`tags`](#tags)         | Set\<String\> | Tags provided when dispatching the workflow |
| [`meta`](#meta)         | Map\<String, ByteArray\> | Metadata provided when dispatching the workflow |

### `tags`

The `tags` property of the workflow context is an immutable set of strings.
Its value is defined when creating the stub before dispatching the workflow:

{% codes %}

```java
final HelloWorkflow helloWorkflow = newWorkflow(
    HelloWorkflow.class,
    Set.of("userId" + userId, "companyId" + companyId)
);
```

```kotlin
val helloWorkflow = newWorkflow(
    HelloWorkflow::class.java, 
    tags = setOf("userId:$userId", "companyId:$companyId")
)
```

{% /codes %}


### `meta`

The `meta` property of the workflow context is a immutable map of strings to arrays of bytes.
Its value is defined when creating the stub before dispatching the workflow:

{% codes %}

```java
final HelloWorkflow helloWorkflow = newWorkflow(
    HelloWorkflow.class,
    null,
    Map.of(
        "foo", "bar".getBytes(),
        "baz", "qux".getBytes()
    )
);
```

```kotlin
private val helloWorkflow = newWorkflow(
    HelloWorkflow::class.java,
    meta = mapOf(
        "foo" to "bar".toByteArray(),
        "baz" to "qux".toByteArray()
    )
)
```

{% /codes %}

## Service's Exceptions

As discussed in the [service syntax](/docs/services/syntax) documentation, it's recommended to handle non-technical failures through a status in the return value of services. Infinitic doesn't expect `throws` clauses in Service interfaces.

If a Service interface does contain throws clauses:

- In Java: Add them to the workflow class or method, or use the `@SneakyThrows` annotation from Lombok.
- In Kotlin: No additional action is required due to Kotlin's exception handling.

For more information on error handling in workflows, refer to the [error handling](/docs/workflows/errors) documentation.