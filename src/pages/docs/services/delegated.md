---
title: Delegated Task
description: 
---

## Purpose

In certain situations, completing a task within the Service worker may not be feasible. For instance, when the task is overseen by a system external to Infinitic, and the worker cannot synchronously wait for its conclusion. In such cases, the Service worker delegates the task's completion, yet Infinitic still requires awareness of when the task is finished and the corresponding return value.

## Delegated task definition

To signify to Infinitic that a task remains incomplete upon the method's return, simply include a @Delegated annotation in your task definition. For instance,

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyService")
public interface MyService {
    @Delegated
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyService")
interface MyService {
    @Delegated
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput?

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

In the example above, the task `myFirstTask` is delegated.  It is the responsibility of the implementation to initiate the task on the external system. It's important to note that you still need to return an object of the correct type, but you have the option to return null.

## Delegated task completion

You can use an Infinitic client to signify to Infinitic that the delegated task is completed: 


{% codes %}

```java
client.completeDelegatedTask(
    serviceName,
    taskId,
    result
);
```

```kotlin
client.completeDelegatedTask(
    serviceName,
    taskId,
    result
)
```

{% /codes %}

Where:

* `serviceName`:  the name of the service. Within the task execution in the Infinitic worker, you can retrieve it through the [task's context](/docs/services/syntax#task-context);
* `taskId`: the ID of the task. Within the task execution in the Infinitic worker, you can retrieve it through the [task's context](/docs/services/syntax#task-context);
* `result`: The outcome of the delegated task. 

{% callout type="warning"  %}

It's your responsability to provide a `result` with the right type defined in the Service interface. Failing to do so will result in an error being triggered when you attempt to utilize this result in your workflow, and your workflow instance will become stuck.

{% /callout  %}
