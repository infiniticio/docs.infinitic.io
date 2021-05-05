---
title: External Events
description: ""
position: 4.6
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Channels introduce a way to send "events" (any serializable object actually) to a running workflow.

In the Client section, we have described [how to send events](/clients/managing-workflows#send-an-object-to-a-running-workflow) to a running workflow. Here, we will describe how to handle them.

<alert type="info">

In the examples below, `Channel<String>` is used as an example. But `Channel` supports any [serializable](tasks/serializability) type, not only String.

</alert>

### Channel definition

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

### Channel usage

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

All events sent to the workflow before it reaches the above line will be discarded. The first event sent to the workflow after it reaches this line will be caught. The following events will be discarded unless the `receive()` method is previously used again.

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

### Filtering events by type

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

### Filtering events by attributes

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

### Filtering events by type and attributes

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

### Unit testing predicates

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
