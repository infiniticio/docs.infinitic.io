---
title: Metrics
description: Learn how Infinitic exposes worker metrics through Micrometer, how to enable them, and how to interpret each metric name and tag.
---

Infinitic can publish worker metrics through Micrometer.

Metrics are disabled by default and start being emitted only when a `MeterRegistry` is attached to a worker before it starts. See [Infinitic Workers](/docs/components/workers#metrics) for the configuration.

{% callout %}

Infinitic emits metrics, but it does not choose your monitoring backend for you. Exporting these metrics to Prometheus, Datadog, OpenTelemetry, or another system depends on the Micrometer registry you configure in your application.

{% /callout %}

## Scope

These metrics describe what happens inside an Infinitic worker:

- message handling after a message has been received
- message deserialization on the consumer side
- message processing inside worker components
- outbound message serialization before sending

These are worker metrics. Infinitic clients do not emit them.

## Metric Tags

All metrics use Micrometer tags to help you split dashboards and alerts by worker, topic, and message family.

| Tag | Meaning |
| --- | --- |
| `worker_name` | The effective name of the running worker. In most cases this matches the worker name you configured, but the metric always uses the final runtime worker name. |
| `topic` | The resolved transport topic name used by the worker. This is the actual topic name seen by the transport, not just a logical service or workflow name. |
| `message_type` | The runtime Infinitic message class being processed or serialized on that topic. This is not your task input type, your workflow class, or your service implementation class. |

## Metric Catalog

The catalog is grouped by semantic area to keep it readable on narrow screens.

### Consumer Handling

#### `infinitic.consumer.message.handling`

- Type: `Timer`
- Tags: `worker_name`, `topic`
- Meaning: time spent by one received message inside the worker until handling is finished and the message is acknowledged or negatively acknowledged.

#### `infinitic.consumer.message.handling.in_flight`

- Type: `Gauge`
- Tags: `worker_name`, `topic`
- Meaning: number of messages from this topic that have already been received by the worker and are not fully completed yet.

### Consumer Deserialization

#### `infinitic.consumer.message.deserialization`

- Type: `Timer`
- Tags: `worker_name`, `topic`
- Meaning: time spent deserializing one received message from the transport format into an Infinitic message.

#### `infinitic.consumer.message.deserialization.in_flight`

- Type: `Gauge`
- Tags: `worker_name`, `topic`
- Meaning: number of messages from this topic that are currently being deserialized.

### Consumer Processing

#### `infinitic.consumer.message.processing`

- Type: `Timer`
- Tags: `worker_name`, `topic`, `message_type`
- Meaning: time spent executing the worker logic for one message of this type, after deserialization.

#### `infinitic.consumer.message.processing.in_flight`

- Type: `Gauge`
- Tags: `worker_name`, `topic`, `message_type`
- Meaning: number of messages of this type that are currently being processed by the worker.

### Producer Serialization

#### `infinitic.producer.message.serialization`

- Type: `Timer`
- Tags: `worker_name`, `topic`, `message_type`
- Meaning: time spent serializing one outbound message before it is sent to the transport.

#### `infinitic.producer.message.serialization.in_flight`

- Type: `Gauge`
- Tags: `worker_name`, `topic`, `message_type`
- Meaning: number of outbound messages of this type that are currently being serialized.

## How To Read These Metrics

### Handling

`infinitic.consumer.message.handling` answers a simple question: once a worker has received a message from a topic, how long does it keep that message before the handling is fully finished?

This makes it the best high-level metric for tracking pressure inside a worker.

`infinitic.consumer.message.handling.in_flight` shows how many messages are currently in that state for each topic.

### Deserialization

`infinitic.consumer.message.deserialization` isolates the cost of turning transport data into Infinitic messages.

Use it when you want to distinguish transport or payload decoding cost from the rest of the processing time.

`infinitic.consumer.message.deserialization.in_flight` shows how many messages are currently being deserialized.

### Processing

`infinitic.consumer.message.processing` measures the time spent in the worker component itself once a message is ready to be processed.

Because it is tagged with `message_type`, it helps you distinguish the behavior of different kinds of Infinitic messages sharing the same topic.

`infinitic.consumer.message.processing.in_flight` shows how many messages of a given `message_type` are currently being processed.

### Producer Serialization

`infinitic.producer.message.serialization` measures the time spent serializing outbound messages before they are handed to the transport layer.

`infinitic.producer.message.serialization.in_flight` shows how many outbound messages of a given `message_type` are currently being serialized.

{% callout %}

Producer serialization metrics are emitted only when the transport performs an actual serialization step before sending. With the in-memory transport there is no serialization step, so these producer serialization metrics are not emitted.

{% /callout %}

## Batching Semantics

Batching does not change the meaning of the metrics.

Metrics remain message-based, not batch-based:

- timer counts increase per message, even when messages are processed in batches
- `message_type` still separates each runtime message type inside a mixed batch
- gauges represent the number of messages currently in flight, not the number of batches

This makes dashboards easier to compare between batched and non-batched workers.
