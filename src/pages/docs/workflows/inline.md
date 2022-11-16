---
title: Inline Tasks
description: ""
---

As stated previously, workflow's code is processed multiple times, so it should not contain non-deterministic instructions either any instruction with side effects. When this is the case, we must put those within a task. For simple instructions (as getting a random number or the current date), it can be tedious to do so.

The `inline` function provides an easy way to "inline" such a task. The provided lambda is processed by the workflow worker only the first time. After that, the returned value will be found directly from the workflow history.

{% callout type="warning"  %}

Inline tasks should be used only for instructions that can not fail.

{% /callout  %}

For example, we can use the current date in a workflow like this:

{% codes %}

```java
...
Date now = inline(() -> new Date());
...
```

```kotlin
...
val now = inline { Date() }
...
```

{% /codes %}

![Inline task](/img/inline-function@2x.png)

Typical use cases of inline tasks are:

- using environment variables
- using current date
- using random values
- logging

{% codes %}

```java
// get (non-determistic) env variable
String home = inline(() -> System.getEnv("JAVA_HOME"));

// get (non-determistic) current date
Date now = inline(() -> new Date());

// get (non-determistic) random value
Integer random = inline(() -> new Random().nextInt(1000));

// display (side-effect)
inlineVoid(() -> System.out.println("log"));

// logging (side-effect)
inlineVoid(() -> logger.info("starting"));
```

```kotlin
// get (non-determistic) env variable
val home = inline { System.getEnv("JAVA_HOME") }

// get (non-determistic) current date
val now = inline { Date() }

// get (non-determistic) random value
val random = inline { Random().nextInt(1000) }

// display (side-effect)
inline { println("log") }

// logging (side-effect)
inline { logger.info("starting") }
```

{% /codes %}
