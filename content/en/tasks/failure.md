---
title: Task Failure
description: ""
position: 5.3
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Any exception occurring during a task execution is seen as a technical issue that
- is transient and can be fixed by automatic or manual retries,
- is permanent and needs a fix in the task implementation, followed by a manual retry.

<alert type="warning">

In all cases, don't forget to add a Logger in [workers](/components/architecture). Otherwise, no error will ever show up.

</alert>

If you are not sure how to add a Logger, see our [Hello World](/overview/hello-world#simple-logger) app to see an exemple.


## Automatic Retry

When an error occurs during task processing, the [task worker](/components/architecture) will catch it and apply the `getDurationBeforeRetry` method of the task implementation with the caugth exception to get a `java.time.Duration`:
- `null` means no retry
- a zero or negative duration triggers an immediate retry
- a positive duration triggers a delayed retry

<code-group><code-block label="Java" active>

```java
public class CarRentalServiceImpl implements CarRentalService {
    @Override
    public CarRentalResult book(CarRentalCart cart) {
        ...
    }

    @Override
    public Duration getDurationBeforeRetry(Exception e) {
        int n = context.getRetryIndex();
        if (n < 6) {
            return Duration.ofSeconds((long) (10 * Math.random() * Math.pow(2.0, n)));
        } else {
            return null;
        }
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


    override fun getDurationBeforeRetry(e: Exception): Duration? {
        val n = context.retryIndex
        return when {
            n < 12 -> Duration.ofSeconds((5 * Math.random() * 2.0.pow(n)).toLong())
            else -> null
        }
    }
}
```

  </code-block>
</code-group>

The exponential backoff strategy illustrated in the `getDurationBeforeRetry` method above is the actual default implementation of the abstract `io.infinitic.tasks.Task`. Other policies can be implemented using the [task context](/tasks/context). 

## Manual Retry

We can [manually retry a task](/clients/managing-tasks#retry-a-running-task) using an Infinitic client.

## Manual Cancel

We can [manually cancel a task](/clients/managing-tasks#cancel-a-running-task) using an Infinitic client.
