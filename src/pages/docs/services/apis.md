---
title: Using APIs
description: 
---

## Good practices when using APIs

When invoking APIs for task execution, adhere to the following best practices to ensure smooth handling of all situations:

* Limit yourself to one API call per task execution. This ensures that in case of errors, only the failing API call will be retried.
* By default, Infinitic considers the task completed when the service's method returns. Therefore, ensure that the underlying work can be executed synchronously during the API call. If not, for example for long-running tasks, use [delegated tasks](/docs/services/delegated).
* When your API permits an idempotency key, utilize `Task.taskId`.
* Avoid catching technical errors within your code. If an API fails to respond correctly, ensure that exceptions are thrown. Infinitic will catch them and schedule task retries based on the [retry policy](/docs/services/syntax#retries-policy) defined.
* In cases where an API call completes but the task can not be performed due to business-related issues (e.g., insufficient funds in a bank account), handle these errors by returning to the workflow a code indicating the specific situation. This allows for proper handling within the workflow logic. For this reason, we recommend encapsulating the return value within an object that can also describe any business issues encountered during task execution.

## Example

The following demonstrate how to use an external SDK, here Stripe, to code tasks. Here we consider a very simple Stripe service with only one `charge` method:

{% codes %}

```java
public interface StripeService {
    PaymentIntentResult charge(Long amount, String currency);
}
```

```kotlin
interface StripeService {
    fun charge(amount: Long, currency: String): PaymentIntentResult
}
```

{% /codes %}

where `PaymentIntentResult` is a custom serializable class similar to `Result<PaymentIntent>`.
Here is an implementation example of this service:

{% codes %}

```java
public class StripeServiceImpl extends StripeService {
    PaymentIntentResult charge(Long amount, String currency) {
        Stripe.apiKey = "sk_test_YourSecretKey"; // Set your secret key here

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setConfirm(true)
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    .build()
                )
                .build();

            String idempotencyKey = Task.taskId; // idempotency key

            PaymentIntent paymentIntent = PaymentIntent.create(params, idempotencyKey);

            return PaymentIntentResult.success(paymentIntent);
        } catch (CardException e) {
            // Card was declined
            return PaymentIntentResult.error(e);
        }
        // Do not catch other technical exceptions
    }
}
```

```kotlin
class StripeServiceImpl: StripeService {
    fun charge(amount: Long, currency: String, type: String): PaymentIntent {
        Stripe.apiKey = "sk_test_YourSecretKey" // Set your secret key here

        try {
            val params = PaymentIntentCreateParams.builder()
                .setAmount(amount)
                .setCurrency(currency)
                .setConfirm(true)
                .setAutomaticPaymentMethods(
                    PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                    .setEnabled(true)
                    .build()
                )
            .build()

            val idempotencyKey = Task.taskId // idempotency key

            val paymentIntent = PaymentIntent.create(params, idempotencyKey)

            return PaymentIntentResult.success(paymentIntent)
        } catch (CardException e) {
            // Card was declined
            return PaymentIntentResult.error(e)
        } 
        // Do not catch other technical exceptions
    }
}
```

{% /codes %}


{% callout type="note"  %}

The Stripe SDK automatically converts errors into Exceptions. But most APIs don't. In that case it's also necessary to verify the HTTP status and raise exceptions manually (usually for error codes greater than or equal to 500). This practice ensures that a technical error prompts a retry.

{% /callout  %}

