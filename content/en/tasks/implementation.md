---
title: Writing Task
description: ""
position: 2.1
category: "Tasks"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

The execution of a task or a workflow can be triggered by a client, or from a workflow. The interface of a task or a workflow defines the contract to be shared with clients or workflows, for them to trigger an execution. For example:

<code-group>
  <code-block label="Java" active>

```java
public interface ImageUtil {
    byte[] download(url: String);
    byte[] resize(image: ByteArray, size: Int);
    String upload(image: ByteArray);
}

```

  </code-block>
  
  <code-block label="Kotlin">

```kotlin
interface ImageUtil {
    fun download(url: String): ByteArray
    fun resize(image: ByteArray, size: Int): ByteArray
    fun upload(image: ByteArray): String
}
```

  </code-block>
</code-group>

> Note: by abuse of language, we will speak of the interface of the task or workflow when it is in reality the interface of the class whose one method is the actual task or workflow.

## Writing a task

A task is simply a method from a Java/Kolin class. When a TaskExecutor receives the instruction to start a task, it receives:
- the name of the class
- the name of the method
- the parameters of the method (serialized)
Then an 

- must be public
- must have a void constructor


<alert type="warning">

Task's class must have an empty constructor. 

</alert>


## Serialization


## Retries

<img src="/task-retries.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/task-retries.png" class="dark-img" width="1280" height="640" alt=""/>

## Timeouts