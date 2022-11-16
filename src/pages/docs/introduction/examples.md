---
title: Workflow Examples
description: Quidem magni aut exercitationem maxime rerum eos.
---

We will give here some examples of workflows to illustrate how powerful Infinitic is.

## Bookings and Saga

We implement a booking process combining a car rental, a flight, and a hotel reservation. _We require that all three bookings have to be successful together_: if any of them fails, we should cancel the other successful bookings.

![Bookings and Saga](/img/booking-saga@2x.png)

This is `HotelBookingService`'s signature (`CarRentalService` and `FlightBookingService`'s signatures are similar):

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

The orchestration of a complete booking will be done through the `book` method of `BookingWorkflow`:

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

This is really all we need to implement this workflow.

{% callout type="note"  %}

Inside a workflow, using the [`dispatch`](/docs/workflows/syntax#dispatch-a-new-task) function triggers the execution of a task _without blocking the flow of the workflow_.
Multiple uses of this function will trigger parallel executions of multiple tasks.
The `dispatch` function returns a `Deferred` object, which is a reference to the dispatched task.
By applying the `await()` method to it, we tell the workflow to wait for the task completion and to return its result.

{% /callout  %}

## Monthly invoicing

Let's consider now a workflow where, every month, we will:

- use a Consumption service to get some metrics from a user
- use a payment service to charge the user payment card
- generate an invoice
- send the invoice to the user

![Monthly invoicing](/img/invoicing@2x.png)

With Infinitic, we do not need any cron, writing such workflow is as simple as:

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

Inside a workflow, awaiting a [`timer`](/docs/workflows/waiting) blocks the flow of the workflow up to the desired `Instant` or `Duration` (no resources are used during this waiting time).

{% /callout  %}

{% callout type="warning"  %}

Inside a workflow, all instructions [must be deterministic](/docs/workflows/syntax#constraints) - that's why the instruction `LocalDate.now()` must be in a task. Here, the [`inline`](/docs/workflows/inline) function creates a pseudo-task inlined in the workflow.

{% /callout  %}

{% callout type="warning"  %}

A workflow [must not contain a very high number of tasks](/docs/workflows/syntax#constraints), that's why loops should be avoided. Here, we have a limited number of possible iterations (running for 10 years will generate only 120 iterations) and 7 tasks per iteration. So we are fine in this case.

{% /callout  %}

## Loyalty program

Let's consider now a point-based loyalty program where:

- users receive 10 points every week
- users receive 100 points every time they complete a form
- users receive 100 points every time they complete an order
- users can burn points

![Loyalty program](/img/loyalty@2x.png)

With Infinitic, we can implement such a loyalty program like this:

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

An Infinitic client (or another workflow) can [call methods](/docs/clients/start-method) of a running workflow. Multiple methods of the same workflow instance can run in parallel (but only one is running at a given time - one way to think of it is as an asynchronous but single-threaded execution)

{% /callout  %}

{% callout type="note"  %}

[Properties](/docs/workflows/properties) in workflows can be used to store information mutable from multiple methods.

{% /callout  %}

{% callout type="warning"  %}

A workflow [must not contain a very high number of tasks](/docs/workflows/syntax#constraints), that's why loops should be avoided. Here we have a limited number of possible iterations (running for 10 years will generate 560 iterations only) and 2 tasks per iteration. So we are fine in this case.

{% /callout  %}

## Location Booking

Let's consider now an Airbnb-like service, where a traveler does a request to a host. The host will be notified of the request at most 3 times. If the response is positive, the traveler should pay a deposit, then both are notified.

![Location Booking](/img/location@2x.png)

This workflow could be implemented as such:

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

{% callout type="note"  %}

We can send [external signals](/docs/workflows/signals) to a workflow to notify it that something happened. A signal is a [serializable](/docs/references/serializability) object. To receive a signal, a workflow must have a [channel](/docs/workflows/signals#implementing-channels).

{% /callout  %}

{% callout type="note"  %}

As illustrated here with the `PaymentWorkflow`, a workflow can dispatch (synchronously or asynchronously)
another [sub-workflow](/docs/workflows/syntax#dispatch-a-child-workflow).
It opens unlimited possibilities.

{% /callout  %}

## Projects examples

- "Hello World": simple workflow with 2 sequential tasks ([java](https://github.com/infiniticio/infinitic-example-java-hello-world), [kotlin](https://github.com/infiniticio/infinitic-example-kotlin-hello-world))
- "Booking Workflow": saga pattern implementation with 3 tasks ([java](https://github.com/infiniticio/infinitic-example-java-booking), [kotlin](https://github.com/infiniticio/infinitic-example-kotlin-booking))
- "Loyalty Workflow": loyalty points are maintained as workflow properties and updated through a method ([java](https://github.com/infiniticio/infinitic-example-java-loyalty), [kotlin](https://github.com/infiniticio/infinitic-example-kotlin-loyalty))
- "Sync Workflow": the workflow continuoulsy receives events. Each event triggers 3 sequential tasks that must be processed before processing the next event ([java](https://github.com/infiniticio/infinitic-example-java-loyalty-signals))
