---
title: Child Workflows
description: ""
position: 4.3
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic lets us use child workflows like tasks. The `newWorkflow` function behaves as the `newTask` function but dispatches a (sub)workflow, instead of a task. When the (sub)workflow completes, the return value is sent back to the parent workflow.

The illustration below illustrates this, with a workflow of 3 sequential tasks:

<img src="/workflow-function@2x.png" class="img" width="640" height="640" alt=""/>

For example, a distributed (and inefficient) way to calculate `n!` is shown below, using n workflows, each of them - excepted the last one - dispatching a child-workflow.

<code-group><code-block label="Java" active>

```java
public class Calculate extends Workflow implements CalculateInterface {
    private final Calculate calculate = newWorkflow(CalculateInterface.class);

    @Override
    public Long factorial(Long n) {
        if (n > 1) {
          return n * calculate.factorial(n - 1);
        }
        return 1;
    }
}
```

</code-block> <code-block label="Kotlin">

```kotlin
class Calculate() : Workflow(), CalculateInterface {
    private val calculate = workflow<CalculateInterface>()

    override fun factorial(n: Long) = when {
        n > 1 -> n * workflow.factorial(n - 1)
        else -> 1
    }
}
```

</code-block></code-group>
