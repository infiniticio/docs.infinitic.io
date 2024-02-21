---
title: Workflow Events
description:
---
Since version 0.13.0, it's possible to access Infinitic internal events in a [CloudEvents](https://cloudevents.io) JSON format. These events serve various use cases, including:

- Auditing
- Building custom dashboards
- Logging
- Adding hooks to specific events
- And more.

## Event listeners

To retrieve the events related a specific workflow, you need to add an `eventListener` entry to your [Workflow configuration file](/docs/workflows/workers#configuration-file):

```yaml
workflows:
  - name: example.booking.workflows.BookingWorkflow
    class: example.booking.workflows.BookingWorkflowImpl
    concurrency: 10
    eventListener:
      class: example.booking.workflows.Listener
      concurrency: 5
```

where:

- `class` is the name of a class implementing the `io.infinitic.cloudEvents.CloudEventListener` interface.
- `concurrency` (optional) specifies the number of events to be handled in parallel for this workflow. If not specified, the default value is the same as that for the workflow executor (`10` in the example above).

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

Alternatively, you can set a default event listener for all workflows of the worker:

```yaml
workflowDefault:
    eventListener:
        class: example.booking.workflows.Listener
```

Or even, a default event listener for all services and workflows of the worker:

```yaml
eventListener:
    class: example.booking.Listener
```

## Implementation example

Here is an example of `CloudEventListener` implementation that writes the events to the standard output in json format:

{% codes %}

```java
package example.booking.workflows;

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
package example.booking.workflows

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

## Workflow events description

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

For all workflow events:

- `id` serves as a unique identifier for the event.
- `subject` denotes the workflow's ID.
- `time` indicates the publishing time of the event.
- `type` is prefixed with `infinitic.workflow.*`, where `*` corresponds to one of the following:

| Type                  | Nature  | Description                                                                                        |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `start`               | Command | Indicates that a new workflow has been scheduled.             |
| `startMethod`         | Command | Indicates that a new method execution has been scheduled on an existing workflow.    |
| `cancel`              | Command | Indicates that the cancellation of a workflow has been requested.      |
| `cancelMethod`        | Command | Indicates that the cancellation of the execution of a workflow's method has been requested.   |
| `retryTask`           | Command | Indicates that the retry of some tasks has been requested.          |
| `retryExecutor`       | Command | Indicates that the retry of the workflow task has been requested.      |
| `signal`              | Command | Indicates that a signal has been sent to the workflow.          |
| `signalReceived`      | Event   | Indicates that the workflow has received the expected signal.       |
| `signalDiscarded`     | Event   | Indicates that the workflow has received an unexpected signal.     |
| `signalDispatched`    | Event   | Indicates that the workflow has sent a signal to another workflow.     |
| `timerDispatched`     | Event   | Indicates that the workflow has dispatched a timer.       |
| `timerCompleted`      | Event   | Indicates that a timer (used by the workflow) has completed.     |
| `remoteMethodCompleted` | Event   | Indicates that another workflow's method  (used by the workflow) has completed.    |
| `remoteMethodFailed`    | Event   | Indicates that another workflow's method  (used by the workflow) has failed.   |
| `remoteMethodCanceled`  | Event   | Indicates that another workflow's method  (used by the workflow) has been canceled.     |
| `remoteMethodTimedOut`  | Event   | Indicates that another workflow's method  (used by the workflow) has timed out.      |
| `taskDispatched`    | Event   | Indicates that the workflow has dispatched a task.               |
| `taskCompleted`     | Event   | Indicates that a task (used by the workflow) has completed successfully.   |
| `taskFailed`        | Event   | Indicates that a task (used by the workflow) has failed.       |
| `taskTimedOut`      | Event   | Indicates that a task (used by the workflow) has  timed out.        |
  
