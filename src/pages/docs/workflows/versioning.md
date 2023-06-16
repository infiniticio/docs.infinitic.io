---
title: Workflow Versioning
description: ""
---

## Changing the interface

### Class name

As a workflow is internally named through its interface's class name (including package), we need to keep it stable.
We can change it, as long as we use the [`@Name`](/docs/workflows/syntax#name-annotation) annotation to ensure that the internal name does not change.
For example,

{% codes %}

```java
package com.company.sequences;

public interface MySequence {
    RunOutput run(RunInput input);
}
```

```kotlin
package com.company.sequences

interface MySequence {
    fun run(input: RunInput): RunOutput
}
```

{% /codes %}

can be changed to:

{% codes %}

```java
package com.company.workflows;

import io.infinitic.annotations.Name;

@Name(name = "com.company.sequences.MySequence")
public interface MyWorkflow {
    RunOutput run(RunInput input);
}
```

```kotlin
package com.company.workflows

import io.infinitic.annotations.Name

@Name("com.company.sequences.MySequence")
interface MyWorkflow {
    fun run(input: RunInput): RunOutput
}
```

{% /codes %}

We recommend always using a `@Name` annotation - with a simple name - for all workflows, to avoid keeping legacy names like here.

### Method name

As a workflow is started through its interface's method name, we need to keep it stable.
We can change also it, as long as we use the `@Name` annotation to ensure that the internal name does not change.
For example,

{% codes %}

```java
public interface MyWorkflow {
    RunOutput run(RunInput input);
}
```

```kotlin
interface MyWorkflow {
    fun run(input: RunInput): RunOutput
}
```

{% /codes %}

can be changed to:

{% codes %}

```java
import io.infinitic.annotations.Name;

public interface MyWorkflow {
    @Name(name = "run")
    RunOutput execute(RunInput input);
}
```

```kotlin
import io.infinitic.annotations.Name;

interface MyWorkflow {
    @Name("run")
    fun execute(input: RunInput): RunOutput
}
```

{% /codes %}

### Method parameters

Parameters of the method used to start a workflow are serialized and stored in the workflow history.
During its execution, the workflow will deserialize the parameters and apply them to the current method multiple times - that's why:

{% callout type="warning"  %}

The signature of a workflow's method must not change.

{% /callout  %}

And if the only parameter of a workflow's method is object type (which is recommended):

{% callout type="warning"  %}

Any properties we add to this object type must have default values.

{% /callout  %}

### Method return value

If the return value is used in another workflow (as a result of a sub-workflow) - then the same constraint applies to the return value of a task:

{% callout type="warning"  %}

The return type of a workflow can not change.

{% /callout  %}

And if the return type is an object (which is recommended):

{% callout type="warning"  %}

Any properties we add to the return type must have default values.

{% /callout  %}

## Changing the implementation

### New workflows

The easiest way to update a workflow is to have the new instances use the latest version, while the current instances continue to run the version they were started with.

By convention:

- a new implementation will be named with a postfix `_n`, where `n` is an integer
- no postfix means version 0
For example:

{% codes %}

```java
package com.company.workflows;

import io.infinitic.workflows.Workflow;

public class MyWorkflow_1 extends Workflow implements MyWorkflow {
    public RunOutput run(input: RunInput) { 
      /* modified implementation */ 
    }
}
```

```kotlin
package com.company.workflows

import io.infinitic.workflows.Workflow

class MyWorkflowImpl_1 : Workflow(), MyWorkflow {
    override fun run(input: RunInput): RunOutput { /* */ }
}
```

{% /codes %}

Those multiple versions can be registered in workers, through the configuration file:

```yaml
workflows:
  - name: MyWorkflow
    classes:
      - com.company.workflows.MyWorkflowImpl
      - com.company.workflows.MyWorkflowImpl_1
      - com.company.workflows.MyWorkflowImpl_2
      - com.company.workflows.MyWorkflowImpl_3
    concurrency: 10
```

or through direct registration:

{% codes %}

```java
import io.infinitic.workers.InfiniticWorker;

public class App {
    public static void main(String[] args) {
        try(InfiniticWorker worker = InfiniticWorker.fromConfigFile("infinitic.yml")) {
            worker.registerWorkflow(
                // workflow name
                "com.company.workflows.MyWorkflow",                                                
                // workflow implementation classes
                List.of(
                    MyWorkflowImpl.class,
                    MyWorkflowImpl_1.class,
                    MyWorkflowImpl_2.class,
                    MyWorkflowImpl_3.class,
                ),
                // number of parallel processings
                10
            );
            worker.start();
        }
    }
}
```

```kotlin
import io.infinitic.workers.InfiniticWorker

fun main(args: Array<String>) {
    InfiniticWorker.fromConfigFile("infinitic.yml").use { worker ->
        worker.registerWorkflow(
            // workflow name
            "com.company.workflows.MyWorkflow", 
            // workflow implementation classes
            listOf( 
                MyWorkflowImpl::class.java
                MyWorkflowImpl_1::class.java
                MyWorkflowImpl_2::class.java
                MyWorkflowImpl_3::class.java
            ),
            // number of parallel processings
            10
        )
        worker.start()
    }
}
```

{% /codes %}

{% callout type="note"  %}

A newly dispatched workflow will automatically use the highest version available in the Workflow worker - and will stick to this version up to its completion.

{% /callout  %}

{% callout type="warning"  %}

Workflow workers should know all versions of a workflow for which at least one instance is still running.

{% /callout  %}

### Running workflows

Changing the implementation of an already running workflow is not yet supported by Infinitic.
