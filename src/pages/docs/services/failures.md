---
title: Task Failures In Detail
description: A comprehensive guide to understanding and handling various types of task failures in Infinitic.
---

Task processing can encounter failures at various stages within the Service Executor. Here are the key stages where failures may occur and how to handle them:

1. **Task Preparation**: During the setup phase before the actual task execution begins.
2. **Task Execution**: While the task is running, which can be due to:
   - An exception being thrown within the task code.
   - The task exceeding its defined timeout limit.
3. **Task Finalization**: When serializing the output and acknowledging the message to the broker.

Each of these failure types requires different handling strategies, which are detailed in the following sections.

## Exception During Task Preparation

The task preparation phase includes:
- Instantiating the Service class
- Deserializing the method arguments
- Processing the (optional) `getTimeoutSeconds` function, if an execution timeout is set

If any exception occurs during this phase, the task is immediately marked as failed, and this information is sent to the workflow that dispatched the task. Retrying is not attempted because these operations should be deterministic. Additionally, the message is acknowledged to prevent reprocessing.

These errors typically stem from issues in the implementation code of the Services during the development phase. If it happens in production, you should:
1. Deploy a fix for the underlying code issue.
2. [Retry the failed tasks](/docs/clients/retry-failed-tasks) once the fix is in place.

## Exception During Task Execution

An exception during the execution occurs:

- If the Service implementation throws this exception.
- When the execution runs for longer than the defined execution timeout.

When an exception is thrown by the Service implementation during the execution of a task:
- The exception is caught and logged (as a warning).
- The task is automatically scheduled for retry, based on its [retry policy](/docs/services/syntax#task-retries).
- The underlying message is acknowledged.

If the maximum number of retries is reached, the task is immediately marked as failed, logged as an error, and this information is sent to the workflow that dispatched the task.

In this situation, you should:
1. Deploy a fix for the underlying code issue, if any.
2. [Retry the failed tasks](/docs/clients/retry-failed-tasks) once the fix is in place.

## Exception During Task Finalization

The task finalization phase includes:
- Serializing the output of the task.
- Sending the result to the workflow that requested the task.

If any exception occurs during the serialization of the output, the task is immediately marked as failed, and this information is sent to the workflow that dispatched the task. Retrying is not attempted because the operation is deterministic. Additionally, the message is acknowledged to prevent reprocessing.

In this case, you should:
1. Deploy a fix for the serialization issue.
2. [Retry the failed tasks](/docs/clients/retry-failed-tasks) once the fix is in place.
