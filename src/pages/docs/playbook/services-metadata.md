---
title: Forwarding Workflow's Metadata To Services
description: .
---

{% callout type="note"  %}

The code examples for pages in this section are available on [Github](https://github.com/infiniticio/docs.playbook).

{% /callout %}

When dispatching a workflow, you can associate [metadata](/docs/workflows/implementation#meta) with it. 
This metadata can be useful for passing additional information or context to your workflows.

## Setting Metadata on Workflows

Here's how to set metadata when creating a workflow:

{% codes %}

```java
final HelloWorkflow helloWorkflow = newWorkflow(
    HelloWorkflow.class,
    null,
    Map.of(
        "foo", "bar".getBytes(),
        "baz", "qux".getBytes()
    )
);
```

```kotlin
private val helloWorkflow = newWorkflow(
    HelloWorkflow::class.java,
    meta = mapOf(
        "foo" to "bar".toByteArray(),
        "baz" to "qux".toByteArray()
    )
)
```

{% /codes %}

{% callout type="warning" %}

Important: This metadata is not automatically forwarded from workflows to tasks by default

{% /callout %}

## Forwarding Workflow Metadata to Services

To forward metadata from a workflow to its tasks, you need to explicitly pass it when creating a service stub within your workflow implementation:

{% codes %}

```java
public class MyWorkflowImpl extends Workflow implements MyWorkflow {

    private final MyService myService = newService(MyService.class, null, getMeta());
    
    ...
}
```

```kotlin
class MyWorkflowImpl : Workflow(), MyWorkflow {

    private val myService = newService(MyService::class.java, meta = meta)

    ...
}
```

{% /codes %}

By using `getMeta()` (Java) or `meta` (Kotlin) when creating the service stub, you ensure that all metadata associated with the workflow is forwarded to the services used by this workflow. Of course, you can add additional metada if needed.

## Benefits of Forwarding Metadata

Forwarding metadata from workflows to services can be advantageous for several reasons:

* Passing context-specific information throughout the process
* Enabling dynamic behavior based on metadata
* Facilitating debugging and tracing across workflow and service boundaries

By following this pattern, you can maintain consistent context and additional information flow from your workflows to your services, enhancing the flexibility and power of your distributed processes.