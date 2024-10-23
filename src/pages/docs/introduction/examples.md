---
title: Workflow Examples
description: This page showcases a variety of scenarios, illustrating how Infinitic can be leveraged in Java and Kotlin to streamline complex workflow processes in distributed systems. From simple "Hello World" applications to more intricate use cases like booking systems, monthly invoicing, and loyalty programs, these examples provide valuable insights into implementing effective task orchestration and workflow management with Infinitic.
---


{% callout type="note"  %}

The code for those examples are available on [Github](https://github.com/infiniticio/docs.examples).

{% /callout %}

Infinitic's power and flexibility can be best understood through examples. Here, we provide several workflow examples to showcase its capabilities.

You'll find all sources in the Infinitic's [examples](https://github.com/infiniticio/docs.examples) repository. We encourage you to explore the implementations and play with them.

## Saga Workflow

Consider a booking process that includes a car rental, a flight, and a hotel reservation. All these bookings must either succeed or fail together. If any booking fails, the others that succeeded should be canceled.

![Bookings and Saga](/img/booking-saga@2x.png)

Each service involved in this process, like `HotelBookingService`, has methods to `book` and `cancel` a booking.

{% codes %}

```java
import io.infinitic.annotations.Name;

@Name(name = "HotelBooking")

public interface HotelBookingService {
    HotelBookingResult book(HotelBookingCart cart);

    void cancel(HotelBookingCart cart);
}
```

```kotlin
import io.infinitic.annotations.Name

@Name("HotelBooking")

interface HotelBookingService {
    fun book(cart: HotelBookingCart): HotelBookingResult

    fun cancel(cart: HotelBookingCart)
}
```

{% /codes %}

The `BookingWorkflow` orchestrates the complete booking process:

{% codes %}

```java
public class BookingWorkflowImpl extends Workflow implements BookingWorkflow {
    // create stub for CarRentalService
    private final CarRentalService carRentalService = newService(CarRentalService.class);
    // create stub for FlightBookingService
    private final FlightBookingService flightBookingService = newService(FlightBookingService.class);
    // create stub for HotelBookingService
    private final HotelBookingService hotelBookingService = newService(HotelBookingService.class);

    @Override
    public BookingResult book(
            CarRentalCart carRentalCart,
            FlightBookingCart flightCart,
            HotelBookingCart hotelCart
    ) {
        // dispatch parallel bookings using car, flight and hotel services
        Deferred<CarRentalResult> deferredCarRental =
                dispatch(carRentalService::book, carRentalCart);
        Deferred<FlightBookingResult> deferredFlightBooking =
                dispatch(flightBookingService::book, flightCart);
        Deferred<HotelBookingResult> deferredHotelBooking =
                dispatch(hotelBookingService::book, hotelCart);

        // wait and get result of deferred CarRentalService::book
        CarRentalResult carRentalResult = deferredCarRental.await();
        // wait and get result of deferred FlightService::book
        FlightBookingResult flightResult = deferredFlightBooking.await();
        // wait and get result of deferred HotelService::book
        HotelBookingResult hotelResult = deferredHotelBooking.await();

        // if all bookings are successful, we are done
        if (carRentalResult == CarRentalResult.SUCCESS &&
            flightResult == FlightBookingResult.SUCCESS &&
            hotelResult == HotelBookingResult.SUCCESS
        ) {
            return BookingResult.SUCCESS;
        }

        // else cancel all successful bookings in parallel
        if (carRentalResult == CarRentalResult.SUCCESS) { 
            dispatch(carRentalService::cancel, carRentalCart);
        }
        if (flightResult == FlightBookingResult.SUCCESS) { 
            dispatch(flightBookingService::cancel, flightCart);
        }
        if (hotelResult == HotelBookingResult.SUCCESS) { 
            dispatch(hotelBookingService::cancel, hotelCart);
        }

        return BookingResult.FAILURE;
    }
}
```

```kotlin
class BookingWorkflowImpl : Workflow(), BookingWorkflow {
    // create stub for CarRentalService
    private val carRentalService = newService(CarRentalService::class.java)
    // create stub for FlightBookingService
    private val flightBookingService = newService(FlightBookingService::class.java)
    // create stub for HotelBookingService
    private val hotelBookingService = newService(HotelBookingService::class.java)

    override fun book(
        carRentalCart: CarRentalCart,
        flightCart: FlightBookingCart,
        hotelCart: HotelBookingCart
    ): BookingResult {
        // dispatch parallel bookings using car, flight and hotel services
        val deferredCarRental = dispatch(carRentalService::book, carRentalCart)
        val deferredFlightBooking = dispatch(flightBookingService::book, flightCart)
        val deferredHotelBooking = dispatch(hotelBookingService::book, hotelCart)

        // wait and get result of deferred CarRentalService::book
        val carRentalResult = deferredCarRental.await()
        // wait and get result of deferred FlightService::book
        val flightResult = deferredFlightBooking.await()
        // wait and get result of deferred HotelService::book
        val hotelResult = deferredHotelBooking.await()

        // if all bookings are successful, we are done
        if (carRentalResult == CarRentalResult.SUCCESS &&
            flightResult == FlightBookingResult.SUCCESS &&
            hotelResult == HotelBookingResult.SUCCESS
        ) {
            return BookingResult.SUCCESS
        }

        // else cancel all successful bookings in parallel
        if (carRentalResult == CarRentalResult.SUCCESS) { 
            dispatch(carRentalService::cancel, carRentalCart)
        }
        if (flightResult == FlightBookingResult.SUCCESS) { 
            dispatch(flightBookingService::cancel, flightCart)
        }
        if (hotelResult == HotelBookingResult.SUCCESS) { 
            dispatch(hotelBookingService::cancel, hotelCart)
        }

        return BookingResult.FAILURE
    }
}
```

{% /codes %}

The `BookingWorkflowImpl` class in Java or Kotlin performs the bookings in parallel and cancels them if any one of them fails. The code structure is as follows:

* Services for car rental, flight, and hotel are initialized.
* Bookings are dispatched in parallel.
* Results are awaited and checked.
* If any booking fails, successful ones are canceled.

The workflow is a perfect example of the Saga pattern in distributed transactions.

{% callout type="note"  %}

In a workflow, when you use the [`dispatch`](/docs/workflows/implementation#dispatch-a-task) function, it starts a task without interrupting the workflow's ongoing process. If you use `dispatch` multiple times, it will run several tasks at the same time, in parallel. The `dispatch` function gives back a `Deferred` object. When you use the `await()` method on this `Deferred` object, it makes the workflow pause and wait until the task is finished, and then it provides the task's result.

{% /callout  %}

## Monthly invoicing

Imagine a workflow where, every month, we need to:

* Gather user metrics
* Charge the user's payment card
* Generate and send an invoice

![Monthly invoicing](/img/invoicing@2x.png)

With Infinitic, this process does not require a cron job. The `InvoicingWorkflowImpl` handles this monthly routine:

* It uses services like `ConsumptionService` and `PaymentService`.
* The workflow waits until the first day of the next month.
* It calculates the payment amount and processes the payment.
* An invoice is generated and sent to the user.

{% codes %}

```java
public class InvoicingWorkflowImpl extends Workflow implements InvoicingWorkflow {
    // create stub for ComsumptionService
    private final ComsumptionService comsumptionService = newService(ComsumptionService.class);
    // create stub for PaymentService
    private final PaymentService paymentService = newService(PaymentService.class);
    // create stub for InvoiceService
    private final InvoiceService invoiceService = newService(InvoiceService.class);
    // create stub for EmainService
    private final EmainService emainService = newService(EmainService.class);

    @Override
    public void start(User user) {
         // while this user is subscribed
         while (comsumptionService.isSubscribed(user)) {
            // get current date (inlined task)
            LocalDate now = inline(LocalDate::now);
            // get first day of next month
            LocalDate next = now.with(TemporalAdjusters.firstDayOfNextMonth());
            // wait until then
            timer(Duration.between(next, now)).await();
            // calculate how much the user will pay
            MonetaryAmount amount = comsumptionService.getMonetaryAmount(user, now, next);
            // get payment for the user
            paymentService.getPayment(user, amount);
            // generate the invoice
            Invoice invoice = invoiceService.create(user, amount, now, next);
            // send the invoice
            emailService.sendInvoice(user, invoice);
        }
    }
}
```

```kotlin
class InvoicingWorkflowImpl : Workflow(), InvoicingWorkflow {
    // create stub for ComsumptionService
    val comsumptionService = newService(ComsumptionService::class.java)
    // create stub for PaymentService
    val paymentService = newService(PaymentService::class.java)
    // create stub for InvoiceService
    val invoiceService = newService(InvoiceService::class.java)
    // create stub for EmainService
    val emainService = newService(EmainService::class.java)

    override fun start(user: User) {
        // while this user is subscribed
        while (comsumptionService.isSubscribed(user)) {
            // get current date (inlined task)
            val now = inline(LocalDate::now)
            // get first day of next month
            val next = now.with(TemporalAdjusters.firstDayOfNextMonth())
            // wait until then
            timer(Duration.between(next, now)).await()
            // calculate how much the user will pay
            val amount = comsumptionService.getMonetaryAmount(user, now, next)
            // get payment for the user
            paymentService.getPayment(user, amount)
            // generate the invoice
            val invoice = invoiceService.create(user, amount, now, next)
            // send the invoice
            emailService.sendInvoice(user, invoice)
        }
    }
}
```

{% /codes %}

{% callout type="note"  %}

In a workflow, when you use a [`timer`](/docs/workflows/waiting) and `await` it, the workflow pauses until a specific time (`Instant`) or for a set period (`Duration`). During this wait, no resources are being used.

{% /callout  %}

{% callout type="warning"  %}

In a workflow, every step [must be deterministic](/docs/workflows/implementation#constraints), which is why commands like `LocalDate.now()` should be part of a task. The [`inline`](/docs/workflows/inline) function is used to create what's called a pseudo-task, which is integrated directly into the workflow.

{% /callout  %}

A workflow should not have [too many tasks](/docs/workflows/implementation#constraints), so it's best to avoid loops. In this example, the number of iterations is limited (running for 10 years results in just 120 iterations) and there are only 7 tasks in each iteration. Therefore, this setup is manageable and appropriate.

## Loyalty program

Consider a loyalty program where users earn points for various actions:

- 1 point every 10 seconds
- 200 points for completing a form
- 500 points for completing an order
- Users can also burn points

![Loyalty program](/img/loyalty@2x.png)

`LoyaltyWorkflowImpl` is all we need to manages this program:

- Points are stored and updated within the workflow.
- an `addBonus` method is used to tell the instance that the user did some actions 
- a `burn` method lets the user burn some points (if enough)

{% codes %}

```java
public class LoyaltyWorkflowImpl extends Workflow implements LoyaltyWorkflow {
    // workflow stub that targets itself
    private final LoyaltyWorkflow self = getWorkflowById(LoyaltyWorkflow.class, getWorkflowId());

    @Ignore
    private final long secondsForPointReward = 10;

    private long points = 0;

    @Override
    public long getPoints() {
        return points;
    }

    @Override
    public void start() {
        // every `secondsForPointReward` seconds, a new point is added
        timer(Duration.ofSeconds(secondsForPointReward)).await();
        points++;

        // Loop
        dispatchVoid(self::start);
    }

    @Override
    public void addBonus(BonusEvent event) {
        switch (event) {
            case FORM_COMPLETED:
                points+= 200;
                break;

            case ORDER_COMPLETED:
                points+= 500;
                break;
        }
    }

    @Override
    public PointStatus burn(long amount) {
        if (points - amount >= 0) {
            points -= amount;
            return PointStatus.OK;
        } else {
            return PointStatus.INSUFFICIENT;
        }
    }
}
```

```kotlin
class LoyaltyWorkflowImpl : Workflow(), LoyaltyWorkflow {
    // workflow stub that targets itself
    private val self = getWorkflowById(LoyaltyWorkflow::class.java, workflowId)

    @Ignore
    private val secondsForPointReward: Long = 10

    private var points: Long = 0

    override fun getPoints() = points

    override fun start() {
        // every `secondsForPointReward` seconds, a new point is added
        timer(Duration.ofSeconds(secondsForPointReward)).await()
        points++

        // Loop
        dispatch(self::start)
    }

    override fun addBonus(event: BonusEvent) {
        points += when (event) {
            BonusEvent.FORM_COMPLETED -> 200
            BonusEvent.ORDER_COMPLETED -> 500
        }
    }

    override fun burn(amount: Long) =
        if (points - amount >= 0) {
            points -= amount
            PointStatus.OK
        } else {
            PointStatus.INSUFFICIENT
        }
}
```

{% /codes %}

{% callout type="note"  %}

An Infinitic client, or another workflow, can [invoke methods](/docs/clients/start-method) of an active workflow. While it's possible for multiple methods of the same workflow instance to operate concurrently, only one method runs at any specific moment. You can think of this as an asynchronous, yet single-threaded execution.

{% /callout  %}

{% callout type="note"  %}

[Properties](/docs/workflows/properties) within workflows serve as a way to store information that can be modified by various methods.

{% /callout  %}

A workflow shouldn't have [too many tasks](/docs/workflows/implementation#constraints), which is why we restart the `start` method instead of looping within it.

## Location Booking

Imagine an Airbnb-like service where travelers request bookings from hosts.

- Travelers' requests are sent to hosts.
- If the host responds positively, the traveler pays a deposit.
- Both parties are then notified of the booking.

![Location Booking](/img/location@2x.png)

`LocationBookingWorkflowImpl` handles this process:

{% codes %}

```java
public class LoyaltyWorkflowImpl extends Workflow implements LoyaltyWorkflow {
    @Ignore
    private final long DAY_IN_SECONDS = 24L * 3600; 

    // create channel for BookingRequestStatus
    private final Channel<BookingRequestStatus> responseChannel = channel();

    // create stub for HostService
    private final NotificationService notificationService = newService(NotificationService.class);

    // create stub for PaymentWorkflow
    private final PaymentWorkflow paymentWorkflow = newWorkflow(PaymentWorkflow.class);

    @Override
    public Channel<BookingRequestStatus> getResponseChannel() {
        return responseChannel;
    }

    @Override
    public void start(BookingRequest request) {
        // start accepting one signal in the channel
        Deferred<BookingRequestStatus> deferredResponse = responseChannel.receive(1);

        for (int attempt = 1; attempt <= 3; attempt++) {
            // notify host of traveler request
            dispatchVoid(notificationService::notifyHostOfRequest, request, attempt);

            // start a timer for a day
            Deferred<Instant> timer = timer(Duration.ofSeconds(DAY_IN_SECONDS));

            // Checks the completion of one of them
            or(timer, deferredResponse).await();

            // exit loop if we received a response from the host
            if (deferredResponse.isCompleted()) break;
        }

        // we did not receive host's response
        if (!deferredResponse.isCompleted()) {
            // notify host of request expiration
            dispatchVoid(notificationService::notifyHostOfRequestExpiration, request);
            // notify traveler of request expiration
            dispatchVoid(notificationService::notifyTravelerOfRequestExpiration, request);
            // workflow stops here
            return;
        }

        BookingRequestStatus response = deferredResponse.await();
        switch (response) {
            case ACCEPTED:
                bookingAccepted(request);
                break;
            case DENIED:
                bookingDenied(request);
                break;
        }
    }

    private void bookingAccepted(BookingRequest request) {
        // trigger deposit workflow and wait for it
        paymentWorkflow.getDeposit(request);

        // notify host of the successful payment
        dispatchVoid(notificationService::notifyHostOfPaymentSuccess, request);

        // notify traveler of the successful booking
        dispatchVoid(notificationService::notifyTravelerOfBookingSuccess, request);
    }

    private void bookingDenied(BookingRequest request) {
        // notify traveler of host denial
        dispatchVoid(notificationService::notifyTravelerOfBookingDenial, request);
    }
}
```

```kotlin
public class LoyaltyWorkflowImpl: Workflow(), LoyaltyWorkflow {
    @Ignore
    private val DAY_IN_SECONDS = 24L * 3600 

    // create stub for HostService
    private val notificationService = newService(NotificationService::class.java)

    // create stub for PaymentWorkflow
    private val paymentWorkflow: PaymentWorkflow = newWorkflow(PaymentWorkflow::class.java)

    // create channel for BookingRequestStatus
    private val responseChannel = channel<BookingRequestStatus>()

    override fun getResponseChannel() = responseChannel

    override fun start(request: BookingRequest) {
        // start accepting one signal in the channel
        val deferredResponse = responseChannel.receive(1)

        repeat(3) { attempt ->
            // notify host of traveler request
            dispatch(notificationService::notifyHostOfRequest, request, attempt + 1)
            // start a timer for a day
            val timer = timer(Duration.ofSeconds(DAY_IN_SECONDS))
            // wait for the timer or the signal
            (timer or deferredResponse).await()
            //  exit loop if we received a response from the host
            if (deferredResponse.isCompleted()) return@repeat
        }

        // we did not receive host's response
        if (!deferredResponse.isCompleted()) {
            // notify host of request expiration
            dispatch(notificationService::notifyHostOfRequestExpiration, request)
            // notify traveler of request expiration
            dispatch(notificationService::notifyTravelerOfRequestExpiration, request)
            // workflow stops here
            return
        }

        when(deferredResponse.await()) {
            BookingRequestStatus.ACCEPTED -> bookingAccepted(request)
            BookingRequestStatus.DENIED -> bookingDenied(request)
        }
    }

    private fun bookingAccepted(request: BookingRequest) {
        // trigger deposit workflow and wait for it
        paymentWorkflow.getDeposit(request)

        // notify host of the successful payment
        dispatch(notificationService::notifyHostOfPaymentSuccess, request)

        // notify traveler of the successful booking
        dispatch(notificationService::notifyTravelerOfBookingSuccess, request)
    }

    private fun bookingDenied(request: BookingRequest) {
        // notify traveler of host denial
        dispatch(notificationService::notifyTravelerOfBookingDenial, request)
    }
}
```

{% /codes %}

This workflow showcases complex decision-making and communication between multiple parties.

{% callout type="note"  %}

We have the ability to dispatch [external signals](/docs/workflows/signals) to a workflow to inform it of an event or change. A signal is a type of [serializable](/docs/references/serialization) object. For a workflow to receive and process a signal, it needs to be equipped with a [channel](/docs/workflows/signals#implementing-channels).

{% /callout  %}

This example with the `PaymentWorkflow`` demonstrates that a workflow can launch another [sub-workflow](/docs/workflows/implementation#dispatch-a-child-workflow), either in a synchronous or asynchronous manner. This capability unlocks endless possibilities.

