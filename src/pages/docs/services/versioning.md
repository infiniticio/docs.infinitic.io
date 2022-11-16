---
title: Service Versioning
description: ""
---

## Changing the interface

### Class name

As a service is internally named through its interface's class name (including package), we need to keep it stable.
We can change it, as long as we use the [`@Name`](/docs/services/syntax#name-annotation) annotation to ensure that the internal name does not change.
For example,

{% codes %}

```java
package com.company.tasks;

public interface MyTasks {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.tasks

interface MyTasks {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

can be changed to:

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "com.company.tasks.MyTasks")
public interface MyService {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("com.company.tasks.MyTasks")
interface MyService {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

We recommend always using a `@Name` annotation - with a simple name - for all services,
to avoid keeping legacy names like here.

### Method name

As a task is named through its interface's method name, we need to keep it stable.
We can change also it, as long as we use the `@Name` annotation to ensure that the internal name does not change.
For example:

{% codes %}

```java
package com.company.tasks;

public interface MyTasks {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.tasks

interface MyTasks {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

can be changed to:

{% codes %}

```java
package com.company.tasks;

import io.infinitic.annotations.Name;

public interface MyTasks {
    @Name(name = "myFirstTask")
    MyFirstTaskOutput firstTask(MyFirstTaskInput input);

    @Name(name = "mySecondTask")
    MySecondTaskOutput secondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.tasks

import io.infinitic.annotations.Name

interface MyTasks {
    @Name("myFirstTask")
    fun firstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    @Name("mySecondTask")
    fun secondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

### Method parameters

When a method is dispatched, its parameters are serialized and transported through Pulsar up to a Service worker.
There, the parameters are deserialized and applied to an implementation of the service's method.

To guarantee that there is no discrepancy between the "caller" (the workflow) and the "receiver" (the service's method),

{% callout type="warning"  %}

The signature of a task must not change.

{% /callout  %}

And if the only parameter is of object type (which is recommended):

{% callout type="warning"  %}

Any properties we add to this object type must have default values.

{% /callout  %}

### Method return value

when a workflow runs through a task already completed, it gets the return value by deserializing data from the workflow history.
To guarantee that there is no discrepancy between the "sender" (the service's method) and the "receiver" (the workflow),

{% callout type="warning"  %}

The return type of a task can not change.

{% /callout  %}

And if the return type is an object (which is recommended):

{% callout type="warning"  %}

Any properties we add to the return type must have default values.

{% /callout  %}

## Changing the implementation

As long as we follow the above recommendations to modify their interfaces,
the implementation itself of the services can be modified without any particular constraints.
