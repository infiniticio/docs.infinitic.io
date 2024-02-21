---
title: Service Events
description:
---

Since version 0.13.0, it's possible to access Infinitic internal events in a [CloudEvents](https://cloudevents.io) JSON format. These events serve various use cases, including:

- Auditing
- Building custom dashboards
- Logging
- Adding hooks to specific events
- And more.


## Event listeners

To retrieve the events related a specific service, you need to add an `eventListener` entry to your [Service configuration file](/docs/services/workers#configuration-file):

```yaml
services:
  - name: example.booking.services.carRental.CarRentalService
    class: example.booking.services.carRental.CarRentalServiceImpl
    concurrency: 3
    eventListener:
      class: example.booking.services.Listener
      concurrency: 5
```

where:

- `class` is the name of a class implementing the `io.infinitic.cloudEvents.CloudEventListener` interface.
- `concurrency` (optional) specifies the number of events to be handled in parallel for this service. If not specified, the default value is the same as that for the service (`3` in the example above).

{% codes %}

```java
package io.infinitic.cloudEvents;

import io.cloudevents.CloudEvent;

public interface CloudEventListener {
   void onEvent(CloudEvent event);
}
```

```kotlin
package io.infinitic.cloudEvents

import io.cloudevents.CloudEvent

interface CloudEventListener {
    fun onEvent(event: CloudEvent)
}
```

{% /codes %}


{% callout type="warning"  %}

To implement this interface, you need to add `io.cloudevents:cloudevents-json-jackson` to the dependencies of your project.

{% /callout  %}

Alternatively, you can set a default event listener for all services of the worker:

```yaml
serviceDefault:
    eventListener:
        class: example.booking.services.Listener
```

Or even, a default event listener for all services and workflows of the worker:

```yaml
eventListener:
    class: example.booking.services.Listener
```

## Implementation example

Here is an example of `CloudEventListener` implementation that writes the events to the standard output in json format:

{% codes %}

```java
package example.booking.services;

import io.cloudevents.CloudEvent;
import io.cloudevents.jackson.JsonFormat;
import io.infinitic.cloudEvents.CloudEventListener;

public class Listener implements CloudEventListener {
    @Override
    public void onEvent(CloudEvent event) {
        System.out.println(new String(new JsonFormat().serialize(event)));
    }
}
```

```kotlin
package example.booking.services

import io.cloudevents.CloudEvent
import io.cloudevents.jackson.JsonFormat
import io.infinitic.cloudEvents.CloudEventListener

class Listener : CloudEventListener {
    override fun onEvent(event: CloudEvent) {
        println(String(JsonFormat().serialize(event)))
    }
}
```

{% /codes %}

## Service events description

Here is a typical CloudEvent example:

```json
{
  "specversion" : "1.0",
  "id" : "018dcb5f-aaa8-7bd3-92bd-ac1f0d52b2dd",
  "source" : "pulsar://localhost:6650/infinitic/test9/services/HelloService",
  "type" : "infinitic.task.completed",
  "datacontenttype" : "application/json",
  "subject" : "018dcb5f-aa4f-7187-8a9d-d656c4e13a1b",
  "time" : "2024-02-21T11:14:20.968Z",
  "data" : {
    "result" : "Hello 0!",
    "retrySequence" : 0,
    "retryIndex" : 0,
    "serviceName" : "HelloService",
    "taskName" : "addEnthusiasm",
    "taskMeta" : { },
    "taskTags" : [ ],
    "workerName" : "standalone-13907-104",
    "infiniticVersion" : "0.13.0-SNAPSHOT"
  }
}
```

For all service events:

- `id` serves as a unique identifier for the event.
- `subject` denotes the task's ID.
- `time` indicates the publishing time of the event.
- `type` is prefixed with `infinitic.task.*`, where `*` corresponds to one of the following:

| Type                  | Nature  | Description                                                                      |
| --------------------- | ------- | -------------------------------------------------------------------------------- |
| `start`               | Command | Indicates that a task has been scheduled.                                       |
| `started`             | Event   | Signifies that the worker has begun processing the task.                        |
| `completed`           | Event   | Indicates successful completion of the task by the worker.                      |
| `retryScheduled`      | Event   | Signifies that the task has failed and is scheduled for retry per the retry policy. |
| `failed`              | Event   | Indicates that the task did not succeed within the allowed retries as defined by the retry policy. |
| `delegationCompleted` | Event   | Indicates successful completion of a delegated task by the worker.              |

The `data` field contains type-specific information, and also:

| Field Name          | Type     | Description                                                                   |
| --------------------| ---------| ------------------------------------------------------------------------------|
| `retrySequence`     | Int      | Index of the number of manual retries.                                       |
| `retryIndex`        | Int      | Index of the number of automatic retries.                                    |
| `serviceName`       | String   | Name of the service (provided by the `@Name` class annotation or the class's name if not specified). |
| `taskName`          | String   | Name of the task (provided by the `@Name` method annotation or the method's name if not specified). |
| `taskMeta`          | Map<String, ByteArray> | Metadata of the task.                                                   |
| `taskTags`          | Array<String> | Tags associated with the task.                                           |
| `infiniticVersion`  | String   | Version of Infinitic used by the entity that published the event (e.g., "0.13.0"). |