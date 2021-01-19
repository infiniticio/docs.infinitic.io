---
title: Introduction
description: ""
position: 1.1
category: "Overview"
---

<!-- <img src="/preview.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/preview-dark.png" class="dark-img" width="1280" height="640" alt=""/> -->

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow progress.

</alert>

Infinitic is a framework based on [Apache Pulsar](https://pulsar.apache.org/) that considerably eases development when building distributed apps. By using Infinitic, you considerably decrease the time to build a production-ready app, but also you build your app on
<nuxt-link to="#reliability"> reliable </nuxt-link> and <nuxt-link to="#scalability"> scalable </nuxt-link> foundations that preserve you from a lot of bugs down the road.

A lot of issues arise when you build and scale a distributed system - issues you don’t have in a single-process one. Infinitic provides a simple but powerful SDK that lets developers build distributed applications as if they were building on an infallible single-process system. It does this on top of Pulsar to benefit from its scalability and reliability.

In particular, Infinitic is very good at running workflows, ie. at orchestrating tasks executed by different services according to any complex scenario. Infinitic will automatically maintain and store the states of your tasks and workflows, ensuring that a failure somewhere will never break your workflows:

- a failed task will be automatically retried based on the retry strategy you have chosen
- a workflow will automatically resume from where it previously failed

At last, Infinitic lets you <nuxt-link to="#monitoring"> monitor </nuxt-link> everything occurring inside your app through dashboards.

Possible use cases such are:

- microservices orchestration
- distributed transactions (payments...)
- data pipelines operations
- business processes implementation
- etc.

<img src="/introduction-architecture.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/introduction-architecture.png" class="dark-img" width="1280" height="640" alt=""/>

## Workflow As Code

Infinitic follows a [_workflow as code_](https://medium.com/swlh/code-is-the-best-dsl-for-building-workflows-548d6824f549) pattern. It means that you can describe your workflow using a programming language instead of a DSL (in JSON or Yaml for example).

<alert type="Info">

Currently, tasks and workflows can be described in Java or Kotlin only. More programming languages could be supported later. We have working examples of code running tasks in node.js.

</alert>

For example, this code let you process 3 tasks (`ImageUtil::download`, `ImageUtil::resize`, `ImageUtil::upload`) sequentially:

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

Writing workflows like this add a lot of values:

- versatility: you can use loops, conditions, data manipulations instructions provided by the programming language, without being limited by the capabilities of a DSL
- fewer bugs: task interfaces provide unambiguous contracts that will prevent a lot of bugs
- clarity: your workflows are defined in a single file, easy to understand, and are versioned like any other code
