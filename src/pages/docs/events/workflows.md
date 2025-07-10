---
title: Workflow Events
description:
---

## Description

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
    "infiniticVersion" : "0.18.1"
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
| `dispatch`               | Command | A new workflow has been scheduled.             |
| `dispatchMethod`         | Command | A new method execution has been scheduled on an existing workflow.    |
| `cancel`                 | Command | The cancellation of a workflow has been requested.      |
| `cancelMethod`           | Command | The cancellation of a workflow's method has been requested.   |
| `retryTask`              | Command | The retry of some tasks has been requested.          |
| `retryExecutor`          | Command | The retry of the workflow executor has been requested.      |
| `signal`                 | Command | A signal has been sent to the workflow.          |
| `signalReceived`         | Event   | The workflow has received a signal.       |
| `signalDiscarded`        | Event   | The workflow has discarded a signal that was unexpected.     |
| `signalDispatched`       | Event   | The workflow has sent a signal to another workflow.     |
| `timerDispatched`        | Event   | The workflow has dispatched a timer.       |
| `timerCompleted`         | Event   | A timer, used by the workflow, has completed.     |
| `remoteMethodDispatched` | Event   | The workflow has dispatched another workflow's method. |
| `remoteMethodCompleted`  | Event   | Another workflow's method, used by the workflow, has completed.    |
| `remoteMethodFailed`     | Event   | Another workflow's method, used by the workflow, has failed.   |
| `remoteMethodCanceled`   | Event   | Another workflow's method, used by the workflow, has been canceled.     |
| `remoteMethodTimedOut`   | Event   | Another workflow's method, used by the workflow, has timed out.      |
| `taskDispatched`         | Event   | The workflow has dispatched a task.               |
| `taskCompleted`          | Event   | A task, used by the workflow, has completed successfully.   |
| `taskFailed`             | Event   | A task, used by the workflow, has failed.       |
| `taskTimedOut`           | Event   | A task, used by the workflow, has timed out.        |

{% callout type="note"  %}

The `source` property describes the Pulsar cluster, tenant, and namespaces, as well as the workflow's name. However this property does not represent an actual Pulsar topic, as the events originate from multiple internal topics.

{% /callout  %}