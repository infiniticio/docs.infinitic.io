---
title: Writing Workflows
description: ""
position: 4.1
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Here are an example of workflow implementation, from our <nuxt-link to="/overview/hello-world"> Hello World</nuxt-link> app:

<code-group><code-block label="Java" active>

```java
import hello.world.tasks.HelloWorldService;
import io.infinitic.workflows.Workflow;

public class HelloWorldImpl extends Workflow implements HelloWorld {
    private final HelloWorldService helloWorldService = task(HelloWorldService.class);

    @Override
    public String greet(String name) {
        String str = helloWorldService.sayHello(name);
        String greeting =  helloWorldService.addEnthusiasm(str);
        inline(() -> { System.out.println(greeting); return null; });

        return greeting;
    }
}
```
</code-block><code-block label="Kotlin">

```kotlin
import hello.world.tasks.HelloWorldService
import io.infinitic.workflows.Workflow
import io.infinitic.workflows.task

class HelloWorldImpl : Workflow(), HelloWorld {
    private val helloWorldService = task<HelloWorldService>()

    override fun greet(name: String?): String {
        val str = helloWorldService.sayHello(name)
        val greeting =  helloWorldService.addEnthusiasm(str)
        inline { println(greeting) }

        return  greeting
    }
}
```
</code-block></code-group>

As we can see above, a workflow is directly coded in plain java/kotlin - but the processing of this workflow is actually event-based, making Infinitic scalable and error-resilient.  

If you are interested how it works, please read [under the hood of a event-driven workflow engine](https://gillesbarbier.medium.com/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c).

Basically, at each step, the state of the workflow is automaticaly saved, including the status (runnning, completed...) and output  of previous steps. When something happens relevant to this workflow - for example a task completion - the workflow is processed again from the start, but the saved history is automaticaly used to skip everything already done.

*The workflow implementation must contain only the deterministic description of the flow of tasks*.

<alert type="warning">

A workflow class must 
- extend `io.infinitic.workflows.Workflow`
- be public and have an empty constructor
- have [serializable](/references/serializability) parameters and return value for its methods 

and be deterministic, without side effects, so:
- database request
- file access
- API call
- environment variables
- current date
- random values
- multi-threads
must not be used in workflows, but can and must be implemented in tasks.

</alert>

Infinitic lets us manage a lot:
- sequential tasks
- asynchronous tasks
- inlined tasks
- child branch
- child workflows
- handling external events
- waiting for completion
- error management