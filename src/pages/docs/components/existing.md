---
title: Integration Into An Existing Infrastructure
description: Learn how to integrate Infinitic with your existing infrastructure, including message brokers like Kafka and RabbitMQ, webhooks, and API-based services. Enhance your event-driven architecture with dynamic workflows, advanced signals, and seamless integration into existing microservices, while leveraging tags, retries, and batch processing for optimal performance.
---

Organizations often find themselves managing existing event infrastructure (like RabbitMQ, Kafka, Google Pub/Sub, and webhooks) or existing HTTP-based microservices.

Infinitic seamlessly integrates with existing infrastructures. You can enhance them with sophisticated workflow capabilities, allowing you to handle complex business processes with ease.


## Using Existing Events To Start Workflows

Infinitic enables you to dynamically start workflows using the Infinitic client, integrating seamlessly with your existing infrastructure. This includes triggering workflows from webhooks, application servers, or events processed by message brokers like Kafka, RabbitMQ, or similar systems.

![Start Workflow](/img/existing-start-workflow.png)

Below is an example of a workflow interface for order fulfillment. This workflow listens for events like `OrderStartedEvent` and `OrderUpdatedEvent` to manage the order lifecycle:

{% codes %}

```java
interface OrderFulfillmentWorkflow {
    SendChannel<OrderDeliveryEvent> getDeliveryChannel();

    Void start(OrderStartedEvent event);

    Void update(OrderUpdatedEvent event);
}
```

```kotlin
interface OrderFulfillmentWorkflow {
    val deliveryChannel: SendChannel<OrderDeliveryEvent>

    fun start(event: OrderStartedEvent)

    fun update(event: OrderUpdatedEvent)
}
```

{% /codes %}

You could create a Kafka consumer that listens for order events and triggers an order fulfillment workflow:

{% codes %}

```java
public class OrderDispatcher {
    private final KafkaConsumer<String, OrderEvent> consumer;
    private final InfiniticClient client;

    public OrderDispatcher(KafkaConsumer<String, OrderEvent> consumer, InfiniticClient client) {
        this.consumer = consumer;
        this.client = client;
    }

    private String createOrderTag(String orderId) {
        return "orderId:" + orderId;
    }

    public void processEvents() {
        consumer.subscribe(Collections.singletonList("order-events"));

        while (true) {
            ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(100));

            for (ConsumerRecord<String, OrderEvent> record : records) {
                OrderEvent event = record.value();
                // Start workflow based on event type
                if (event instanceof OrderStartedEvent) {
                    // Define a workflow with orderId tag
                    OrderFulfillmentWorkflow workflow = client.newWorkflow(
                        OrderFulfillmentWorkflow.class,
                        Set.of(createOrderTag(event.getOrderId()))
                    );
                    // Dispatch this workflow
                    client.dispatch(workflow::start, (OrderStartedEvent) event);
                } else {
                    // No action needed for other event types
                }
            }
        }
    }
}
```


```kotlin
class OrderDispatcher(
    private val consumer: KafkaConsumer<String, OrderEvent>,
    private val client: InfiniticClient
) {
    private fun createOrderTag(orderId: String) = "orderId:$orderId"

    fun processEvents() {
        consumer.subscribe(listOf("order-events"))

        while (true) {
            val records = consumer.poll(Duration.ofMillis(100))

            records.forEach { record ->
                val event = record.value()

                // Start workflow based on event type
                when (event) {
                    is OrderStartedEvent -> {
                        // define a workflow with orderId tag
                        val workflow = client.newWorkflow(OrderFulfillmentWorkflow::class.java, tags = setOf(createOrderTag(event.orderId)))
                        // dispatch this workflow 
                        client.dispatch(workflow::start, (OrderStartedEvent) event)
                    }
                    
                    else -> {
                        // No action needed for other event types
                    }
                }
            }
        }
    }
}
```

{% /codes %}

The `dispatch()` method is used to asynchronously start the workflow. It takes a reference to the workflow method to execute (`::start`) and the parameters for that method (the `OrderStartedEvent` event in this case). This starts a new workflow instance and returns immediately, without waiting for the workflow to complete.

