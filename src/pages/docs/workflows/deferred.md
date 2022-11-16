---
title: Deferred
description: ""
---

In workflows, we often create `Deferred<T>` object using the workflow functions:

- `dispatch` (on new task or new / existing workflows)
- `receive` (on channels)
- `timer`

The creation of a deferred object is always asynchronous: it does not block the
progress of the workflow.

## Waiting for completion

We can wait for the completion of a `Deferred<T>` by applying the `await` method to it:

{% codes %}

```java
// dispatch a task or child-workflow
Deferred<Boolean> deferredTask = dispatch(service::handle, name, email);

// wait for the completion of the task or child-workflow
Boolean result = deferredTask.await();

// ready to receive a signal from this channel
Deferred<String> deferredSignal = getNotificationChannel().receive();

// wait for a signal in this channel
String signal = deferredSignal.await();

// dispatch a timer of 60s
Deferred<Instant> timer = timer(Duration.ofSeconds(60));

// wait for timer's end
Instant now = timer.await();
```

```kotlin
// dispatch a task or child-workflow
val deferred : Deferred<Boolean> = dispatch(service::handle, name, email)

// wait for the completion of the task or child-workflow
val result : Boolean = deferred.await()

// ready to receive a signal from this channel
val result: Deferred<String> = notificationChannel.receive()

// wait for a signal in this channel
val signal: String = deferredSignal.await()

// dispatch a timer of 60s
val timer = timer(Duration.ofHours(48))

// wait for timer's end
val now : Instant = timer.await();
```

{% /codes %}

At each `await()` method, the workflow will stop on the line, up to the deferred completion.

{% callout type="warning"  %}

Some exceptions can be thrown when waiting for a `Deferred<T>` completion. See [here](/docs/workflows/errors) for more details.

{% /callout  %}

## Getting status

`Deferred` has some self-explanatory non-blocking methods to retrieve its current status:

- `isOngoing()`
- `isUnknown()`\*
- `isCanceled()`
- `isFailed()`
- `isCompleted()`

\*The Unknown status is given when dispatching a method on a workflow stub created by `getWorkflowById`, with an id targeting a workflow that has never existed or is already completed or canceled.

A `Deferred<T>` status will be updated as the workflow progresses. For example, if `service::handle` is processed in 20 seconds:

{% codes %}

```java
// dispatch a task service::handle
Deferred<String> deferredTask = dispatch(service::handle, name, email);

// this will print "false"
inlineVoid(() -> System.out.println(deferredTask.isCompleted()));

// wait for 15 seconds
timer(Duration.ofSeconds(15)).await();

// this will print "false"
inlineVoid(() -> System.out.println(deferredTask.isCompleted()));

// wait for 15 seconds
timer(Duration.ofSeconds(15)).await();

// this will print "true"
inlineVoid(() -> System.out.println(deferredTask.isCompleted()));
```

```kotlin
// dispatch a task service::handle
val deferredTask : Deferred<String> = dispatch(service::handle, name, email)

// this will print "false"
inline { println(deferredTask.isCompleted() }

// wait for 15 seconds
timer(Duration.ofSeconds(15)).await()

// this will print "false"
inline { println(deferredTask.isCompleted() }

// wait for 15 seconds
timer(Duration.ofSeconds(15)).await()

// this will print "true"
inline { println(deferredTask.isCompleted() }
```

{% /codes %}

## Combining Deferred

A powerful feature of `Deferred<T>` is that they can be logically combined to create a new one,
using `io.infinitic.workflows.or` and `io.infinitic.workflows.and` functions. This allow us to easily code requirement such as: _let's wait for a confirmation signal, but not more that 2 days_.

For example:

{% codes %}

```java
import io.infinitic.workflows.or;
import io.infinitic.workflows.and;
...

// asynchronous task processing
Deferred<Boolean> d1 = dispatch(task::method, parameters);
// asynchronous wait for 42 minutes
Deferred<Instant> d2 = timer(Duration.ofMinutes(42));
// asynchronous wait for an external event
Deferred<String> d3 = eventChannel.receive()

// waiting for at least one deferred to complete
or(d1, d2, d3).await();

// waiting for d1 and (d2 or d3) to complete
and(d1, or(d2, d3)).await();

// waiting for all 3 tasks to complete
and(d1, d2, d3).await();
```

```kotlin
import io.infinitic.workflows.or
import io.infinitic.workflows.and
...

// asynchronous task processing
val d1 = dispatch(task::method, parameters)
// asynchronous wait for 42 minutes
val d2 = timer(Duration.ofMinutes(42))
// asynchronous wait for an external event
val d3 = eventChannel.receive()

// waiting for at least one deferred to complete
(d1 or d2 or d3).await()

// waiting for d1 and (d2 or d3) to complete
(d1 and (d2 or d3)).await()

// waiting for all 3 tasks to complete
(d1 and d2 and d3).await()
```

{% /codes %}

The return value depends on the operator:

- `or` will return the return value of the _first_ completed deferred
- `and` will return the list of _all_ completed deferred

If an exception occurs:

- `or` will throw an exception relative to the _last_ failed/canceled deferred
- `and` will throw an exception relative to the _first_ failed/canceled deferred
