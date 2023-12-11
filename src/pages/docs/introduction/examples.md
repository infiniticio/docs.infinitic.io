---
title: Workflow Examples
description: Quidem magni aut exercitationem maxime rerum eos.
---
Infinitic's power and flexibility can be best understood through examples. Here, we provide several workflow examples to showcase its capabilities.

## Bookings and Saga

Consider a booking process that includes a car rental, a flight, and a hotel reservation. All these bookings must either succeed or fail together. If any booking fails, the others that succeeded should be canceled.

![Bookings and Saga](/img/booking-saga@2x.png)

### The Services

Each service involved in this process, like `HotelBookingService`, has functions to `book` and `cancel` a booking. 

{% codes %}

```java
public interface HotelBookingService {
    HotelBookingResult book(HotelBookingCart cart);

    void cancel(HotelBookingCart cart);
}
```

```kotlin
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

The `BookingWorkflowImpl` class in Java or Kotlin coordinates the bookings. It performs these bookings in parallel and cancels them if any one of them fails. The code structure is as follows:

* Services for car rental, flight, and hotel are initialized.
* Bookings are dispatched in parallel.
* Results are awaited and checked.
* If any booking fails, successful ones are canceled.

The workflow is a perfect example of the Saga pattern in distributed transactions.

{% callout type="note"  %}

In a workflow, when you use the [`dispatch`](https://chat.openai.com/docs/workflows/syntax#dispatch-a-new-task) function, it starts a task without interrupting the workflow's ongoing process. If you use `dispatch` multiple times, it will run several tasks at the same time, in parallel. The `dispatch` function gives back a `Deferred` object. When you use the `await()` method on this `Deferred` object, it makes the workflow pause and wait until the task is finished, and then it provides the task's result.

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
    private final ComsumptionService comsumptionService = newService(ComsumptionService::class.java)
    // create stub for PaymentService
    private final PaymentService paymentService = newService(PaymentService::class.java)
    // create stub for InvoiceService
    private final InvoiceService invoiceService = newService(InvoiceService::class.java)
    // create stub for EmainService
    private final EmainService emainService = newService(EmainService::class.java)


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

In a workflow, when you use a [`timer`](https://chat.openai.com/docs/workflows/waiting) and `await` it, the workflow pauses until a specific time (`Instant`) or for a set period (`Duration`). During this wait, no resources are being used.

{% /callout  %}

{% callout type="warning"  %}

In a workflow, every step [must be deterministic](/docs/workflows/syntax#constraints), which is why commands like `LocalDate.now()` should be part of a task. The [`inline`](https://chat.openai.com/docs/workflows/inline) function is used to create what's called a pseudo-task, which is integrated directly into the workflow.

{% /callout  %}

{% callout type="warning"  %}

A workflow should not have [too many tasks](/docs/workflows/syntax#constraints), so it's best to avoid loops. In this example, the number of iterations is limited (running for 10 years results in just 120 iterations) and there are only 7 tasks in each iteration. Therefore, this setup is manageable and appropriate.

{% /callout  %}

## Loyalty program

Consider a loyalty program where users earn points for various actions:

- 10 points weekly
- 100 points for completing a form
- 100 points for completing an order
- Users can also burn points

![Loyalty program](/img/loyalty@2x.png)

`LoyaltyWorkflowImpl` is all we need to manages this program:

- Points are stored and updated within the workflow.
- Different methods update points for different actions.
- The workflow runs as long as the user is active.

{% codes %}

```java
public class LoyaltyWorkflowImpl extends Workflow implements LoyaltyWorkflow {
  
    // create stub for UserService
    private final UserService userService = newService(UserService.class);
  
    // we store the number of points there
    private Int points = 0;

    @Override
    public void start(User user) {
        // while this user is subscribed
        while (userService.isActive(user)) {
            // wait one week
            timer(Duration.of(1, ChronoUnit.WEEKS)).await();
            // add points
            points += 10;
        }
    }

    @Override
    public void formCompleted() {
        points += 100;
    }

    @Override
    public void orderCompleted() {
        points += 500;
    }