Tags like `orderId:{orderId}` are used to identify workflows. They allow you to cancel workflows or send signals later without needing the workflow ID. You can also include additional tags, like `customerId:{customerId}`, for grouping or filtering workflows.

## Sending Existing Events To Running Workflows

Workflows in Infinitic can actively respond to signals during execution through two key mechanisms:

1. By starting [New Methods](/docs/workflows/parallel#parallel-methods):
   - Trigger additional workflow methods on a running instance
   - These methods execute in parallel with the main workflow method
   - Useful for handling updates or side operations without interrupting the main flow

2. Using [Channels](/docs/workflows/signals):
   - Channels provide a way to send events directly to specific points in the workflow
   - The workflow can wait and listen for events on these channels
   - Perfect for handling asynchronous events like external notifications

![Signal Workflow](/img/existing-signal-workflow.png)


For example, you can extend the Kafka consumer to forward the `OrderUpdatedEvent` and `OrderDeliveryEvent` events to their respective running workflows:

{% codes %}

```java
public class OrderDispatcher {
    private final KafkaConsumer<String, OrderEvent> consumer;
    private final InfiniticClient client;

    public OrderDispatcher(KafkaConsumer<String, OrderEvent> consumer, InfiniticClient client) {
        this.consumer = consumer;
        this.client = client;
    }

    private String createOrderTag(String orderId) {
        return "orderId:" + orderId;
    }

    private OrderFulfillmentWorkflow targetByTag(orderId: String) {
        return client.getWorkflowByTag(OrderFulfillmentWorkflow.class, createOrderTag(orderId));
    }

    public void processEvents() {
        consumer.subscribe(Collections.singletonList("order-events"));

        while (true) {
            ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(100));

            for (ConsumerRecord<String, OrderEvent> record : records) {
                OrderEvent event = record.value();

                // Start workflow based on event type
                 if (event instanceof OrderStartedEvent) {
                    // Define a workflow with orderId tag
                    OrderFulfillmentWorkflow workflow = client.newWorkflow(
                        OrderFulfillmentWorkflow.class,
                        Set.of(createOrderTag(event.getOrderId()))
                    );
                    // Dispatch this workflow
                    client.dispatch(workflow::start, (OrderStartedEvent) event);
                } else if (event instanceof OrderUpdatedEvent) {
                    // select workflow by its tag
                    OrderFulfillmentWorkflow w = targetByTag(event.getOrderId());
                    // Process method of the existing workflow
                    client.dispatch(w::update, (OrderUpdatedEvent) event);
                } else if (event instanceof OrderDeliveryEvent) {
                    // target instance by its tag
                    OrderFulfillmentWorkflow w = targetByTag(event.getOrderId());
                    // send event to delivery channel
                    w.getDeliveryChannel().send((OrderDeliveryEvent) event);
                } else {
                    // No action needed for other event types
                }
            }
        }
    }
}
```


```kotlin
class OrderDispatcher(
    private val consumer: KafkaConsumer<String, OrderEvent>,
    private val client: InfiniticClient
) {
    private fun createOrderTag(orderId: String) = "orderId:$orderId"

    private fun targetByTag(orderId: String) = 
        client.getWorkflowByTag(OrderFulfillmentWorkflow.class, createOrderTag(orderId))

    fun processEvents() {
        consumer.subscribe(listOf("order-events"))

        while (true) {
            val records = consumer.poll(Duration.ofMillis(100))

            records.forEach { record ->
                val event = record.value()

                // Start workflow based on event type
                 when (event) {
                    is OrderStartedEvent -> {
                        // define a workflow with orderId tag
                        val w = client.newWorkflow(OrderFulfillmentWorkflow::class.java, tags = setOf(createOrderTag(event.orderId)))
                        // dispatch this workflow 
                        client.dispatch(w::start, event)
                    }
                    is OrderUpdatedEvent -> {
                        // target instance by its tag
                        val w = targetByTag(event.orderId)
                        // Process method of the existing workflow
                        client.dispatch(w::update, event)
                    }
                    is OrderDeliveryEvent -> {
                        // target instance by its tag
                        val w = targetByTag(event.orderId)
                        // send event to delivery channel
                        w.deliveryChannel.send(event)
                    }
                    else -> {
                        // No action needed for other event types
                    }
                }
            }
        }
    }
}
```

{% /codes %}

## Using Existing API-Based Services

If you already have existing API services, you can use them into your Infinitic service implementation. This provides several benefits:

- **Leverage Existing Investments**: Reuse your existing API services without rewriting them
- **Gradual Migration**: Incrementally move functionality into Infinitic while maintaining existing systems
- **Enhanced Capabilities**: By running API calls within Infinitic services, you gain:
  - Automatic retries on failures
  - Batch processing capabilities
  - Timeout handling
  - Error handling

![Using existing services](/img/existing-services.png)

### Service Definitions

To work with HTTP-based services, you'll first define an interface that describes the external service:

{% codes %}

```java
interface PaymentService {
   PaymentResult processPayment(Double amount, String customerId);
}
```

```kotlin
interface PaymentService {
   fun processPayment(amount: Double, customerId: String): PaymentResult
}
```

{% /codes %}

### Infinitic Service Implementation

Then create an implementation that uses an HTTP client to communicate with the external service:

{% codes %}

```java
class HttpPaymentService implements PaymentService {
    private final HttpClient httpClient;

    public HttpPaymentService(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    @Override
    public PaymentResult processPayment(Double amount, String customerId) {
        HttpResponse<String> response = httpClient
            .post("https://payment-api.example.com/process")
            .header("Content-Type", "application/json")
            .body(Map.of(
                "amount", amount,
                "customerId", customerId
            ))
            .send();

        return switch (response.statusCode()) {
            case 200 -> PaymentResult.Success;
            case 400 -> PaymentResult.Failed;
            default -> throw new ServiceCommunicationException("Unexpected response");
        };
    }
}

```

```kotlin
class HttpPaymentService(private val httpClient: HttpClient) : PaymentService {
    override suspend fun processPayment(amount: Double, customerId: String): PaymentResult {
        val response = httpClient.post("https://payment-api.example.com/process") {
            contentType(ContentType.Application.Json)
            body = mapOf(
                "amount" to amount,
                "customerId" to customerId
            )
        }
        
        return when (response.status) {
            HttpStatusCode.OK -> PaymentResult.Success
            HttpStatusCode.BadRequest -> PaymentResult.Failed
            else -> throw ServiceCommunicationException("Unexpected response")
        }
    }
}
```

{% /codes %}


### Using HTTP Services in Workflows

Incorporate the HTTP service into your workflow logic:

{% codes %}

```java
class OrderWorkflow implements Workflow {
    private final PaymentService paymentService = newService(PaymentService.class);

    public void processOrder(Order order) {
        // Perform payment processing using external HTTP service
        PaymentResult paymentResult = paymentService.processPayment(
            order.getTotal(),
            order.getCustomerId()
        );

        if (paymentResult == PaymentResult.Success) {
            completeOrder(order);
        } else {
            handlePaymentFailure(order);
        }
    }
}

```

```kotlin
class OrderWorkflow : Workflow {

   val paymentService = newService(PaymentService::class.java); 

   fun processOrder(order: Order) {
        // Perform payment processing using external HTTP service
        val paymentResult = paymentService.processPayment(
            amount = order.total, 
            customerId = order.customerId
        )
        
        when (paymentResult) {
            PaymentResult.Success -> completeOrder(order)
            PaymentResult.Failed -> handlePaymentFailure(order)
        }
    }
}
```

{% /codes %}

### Best Practices

- Use `concurrency` setting when deploying a PaymentService to process requests in parallel
- Use `retry` setting when deploying a PaymentService to handle potential network failures gracefully
- Implement proper timeout 
- Consider using batch requests if needed

By following these patterns, you can seamlessly integrate existing HTTP-based services into your Infinitic workflows, maintaining clean architecture and separation of concerns.

