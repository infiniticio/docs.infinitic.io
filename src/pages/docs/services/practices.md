---
title: Good Practices
description: 
---
## Constraints

Upon receiving a message instructing to execute a task, a service worker instantiates the service class, deserializes the parameters, executes the requested method and returns the serialized result:

{% callout type="warning"  %}

The parameters and return value of a method used as task must be [serializable](/docs/references/serialization).

{% /callout  %}

If we chose to have several executions in parallel (`concurrency` > 1), they must not interfere with each other:

{% callout type="warning"  %}

A method used as a task must be thread-safe.

{% /callout  %}

If our method uses multi-threading, **we should keep in mind that a task is considered completed when the method returns**. Any exception occurring on another thread than the one that initiated the execution of the task will be ignored.

## Recommendations

For an easier [versioning of services](/docs/services/versioning), we recommend:

{% callout type="note"  %}

Each service should be given a simple name through the [@Name](#name-annotation) annotation.

Methods used as tasks should have:
 - One parameter of a dedicated type object
 - A return value of a dedicated type object

{% /callout  %}

For example,

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyService")
public interface MyService {
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyService")
interface MyService {
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}


## @Name Annotation

A task instance is internally described by both its full java name (package included) and the name of the method called.

We may want to avoid coupling this name with the underlying implementation, for example if we want to rename the class or method, or if we mix programming languages.

Infinitic provides a `@Name` annotation that let us declare explicitly the names that Infinitic should use internally. For example:

{% codes %}

```java
package com.company.services;

import io.infinitic.annotations.Name;

@Name(name = "MyNewServiceName")
public interface MyService {

    @Name(name = "FirstTask")
    MyFirstTaskOutput myFirstTask(MyFirstTaskInput input);

    @Name(name = "SecondTask")
    MySecondTaskOutput mySecondTask(MySecondTaskInput input);
}
```

```kotlin
package com.company.services

import io.infinitic.annotations.Name

@Name("MyNewServiceName")
interface MyService {
    
    @Name("FirstTask")
    fun myFirstTask(input: MyFirstTaskInput): MyFirstTaskOutput

    @Name("SecondTask")
    fun mySecondTask(input: MySecondTaskInput): MySecondTaskOutput
}
```

{% /codes %}

When using this annotation, the Service `name` setting in [Service worker](/docs/services/workers) configuration file should be the one provided by the annotation:

```yaml
services:
  - name: MyNewServiceName
    class: com.company.services.MyServiceImpl
```
