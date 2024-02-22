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
  "id" : "018dcb5f-aab3-705b-b6a6-083581389dc8",
  "source" : "pulsar://localhost:6650/infinitic/test9/workflows/HelloWorkflow",
  "type" : "infinitic.workflow.taskCompleted",
  "datacontenttype" : "application/json",
  "subject" : "018dcb5f-a644-7a95-9375-ed68eb3082fb",
  "time" : "2024-02-21T11:14:20.964Z",
  "data" : {
    "taskCompleted" : {
      "result" : "Hello 0!",
      "taskId" : "018dcb5f-aa4e-7ce2-9e64-6ba78d282c1f",
      "taskName" : "addEnthusiasm",
      "serviceName" : "HelloService"
    },
    "methodId" : "018dcb5f-a644-7a95-9375-ed68eb3082fb",
    "methodName" : "greet",
    "workflowName" : "HelloWorkflow",
    "workflowVersion" : 0,
    "workerName" : "standalone-13907-104",
    "infiniticVersion" : "0.13.0"
  }
}
```

For all workflow events:

- `id` serves as a unique identifier for the event.
- `subject` denotes the workflow's ID.
- `time` indicates the publishing time of the event.
- `type` is prefixed with `infinitic.workflow.*`, where `*` corresponds to one of the following:

| CloudEvent's type postfix    | Type  | Description                                                                                        |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `start`               | Command | A new workflow has been scheduled.             |
| `startMethod`         | Command | A new method execution has been scheduled on an existing workflow.    |
| `cancel`              | Command | The cancellation of a workflow has been requested.      |
| `cancelMethod`        | Command | The cancellation of a workflow's method has been requested.   |
| `retryTask`           | Command | The retry of some tasks has been requested.          |
| `retryExecutor`       | Command | The retry of the workflow executor has been requested.      |
| `signal`              | Command | A signal has been sent to the workflow.          |
| `signalReceived`      | Event   | The workflow has received a signal.       |
| `signalDiscarded`     | Event   | The workflow has discarded a signal that was unexpected.     |
| `signalDispatched`    | Event   | The workflow has sent a signal to another workflow.     |
| `timerDispatched`     | Event   | The workflow has dispatched a timer.       |
| `timerCompleted`      | Event   | A timer, used by the workflow, has completed.     |
| `remoteMethodDispatched`| Event   | The workflow has dispatched another workflow's method. |
| `remoteMethodCompleted` | Event   | Another workflow's method, used by the workflow, has completed.    |
| `remoteMethodFailed`    | Event   | Another workflow's method, used by the workflow, has failed.   |
| `remoteMethodCanceled`  | Event   | Another workflow's method, used by the workflow, has been canceled.     |
| `remoteMethodTimedOut`  | Event   | Another workflow's method, used by the workflow, has timed out.      |
| `taskDispatched`    | Event   | The workflow has dispatched a task.               |
| `taskCompleted`     | Event   | A task, used by the workflow, has completed successfully.   |
| `taskFailed`        | Event   | A task, used by the workflow, has failed.       |
| `taskTimedOut`      | Event   | A task, used by the workflow, has  timed out.        |

{% callout type="note"  %}

The `source` property describes the Pulsar cluster, tenant, and namespaces, as well as the workflow's name. However this property does not represent an actual Pulsar topic, as the events originate from multiple internal topics.

{% /callout  %}