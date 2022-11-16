---
title: Signals
description: ""
---

We can send external signals to workflows. Typically, a signal will convey a piece of information such as "a document has been validated" or "an order was just shipped"...

We have described how a client can [send a signal](/docs/clients/send-signal) to a running workflow. Here, we will describe how the workflow can handle them.

## Implementing channels

Signals are sent through channels. Our client can send a signal to a running workflow like this:

{% codes %}

```java
// stub targeting a running HelloWorld workflow with a specific id
HelloWorldWorkflow w = client.getWorkflowById(HelloWorldWorkflow.class, "05694902-5aa4-469f-824c-7015b0df906c");

// send a signal to this instance through a channnel
w.getNotificationChannel().send("foobar");
```

```kotlin
// stub targeting a running HelloWorld workflow with a specific id
val w : HelloWorldWorkflow = client.getWorkflowById(HelloWorldWorkflow::class.java, "05694902-5aa4-469f-824c-7015b0df906c")

// send a signal to this instance through a channnel
w.notificationChannel.send("foobar")
```

{% /codes %}

To allow this, channels need to be present in a workflow interface as below:

{% codes %}

```java
public interface HelloWorld {
    SendChannel<String> getNotificationChannel();

    ...
}
```

```kotlin
interface HelloWorld {
    val notificationChannel: SendChannel<String>

    ...
}
```

{% /codes %}

Our workflow implements this interface using the provided `channel` workflow method:

{% codes %}

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

```kotlin
class HelloWorldImpl : Workflow(), HelloWorld {
    val notificationChannel = channel<String>()

    ...
}
```

{% /codes %}

{% callout type="note"  %}

In the examples above, `Channel<String>` is used as an example. But `Channel<T>` supports any [serializable](tasks/serializability) `T` type, not only `String`.

{% /callout  %}

## Receiving signals

A workflow only receives signals that it is waiting for.
Per default, all signals sent to a workflow are discarded.
To receive some signals, we need to explicitly ask for them with the `receive` method:

{% codes %}

```java
...
Deferred<String> deferredSignal = getNotificationChannel().receive();
...
```

```kotlin
...
val deferredSignal: Deferred<String> = notificationChannel.receive()
...
```

{% /codes %}

All signals sent to the workflow before reaching the `receive` command will be discarded.
The `receive` command is non-blocking and will return immediately,
but from there Infinitic will buffer any received signal.

{% callout type="note"  %}

Per default, a `receive()` call tells Infinitic to buffer all new incoming signals,
but if the workflow uses only the next `n` signal, we can specify that with a `receive(n)` call.
After the next `n` signals, the other ones will be discarded again.

{% /callout  %}

Each `await()` call to this `Deferred` returns the next signal buffered if already been received,
 or waits for it if not.

{% codes %}

```java
Deferred<String> deferredSignal = getNotificationChannel().receive();
...
String signal1 = deferredSignal.await();
...
String signal2 = deferredSignal.await();
```

```kotlin
val deferredSignal: Deferred<String> = notificationChannel.receive()
...
val signal1: String = deferredSignal.await()
...
val signal2: String = deferredSignal.await()
```

{% /codes %}

## Filtering events by type

Let's say we have a `Channel<Event>` channel receiving objects of type `Event`. If we want our workflow to wait only for a sub-type `ValidationEvent`:

{% codes %}

```java
Deferred<ValidationEvent> deferred = getEventChannel().receive(ValidationEvent.class);
```

```kotlin
val deferred : Deferred<ValidationEvent> = eventChannel.receive(ValidationEvent::class)
```

{% /codes %}

## Filtering events by attributes

If we want our workflow to wait only for an `Event` with specific attributes, we can write a requirement using a [JSONPath predicate](https://github.com/json-path/JsonPath#predicates) that will be applied to the serialized event. For example, if we want to receive an `Event` with a specific `ef20b7a9-849b-41f8-89e9-9c5492efb098` userId, we can do:

{% codes %}

```java
Deferred<Event> deferred =
    getEventChannel().receive("[?(\$.userId == \"ef20b7a9-849b-41f8-89e9-9c5492efb098\")]");
```

```kotlin
val deferred : Deferred<Event> =
    eventChannel.receive("[?(\$.userId == \"ef20b7a9-849b-41f8-89e9-9c5492efb098\")]")
```

{% /codes %}

or using a [filter predicate](https://github.com/json-path/JsonPath#filter-predicates) (after adding `com.jayway.jsonpath:json-path:2.5.0` to our project)

{% codes %}

```java
Deferred<Event> deferred =
    getEventChannel().receive("[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"));
```

```kotlin
val deferred : Deferred<Event> =
    eventChannel.receive("[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"))
```

{% /codes %}

## Filtering events by type and attributes

At last, if we want to receive an event having both a specific type and specific attributes:

{% codes %}

```java
Deferred<ValidationEvent> deferred =
    getEventChannel().receive(ValidationEvent.class, "[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"));
```

```kotlin
val deferred : Deferred<ValidationEvent> =
    eventChannel.receive(ValidationEvent::class, "[?]", where("userId").eq("ef20b7a9-849b-41f8-89e9-9c5492efb098"))
```

{% /codes %}

## Unit testing predicates

In our unit tests, we would like to check if an `event` is correctly filtered by a JSONPath predicate - below is an example of statements that should be true if `event` has the right `userId`:

{% codes %}

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

{% /codes %}
