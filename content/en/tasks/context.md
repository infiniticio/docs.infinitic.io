---
title: Task Context
description: ""
position: 5.4
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

In some cases, we want to know more about the context of the execution of a task. When running, a task instance has a `context` property containing the following data:

| Name            | Type            | Description                                                                              |
| --------------- | --------------- | ---------------------------------------------------------------------------------------- |
| `id`            | UUID            | the id of the task                                                                       |
| `workflowId`    | UUID            | the id of the parent workflow (may be null)                                              |
| `workflowName`  | String          | the name of the parent workflow (may be null)                                            |
| `attemptId`     | UUID            | the id of the current task attempt                                                       |
| `retrySequence` | int             | the number of times the task was manually retried                                        |
| `retryIndex`    | int             | the number of times the task was automatically retried (reset to 0 after a manual retry) |
| `lastError`     | Error           | if any, the error during the previous attempt                                            |
| `client`        | InfiniticClient | An PulsarInfiniticClient we may use inside the task                                            |

<img src="/task-retries@2x.png" class="img" width="1280" height="640" alt=""/>
