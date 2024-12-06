---
title: How To Extend Existing Applications With Infinitic
description: Learn how to integrate Infinitic with your existing applications, services and event systems. Discover strategies for extending your architecture with workflow orchestration, event handling, and observability while preserving your current infrastructure.
---

If you’re considering introducing Infinitic into your stack to leverage its orchestration pattern, event-driven architecture, and built-in observability, you might be wondering how 
to do it using your existing services and event systems.


## Starting Workflows

You can trigger new workflow instances from any external source using the [Infinitic client](/docs/clients/start-workflow). Common integration points include:
- Webhook endpoints
- Application servers
- Message broker consumers (Kafka, RabbitMQ, etc.)

![Start Workflow](/img/existing-start-workflow.png)

When starting workflows, you can attach tags (e.g., `orderId:123`) to identify and track workflow instances using your existing business identifiers. This allows you to later interact with specific workflows without needing to know their internal workflow IDs.

## Interacting With Running Workflows

Infinitic provides two main ways to interact with running workflows from external systems:

1. [Parallel Methods](/docs/workflows/parallel#parallel-methods) - Start new concurrent execution branches
2. [Channels](/docs/workflows/signals) - Send signals that workflows can wait for and react to

![Signal Workflow](/img/existing-signal-workflow.png)

You can target specific workflow instances using tags that match your business identifiers (e.g., `orderId:123`). This makes it easy to route events from your existing systems to the relevant workflow instances.

For example, if you have an order status update event from Kafka with orderId `123`, you can use that orderId to send a signal to all workflows tagged with `orderId:123`.

## Using Existing Services

You can easily incorporate your existing services (REST APIs, gRPC services, etc.) into Infinitic by calling them from within Infinitic Service [implementation](/docs/services/implementation#using-apis):

![Using existing services](/img/existing-services.png)

By wrapping your existing service calls within Infinitic services, you automatically gain:
- Robust [retry handling](/docs/services/deployment#retry-policy) for failed calls
- Efficient [batch processing](/docs/services/deployment#batching) capabilities 
- Configurable [timeout management](/docs/services/deployment#execution-timeout)
- Ability to handle errors gracefully using [workflow error handling](/docs/workflows/errors#try-catch-in-workflows)

## Monitoring Workflow Events

Infinitic emits internal events that provide detailed insights into workflow and service execution. You can subscribe to these events to:

- Track workflow progress and completion
- Monitor service task execution and failures 
- Measure performance and SLA compliance
- Build custom dashboards and audit trails
- Integrate with existing monitoring systems

This functionality is available through [Infinitic event listeners](/docs/events/creation) which can forward events to your monitoring stack.

![Infinitic Event Listener](/img/existing-event-listener.png)

## Summary

Infinitic provides multiple integration points to extend your existing applications:

- **Start New Workflows** - Trigger workflows from any external source using the client API
- **Interact With Running Workflows** - Send signals and start parallel methods using business identifiers
- **Use Existing Services** - Wrap existing APIs and services with robust retry and error handling
- **Monitor Workflow Events** - Subscribe to internal events for monitoring and auditing

This flexibility allows you to gradually adopt workflow orchestration while leveraging your existing systems and infrastructure.

![Extending Existing Applications With Infinitic](/img/existing-all.png)
