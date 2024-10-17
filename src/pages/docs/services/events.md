---
title: Service Events
description: Learn how to access and utilize Infinitic internal events in CloudEvent JSON format for auditing, custom dashboards, logging, and more. Discover how to configure event listeners for your services to handle events efficiently.
---

Since version 0.13.0, it's possible to access Infinitic internal events in a [CloudEvent](https://cloudevents.io) JSON format. These events serve various use cases, including:

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
    public void onEvents(List<CloudEvent> events) {
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
    "infiniticVersion" : ":0.16.0"
  }
}
```

For all service events:

- `id` serves as a unique identifier for the event.
- `subject` denotes the task's ID.
- `time` indicates the publishing time of the event.
- `type` is prefixed with `infinitic.task.*`, where `*` corresponds to one of the following:

| CloudEvent's type postfix | Type   | Description                                                                      |
| --------------------- | ------- | -------------------------------------------------------------------------------- |
| `dispatch`            | Command | A task execution is required                                       |
| `started`             | Event   | A worker has begun processing the task.                        |
| `completed`           | Event   | A worker has succesfuly processed the task                    |
| `retryScheduled`      | Event   | The task has failed and is scheduled for retry per the retry policy. |
| `failed`              | Event   | The task did not succeed within the allowed retries as defined by the retry policy. |
| `delegationCompleted` | Event   | Successful completion of a delegated task by the worker.              |

The `data` field contains the data below, as well as type-specific information:

| Field Name          | Type     | Description                                                                   |
| --------------------| ---------| ------------------------------------------------------------------------------|
| `retrySequence`     | Int      | Index of the number of manual retries.                                       |
| `retryIndex`        | Int      | Index of the number of automatic retries.                                    |
| `serviceName`       | String   | Name of the service (provided by the `@Name` class annotation or the class's name if not specified). |
| `taskName`          | String   | Name of the task (provided by the `@Name` method annotation or the method's name if not specified). |
| `taskMeta`          | Map<String, ByteArray> | Metadata of the task.                                                   |
| `taskTags`          | Array<String> | Tags associated with the task.                                           |
| `infiniticVersion`  | String   | Version of Infinitic used by the entity that published the event (e.g., ":0.16.0"). |

{% callout type="note"  %}

The `source` property describes the Pulsar cluster, tenant, and namespaces, as well as the service's name. However this property does not represent an actual Pulsar topic, as the events originate from multiple internal topics.

{% /callout  %}