---
title: Task Failure
description: ""
position: 4.3
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic considers that we [do NOT use exception in your tasks as control flow](https://dzone.com/articles/exceptions-as-controlflow-in-java). Any exception occurring is seen as a technical issue that

- can be transient and fixed by automatic retries
- or can necessitate a fix in the implementation followed by a manual retry.

<alert type="warning">

Don't forget to add a Logger in [workers](/overview/architecture). Otherwise, no error will show up.

For an example, see our [Hello World](/overview/hello-world#simple-logger) app.

</alert>

## Automatic Retry

When an error occurs during task processing, the [task executor](/overview/architecture) will catch it and check the existence of a `getRetryDelay` method. If it exists, Infinitic will retry the task after the delay provided.

<code-group>
  <code-block label="Java" active>

```java
public class CarRentalServiceImpl implements CarRentalService {
    @Override
    public CarRentalResult book(CarRentalCart cart) {
        ...
    }

    // in case of error, task will be retried after 5 seconds
    public Float getRetryDelay() {
        return 5F;
    }
}
```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
class CarRentalServiceFake : CarRentalService {
    override fun book(cart: CarRentalCart): CarRentalResult {
        ...
    }


    // in case of error, task will be retried after 5 seconds
    fun getRetryDelay() = 5F
}
```

  </code-block>
</code-group>

Of course, more sophisticated policy can be implemented using [task context](/task-executor/task-context). For exemple, implementing an exponential backoff strategy - widely used when calling APIs - can be done with:

<code-group>
  <code-block label="Java" active>

```java
public class CarRentalServiceImpl implements CarRentalService {
    // injecting context
    TaskAttemptContext context;

    @Override
    public CarRentalResult book(CarRentalCart cart) {
        ...
    }

    // Exponential-backoff strategy
    public Double getRetryDelay() {
        int n = context.getTaskAttemptRetry();
        if (n < 12) {
            return 5 * Math.random() * Math.pow(2.0, n);
        }
        // no retry after 12 attempts
        return null;
    }
}
```

  </code-block> 
  <code-block label="Kotlin">

```kotlin
class CarRentalServiceFake : CarRentalService {
    // injecting context
    lateinit var context: TaskAttemptContext

    override fun book(cart: CarRentalCart): CarRentalResult {
        ...
    }

    // Exponential-backoff strategy
    fun getRetryDelay(): Double? {
        val n = context.taskAttemptRetry
        if (n < 12) {
            return 5 * Random.nextFloat() * 2.0.pow(n)
        }
        // no retry after 12 attempts
        return null;
    }
}
```

  </code-block>
</code-group>

<alert type="info">

[Task context](/task-executor/task-context) contains more info that can be useful to fine-tune your retry strategy, such as the thrown exception or if the task was already manually retried.

</alert>

## Manual Retry

We can [manually retry a task](/clients/managing-tasks#retry-a-running-task) using an Infinitic client.

## Manual Cancel

We can [manually cancel a task](/clients/managing-tasks#cancel-a-running-task) using an Infinitic client.
