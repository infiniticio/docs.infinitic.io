---
title: Events Listener
description: Learn how to create and configure event listeners in Infinitic to capture and process internal events. Discover use cases for leveraging these events, including auditing, custom dashboards, performance monitoring, and integration with external systems.
---

Infinitic internal events provide valuable insights into the execution of your workflows and services. Here are some common use cases for leveraging these events:

* **Auditing**: Track every step of your workflow executions, including task completions, failures, and retries. This comprehensive audit trail can be crucial for compliance and debugging purposes.
* **Custom Dashboards**: Build real-time dashboards to visualize the performance and status of your workflows and services. Monitor metrics such as execution times, success rates, and throughput.
* **Event-Driven Actions**: Trigger custom actions or notifications based on specific events. For example, send alerts when a critical task fails or when a workflow completes successfully.
* **Performance Monitoring**: Analyze event data to identify bottlenecks, optimize resource allocation, and improve overall system performance.
* **Business Intelligence**: Gather insights about your business processes by analyzing workflow execution patterns and outcomes.
* **Integration with External Systems**: Use events to synchronize Infinitic's state with external systems or databases, ensuring consistency across your entire infrastructure.
* **SLA Monitoring**: Track events to ensure that your workflows and tasks are meeting defined Service Level Agreements (SLAs).
* **Workflow Versioning and Migration**: Use events to manage and track different versions of workflows, facilitating smooth transitions between versions.


## Event Listener Creation

Event listeners provide access to Infinitic's internal events in the standardized [CloudEvents](https://cloudevents.io) JSON format. This allows for easy integration with various systems and tools that support the CloudEvents specification.

{% callout  %}

The Cloud Events format is not the internal Infinitic format. It's intented to be used as an external format. This allows for internal updates without breaking changes.

{% /callout  %}

You can create an Infinitic worker with an event listener using either:
1. [Java/Kotlin builders](/docs/components/workers#event-listener)
2. [YAML configuration](/docs/components/workers#event-listener-2)

To implement an event listener, you need to provide an implementation of the `io.infinitic.cloudEvents.CloudEventListener` interface. This interface requires an `onEvents` method with the following signature:

{% codes %}

```java
void onEvents(List<CloudEvent> events);
``` 

```kotlin
fun onEvents(events: List<CloudEvent>)
```

{% /codes %}


{% callout type="warning"  %}

To implement this interface, you need to add `io.cloudevents:cloudevents-json-jackson` to the dependencies of your project.

{% /callout  %}

### Targeting Services

By default, the event listener will provide events for all Services. It will automatically refresh the list of services on a regular basis (one minute by default).

You can restrict the events to specific services:

```Yaml
eventListener:
  class: example.MyEventListener
  concurrency: 50
  services:
    allow:
      - example.MyService
      - example.MyOtherService
  ```

or

{% codes %}

```java
EventListenerConfig eventListener = EventListenerConfig.builder()
  .setListener(new MyEventListener())
  .setConcurrency(50)
  .allowServices(MyService.class, MyOtherService.class)
  .build();
``` 

```kotlin
val eventListenerConfig = EventListenerConfig.builder()
  .setListener(MyEventListener())
  .setConcurrency(50)
  .allowServices(MyService::class.java, MyOtherService::class.java)
  .build();
```

{% /codes %}

Here only the `MyService` and `MyOtherService` services will be targeted.

At the opposite, you can target all services except some:

```Yaml
eventListener:
  class: example.MyEventListener
  concurrency: 50
  services:
    disallow:
      - example.MyService
      - example.MyOtherService
  ```

or

{% codes %}

```java
EventListenerConfig eventListener = EventListenerConfig.builder()
  .setListener(new MyEventListener())
  .setConcurrency(50)
  .disallowServices(MyService.class, MyOtherService.class)
  .build();
``` 

```kotlin
val eventListenerConfig = EventListenerConfig.builder()
  .setListener(MyEventListener())
  .setConcurrency(50)
  .disallowServices(MyService::class.java, MyOtherService::class.java)
  .build();
```

Here all services except the `MyService` and `MyOtherService` services will be targeted.

{% /codes %}

### Targeting Workflows

The same logic applies to workflows. By default, the event listener will provide events for all workflows. It will automatically refresh the list of workflows on a regular basis (one minute by default).

You can restrict the events to specific workflows:

```Yaml
eventListener:
  class: example.MyEventListener
  concurrency: 50
  workflows:
    allow:
      - example.MyWorkflow
      - example.MyOtherWorkflow
  ``` 

or

{% codes %}

```java
EventListenerConfig eventListener = EventListenerConfig.builder()
  .setListener(new MyEventListener())
  .setConcurrency(50)
  .allowWorkflows(MyWorkflow.class, MyOtherWorkflow.class)
  .build();
```

```kotlin
val eventListenerConfig = EventListenerConfig.builder()
  .setListener(MyEventListener())
  .setConcurrency(50)
  .allowWorkflows(MyWorkflow::class.java, MyOtherWorkflow::class.java)
  .build();
``` 

{% /codes %}  

Here only the `MyWorkflow` and `MyOtherWorkflow` workflows will be targeted.

At the opposite, you can target all workflows except some:

```Yaml
eventListener:
  class: example.MyEventListener
  concurrency: 50
  workflows:
    disallow:
      - example.MyWorkflow
      - example.MyOtherWorkflow
  ``` 

or    

{% codes %}

```java
EventListenerConfig eventListener = EventListenerConfig.builder()
  .setListener(new MyEventListener())
  .setConcurrency(50)
  .disallowWorkflows(MyWorkflow.class, MyOtherWorkflow.class)
  .build();
``` 

```kotlin
val eventListenerConfig = EventListenerConfig.builder()
  .setListener(MyEventListener())
  .setConcurrency(50)
  .disallowWorkflows(MyWorkflow::class.java, MyOtherWorkflow::class.java)
  .build();
```

{% /codes %}
Here all workflows except the `MyWorkflow` and `MyOtherWorkflow` workflows will be targeted.

## Implementation Example

Here is an example of `CloudEventListener` implementation that writes the events to the standard output in json format:

{% codes %}
```java
package example.booking.services;

import io.cloudevents.CloudEvent;
import io.cloudevents.jackson.JsonFormat;
import io.infinitic.cloudEvents.CloudEventListener;

public class Listener implements CloudEventListener {
    @Override
    public void onEvents(List<CloudEvent> events) {
      for (CloudEvent event : events) {
        System.out.println(new String(new JsonFormat().serialize(event)));
      }
    }
}
```

```kotlin
package example.booking.services

import io.cloudevents.CloudEvent
import io.cloudevents.jackson.JsonFormat
import io.infinitic.cloudEvents.CloudEventListener

class Listener : CloudEventListener {
    override fun onEvents(events: List<CloudEvent>) {
      events.forEach { event ->
        println(String(JsonFormat().serialize(event)))
      }
  }
```

{% /codes %}
