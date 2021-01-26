---
title: Task Context
description: ""
position: 2.4
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

In some cases, we want to know more about the context of the execution of a task.

Infinitic lets us inject a `TaskAttemptcontext` object in task implementation. To do so, 
- add `infinitic-task-executor` dependency

  <code-group>
    <code-block label="Java" active>

  ```java[build.gradle]
  dependencies {
      ...
      implementation "io.infinitic:infinitic-task-executor:0.1.0-SNAPSHOT"
      ...
  }
  ```

    </code-block>
    <code-block label="Kotlin">

  ```kts[build.gradle.kts]
  dependencies {
      ...
      implementation("io.infinitic:infinitic-task-executor:0.1.0-SNAPSHOT")
      ...
  }
  ```

    </code-block>
  </code-group>

- add a property of `TaskAttemptcontext` type in your task

  <code-group>
    <code-block label="Java" active>

  ```java
  public class MyTaskImpl implements MyTask {
      // injecting context
      TaskAttemptContext context;
      
      ...
  }
  ```
    </code-block> 
    <code-block label="Kotlin">

  ```kotlin
  class MyTaskImpl : MyTask {
      // injecting context
      lateinit var context: TaskAttemptContext

      ..
  }
  ```
    </code-block>
  </code-group>

  This property will be injected by the [task executor](/references/architecture) when instantiating the task.

This context will contain the following data:

| Name                      | Type      | Description |
| ------------------------- | --------- | ----------- |
| `taskId`                  | string    | the id of the task
| `taskRetry`               | integer   | the number of times we manually retried this task
| `taskAttemptId`           | string    | the id of the current task attempt
| `taskAttemptRetry`        | integer   |  the number of times the task was automatically retried (reset to 0 after a manual retry)
| `previousTaskAttemptError`| Exception | if any, the exception thrown during the previous attempt
| `currentTaskAttemptError` | Exception | if any, the exception thrown during the current attempt

<img src="/task-retries.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/task-retries.png" class="dark-img" width="1280" height="640" alt=""/>