    @Override
    public PointStatus burn(Int amount) {
        if (point - amount >= 0) {
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
  
    // create stub for UserService
    val userService = newService(UserService::class.java)
  
    // we store the number of points there
    var points = 0

    override fun start(user: User) {
        // while this user is subscribed
        while (userService.isActive(user)) {
            // wait one week
            timer(Duration.of(1, ChronoUnit.WEEKS)).await()
            // add points
            points += 10
        }
    }

    override formCompleted() {
        points += 100
    }

    override orderCompleted() {
        points += 500
    }

    override burn(Int amount) = 
        if (point - amount >= 0) {
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

{% callout type="warning"  %}

A workflow shouldn't have [too many tasks](/docs/workflows/syntax#constraints), which is why it's advisable to steer clear of loops. In this scenario, the number of iterations is controlled (for example, operating over 10 years results in just 560 iterations) with only 2 tasks in each iteration. This amount is acceptable and manageable.

{% /callout  %}

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
  
    // create stub for HostService
    private final HostService hostService = newService(HostService.class);

    // create stub for TravelerService
    private final TravelerService travelerService = newService(TravelerService.class);

    // create stub for PaymentWorkflow
    private final PaymentWorkflow paymentWorkflow = newWorkflow(PaymentWorkflow.class);

    // create channel for BookingStatus
    final Channel<BookingStatus> responseChannel = channel();
  
    @Override
    public Channel<BookingStatus> getResponseChannel() {
        return responseChannel;
    }

    @Override
    public void start(Traveler traveler, Host host, LocationRequest request) {
        Object response;

        for (int i = 0; i < 3; i++) {
            // notify host of traveler request
            dispatch(hostService::notifyOfRequest, traveler, host, request);
            // start a timer for a day
            Deferred<Instant> timer = timer(Duration.of(1, ChronoUnit.DAYS));
            // start receiving signal in the channel
            Deferred<BookingStatus> signal = responseChannel.receive(1);
            // wait for the timer or the signal
            response = or(timer, signal).await();
            //  exit loop if we received a signal
            if (response instanceof BookingStatus) break;
        }

        // we did not receive host's response
        if (!(response instanceof BookingStatus)) {
            // notify host of traveler request
            dispatch(hostService::notifyExpiration, traveler, host, request);
            // notify host of traveler request
            dispatch(travelerService::notifyExpiration, traveler, host, request);
            // workflow stops here
            return;
        }

        // host did not accept the request
        if (response == BookingStatus.DENIED) {
            // notify host of traveler request
            dispatch(travelerService::notifyDenial, traveler, host, request);
            // workflow stops here
            return;
        }

        // trigger deposit workflow and wait for it
        paymentWorkflow.getDeposit(traveler, host, request);

        // notify host of the succesful booking
        dispatch(hostService::notifyBooking, traveler, host, request);

        // notify traveler of the succesful booking
        dispatch(travelerService::notifyBooking, traveler, host, request);
    }
}
```

```kotlin
public class LoyaltyWorkflowImpl: Workflow(), LoyaltyWorkflow {
  
    // create stub for HostService
    val hostService = newService(HostService.class)

    // create stub for TravelerService
    val travelerService = newService(TravelerService.class)

    // create stub for PaymentWorkflow
    val paymentWorkflow = newWorkflow(PaymentWorkflow.class)

    // create channel for BookingStatus
    val responseChannel = channel<BookingStatus>()

    override fun start(traveler: Traveler, host: Host, request: LocationRequest) {
        var response: Any

        for (int i = 0; i < 3; i++) {
            // notify host of traveler request
            dispatch(hostService::notifyOfRequest, traveler, host, request)
            // start a timer for a day
            val timer = timer(Duration.of(1, ChronoUnit.DAYS))
            // start receiving signal in the channel
            val signal = responseChannel.receive(1)
            // wait for the timer or the signal
            response = (timer or signal).await();
            //  exit loop if we received a signal
            if (response instanceof BookingStatus) break;
        }

        // we did not receive host's response
        if (response !instanceof BookingStatus) {
            // notify host of traveler request
            dispatch(hostService::notifyExpiration, traveler, host, request)
            // notify host of traveler request
            dispatch(travelerService::notifyExpiration, traveler, host, request)
            // workflow stops here
            return
        }

        // host did not accept the request
        if (response  == BookingStatus.DENIED) {
            // notify host of traveler request
            dispatch(travelerService::notifyDenial, traveler, host, request)
            // workflow stops here
            return
        }

        // trigger deposit workflow and wait for it
        paymentWorkflow.getDeposit(traveler, host, request)

        // notify host of the succesful booking
        dispatch(hostService::notifyBooking, traveler, host, request)

        // notify traveler of the succesful booking
        dispatch(travelerService::notifyBooking, traveler, host, request)
    }
}
```

{% /codes %}

This workflow showcases complex decision-making and communication between multiple parties.


{% callout type="note"  %}

We have the ability to dispatch [external signals](/docs/workflows/signals) to a workflow to inform it of an event or change. A signal is a type of [serializable](/docs/references/serializability) object. For a workflow to receive and process a signal, it needs to be equipped with a [channel](/docs/workflows/signals#implementing-channels).

{% /callout  %}


This example with the `PaymentWorkflow`` demonstrates that a workflow can launch another [sub-workflow](/docs/workflows/syntax#dispatch-a-child-workflow), either in a synchronous or asynchronous manner. This capability unlocks endless possibilities.


## Reporitories examples

- "Hello World": a simple workflow with 2 sequential task. ([java](https://github.com/infiniticio/infinitic-example-java-hello-world), [kotlin](https://github.com/infiniticio/infinitic-example-kotlin-hello-world))
- "Booking Workflow": a saga pattern implementation with three tasks. ([java](https://github.com/infiniticio/infinitic-example-java-booking), [kotlin](https://github.com/infiniticio/infinitic-example-kotlin-booking))
- "Loyalty Workflow": A loyalty program with points updated through methods. ([java](https://github.com/infiniticio/infinitic-example-java-loyalty), [kotlin](https://github.com/infiniticio/infinitic-example-kotlin-loyalty))
- "Sync Workflow": this workflow continuously receives events, with each event initiating a sequence of three tasks. These tasks must be completed before the workflow can proceed to handle the next event ([java](https://github.com/infiniticio/infinitic-example-java-loyalty-signals))
