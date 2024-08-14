---
title: Forwarding Workflow's Tags To Services
description: .
---

{% callout type="note"  %}

The code examples for pages in this section are available on [Github](https://github.com/infiniticio/docs.playbook).

{% /callout %}

When dispatching a workflow, you can associate [tags](/docs/workflows/syntax#tags) with it. 
These tags can be useful for categorization, filtering, or tracking purposes.

## Setting Tags on Workflows

Here's how to set tags when creating a workflow:

{% codes %}

```java
final HelloWorkflow helloWorkflow = newWorkflow(
    HelloWorkflow.class,
    Set.of("userId" + userId, "companyId" + companyId)
);
```

```kotlin
val helloWorkflow = newWorkflow(
    HelloWorkflow::class.java, 
    tags = setOf("userId:$userId", "companyId:$companyId")
)
```

{% /codes %}

{% callout type="warning" %}

Important: Tags are not automatically forwarded from workflows to tasks by default.

{% /callout %}

## Forwarding Workflow Tags to Tasks

To forward tags from a workflow to its tasks, you need to explicitly pass them when creating a service stub within your workflow implementation:

{% codes %}

```java
public class MyWorkflowImpl extends Workflow implements MyWorkflow {

    private final MyService myService = newService(MyService.class, getTags());
    
    ...
}
```

```kotlin
class MyWorkflowImpl : Workflow(), MyWorkflow {

    private val myService = newService(MyService::class.java, tags = tags)

    ...
}
```

{% /codes %}

By using `getTags()` (Java) or `tags` (Kotlin) when creating the service stub, you ensure that all tags associated with the workflow are forwarded to the tasks executed by this service. You can still add additional tags to your tasks if needed.

## Benefits of Forwarding Tags
Forwarding tags from workflows to tasks can be beneficial for several reasons:

* Consistent tracking across the entire process
* Easier debugging and log analysis
* Improved filtering capabilities in monitoring tools

By following this simple pattern, you can maintain tag consistency throughout your workflow and task executions.