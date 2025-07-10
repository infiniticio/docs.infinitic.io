---
title: Service Events
description: Learn how to access and utilize Infinitic internal events in CloudEvent JSON format for auditing, custom dashboards, logging, and more. Discover how to configure event listeners for your services to handle events efficiently.
---

## Description

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
    "infiniticVersion" : "0.18.1"
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
| `infiniticVersion`  | String   | Version of Infinitic used by the entity that published the event (e.g., ":0.18.1"). |

{% callout type="note"  %}

The `source` property describes the Pulsar cluster, tenant, and namespaces, as well as the service's name. However this property does not represent an actual Pulsar topic, as the events originate from multiple internal topics.

{% /callout  %}