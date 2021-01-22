---
title: Concepts
description: ""
position: 1.2
category: "Overview"
fullscreen: true
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

## Tasks and Workflows

In Infinitic terminology, functions in services are called "tasks" . A task is a function that "does something". The actual implementation of a task can be limited to a single call to a database or an API, or can be a complex domain-driven action. Tasks are invoked asynchronously through queues (Pulsar topics).

Infinitic lets you add orchestrator services with "workflow" functions, whose mission is to orchestrate task execution, according to any scenario.

<img src="/concept-introduction.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/concept-introduction.png" class="dark-img" width="1280" height="640" alt=""/>


## Workflow As Code

Infinitic follows a [_workflow as code_](https://medium.com/swlh/code-is-the-best-dsl-for-building-workflows-548d6824f549) pattern. It means that you can describe your workflow using Java or Kotlin instead of using JSON or Yaml files for example.

<alert type="info">

Currently, tasks and workflows can be described in Java or Kotlin only. More programming languages could be supported later. We already have some experimental workers running in node.js.

</alert>

For example, this code orchestrates the sequential processings of the 3 tasks `ImageUtil::download`, `ImageUtil::resize`, `ImageUtil::upload` that may be executed on different servers:

<code-group>
  <code-block label="Java" active>

```java
import io.infinitic.workflows.*;

// tasks signatures
public interface ImageUtil {
    byte[] download(url: String);
    byte[] resize(image: ByteArray, size: Int);
    String upload(image: ByteArray);
}

// workflow description
public class ImageCropping extends WorkflowBase {
    private final ImageUtil imageUtil = task(ImageUtil.class);

    String handle(String email, String imageUrl) {
        // 1st task: download image as a binary
        byte[] image = imageUtil.download(imageUrl);
        // 2nd task: resize binary
        byte[] resizedImage = imageUtil.resize(image, size);
        // 3rd task: upload new image and get an url as result
        return imageUtil.upload(resizedImage);
    }
}
```

  </code-block>
  
  <code-block label="Kotlin">

```kotlin
import io.infinitic.workflows.*

// tasks signatures
interface ImageUtil {
    fun download(url: String): ByteArray
    fun resize(image: ByteArray, size: Int): ByteArray
    fun upload(image: ByteArray): String
}

// workflow description
class ImageCropping: WorkflowBase() {
    private val imageUtil = task<ImageUtil>()

    fun handle(email: String, imageUrl: String) {
        // 1st task: download image as a binary
        val image = imageUtil.download(imageUrl)
        // 2nd task: resize binary
        val resizedImage = imageUtil.resize(image, size)
        // 3rd task: upload new image and get an url as result
        return imageUtil.upload(resizedImage)
    }
}
```

  </code-block>
</code-group>

We can see with this example that Infinitic lets us build distributed applications as if we were building on an infallible single-process system.

Writing workflows with Infinitic brings a lot of benefits:

- **versatility**: you can use loops, conditions, data manipulations instructions provided by the programming language, without being limited by the capabilities of a DSL
- **maintainability**: your workflows are easy to understand, located defined at one place, and are versioned like any other piece of code
- **observability**: everything is closely monitored and exposed on dashboards
- **reliability**: workflows are immune to service / worker failures

