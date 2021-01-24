---
title: Example App
description: ""
position: 1.4
category: "Overview"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

## Description

For this first app, we will showcase Infinitic capabilities by implementing a booking process combining a car rental, a flight, and a hotel reservation. Moreover, _we require that all 3 bookings have to be successful together_: if any of them fails, we should cancel the other bookings that were successful.

<img src="/first-app.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/first-app.png" class="dark-img" width="1280" height="640" alt=""/>

## Implementation

We need 3 services: `CarRentalService`, `FlightBookingService`, and `HotelBookingService`, each of them having 2 tasks `book` and `cancel` with respectively `CarRentalCart`, `FlightBookingCart` and `HotelBookingCart` as parameter.

For example, this is `HotelBookingService`'s signature (`CarRentalService` and `FlightBookingService`'s signatures are similar):

<code-group>
  <code-block label="Java" active>

```java[src/main/java/example/booking/tasks/hotel/HotelBookingService.java]
package example.booking.tasks.hotel;

public interface HotelBookingService {
    HotelBookingResult book(HotelBookingCart cart);

    void cancel(HotelBookingCart cart);
}
```

  </code-block>
  <code-block label="Kotlin">

```kotlin[src/main/kotlin/example/booking/tasks/hotel/HotelBookingService.kt]
package example.booking.tasks.hotel

interface HotelBookingService {
    fun book(cart: HotelBookingCart): HotelBookingResult

    fun cancel(cart: HotelBookingCart)
}
```
  </code-block>
</code-group>

The orchestration of a complete booking will be done through the `book` method of `BookingWorkflow`:

<code-group>
  <code-block label="Java" active>

```java[src/main/java/example/booking/workflows/BookingWorkflowImpl.java]
package example.booking.workflows;

import example.booking.tasks.carRental.*;
import example.booking.tasks.flight.*;
import example.booking.tasks.hotel.*;
import io.infinitic.workflows.*;

public class BookingWorkflowImpl extends AbstractWorkflow implements BookingWorkflow {
    private final CarRentalService carRentalService = task(CarRentalService.class);
    private final FlightBookingService flightService = task(FlightBookingService.class);
    private final HotelBookingService hotelService = task(HotelBookingService.class);

    @Override
    public BookingResult book(
            CarRentalCart carRentalCart,
            FlightBookingCart flightCart,
            HotelBookingCart hotelCart
    ) {
        // parallel bookings using car rental, flight and hotel services

        Deferred<CarRentalResult> carRental = async(carRentalService, t -> t.book(carRentalCart));
        Deferred<FlightBookingResult> flight = async(flightService, t -> t.book(flightCart));
        Deferred<HotelBookingResult> hotel = async(hotelService, t -> t.book(hotelCart));

        // wait and assign results
        CarRentalResult carRentalResult = carRental.result(); // wait and assign result for CarRentalService::book
        FlightBookingResult flightResult = flight.result(); // wait and assign result for FlightService::book method
        HotelBookingResult hotelResult = hotel.result(); // wait and assign result for HotelService::book method

        // if at least one of the booking is failed than cancel all successful bookings
        if (carRentalResult == CarRentalResult.FAILURE ||
            flightResult == FlightBookingResult.FAILURE ||
            hotelResult == HotelBookingResult.FAILURE
        ) {
            if (carRentalResult == CarRentalResult.SUCCESS) { carRentalService.cancel(carRentalCart); }
            if (flightResult == FlightBookingResult.SUCCESS) { flightService.cancel(flightCart); }
            if (hotelResult == HotelBookingResult.SUCCESS) { hotelService.cancel(hotelCart); }

            inline(() -> println("book canceled"));
            return BookingResult.FAILURE;
        }

        // everything went fine
        inline(() -> println("book succeeded"));

        return BookingResult.SUCCESS;
    }

    private Object println(String msg) {
        System.out.println(this.getClass().getSimpleName() + ": " + msg);
        return null;
    }
}
```
  </code-block>
  <code-block label="Kotlin">

```kotlin[src/main/kotlin/example/booking/workflows/BookingWorkflowImpl.kt]
package example.booking.workflows

import example.booking.tasks.carRental.*
import example.booking.tasks.flight.*
import example.booking.tasks.hotel.*
import io.infinitic.workflows.*

class BookingWorkflowImpl : AbstractWorkflow(), BookingWorkflow {
    private val carRentalService = task<CarRentalService>()
    private val flightService = task<FlightBookingService>()
    private val hotelService = task<HotelBookingService>()

    override fun book(
        carRentalCart: CarRentalCart,
        flightCart: FlightBookingCart,
        hotelCart: HotelBookingCart
    ): BookingResult {
        // parallel bookings using car rental, flight and hotel services
        val carRental = async(carRentalService) { book(carRentalCart) }
        val flight = async(flightService) { book(flightCart) }
        val hotel = async(hotelService) { book(hotelCart) }

        // wait and assign results
        val carRentalResult = carRental.result() // wait and assign result for CarRentalService::book
        val flightResult = flight.result() // wait and assign result for FlightService::book method
        val hotelResult = hotel.result() // wait and assign result for HotelService::book method

        // if at least one of the booking is failed than cancel all successful bookings
        if (carRentalResult == CarRentalResult.FAILURE ||
            flightResult == FlightBookingResult.FAILURE ||
            hotelResult == HotelBookingResult.FAILURE
        ) {
            if (carRentalResult == CarRentalResult.SUCCESS) { carRentalService.cancel(carRentalCart) }
            if (flightResult == FlightBookingResult.SUCCESS) { flightService.cancel(flightCart) }
            if (hotelResult == HotelBookingResult.SUCCESS) { hotelService.cancel(hotelCart) }

            inline { println("${this::class.simpleName}: book canceled") }
            return BookingResult.FAILURE
        }

        // everything went fine
        inline { println("${this::class.simpleName}: book succeeded") }
        return BookingResult.SUCCESS
    }
}
```
  </code-block>
</code-group>

This `book` method:

- triggers 3 tasks(`book(carRentalCart)` from `CarRentalService`, `book(flightCart)` from `FlightBookingService`, and `book(hotelCart)` from `HotelBookingService`). Those tasks are dispatched _in parallel_ thanks to the use of the `async` function.
- then waits for the completion of the car rental (by using `result()` method)
- then waits for the completion of the flight booking (by using `result()` method)
- then waits for the completion of the hotel booking (by using `result()` method)
- if at least one of those bookings were not successful:
  - triggers (sequentially) the cancelation of the other successful bookings
  - then ends the workflow with a `BookingResult.FAILURE` return value
- else ends the workflow with a `BookingResult.SUCCESS` return value

The code above is really all we need to build this workflow.

To demonstrate that, we will now run it.

## Prerequisites

Make sure we have a running Pulsar cluster and a Redis database available (see [prequisites](/overview/prerequisites)). We need to have Java installed also.

## Installation

Clone the example repository locally:

<code-group>
  <code-block label="Java" active>

```bash
git clone https://github.com/infiniticio/infinitic-example-java-booking.git && cd infinitic-example-java-booking
```

  </code-block>
  <code-block label="Kotlin">

```bash
git clone https://github.com/infiniticio/infinitic-example-kotlin-booking.git && cd infinitic-example-kotlin-booking
```

  </code-block>
</code-group>

Then install dependencies:

```sh
./gradlew install
```

<alert type="warning">

The configuration file `configs/infinitic.yml` should contain correct values for Redis and Pulsar connections. Please update them if necessary.

</alert>

## Pulsar Configuration

_If it's the first time we use Infinitic with our Pulsar cluster_, we need to run:

```sh
./gradlew setupPulsar
```

This command will:

- create an `infinitic` Pulsar tenant (from `pulsar.tenant` value in `configs/infinitic.yml`)
- create a `dev` namespace (from `pulsar.namespace` value in `configs/infinitic.yml`) with relevant options such as [deduplication enabled](https://pulsar.apache.org/docs/en/cookbooks-deduplication/), [partitioned topics](https://pulsar.apache.org/docs/en/concepts-messaging/#partitioned-topics), [schema enforced](https://pulsar.apache.org/docs/en/schema-get-started/) and [retention policies](https://pulsar.apache.org/docs/en/cookbooks-retention-expiry/).

## Run workers

Now, we'll launch different services. The commands below just set up and start an `InfiniticWorker` from the provided configuration files (both the one provided with the command line and `infinitic.yml`):

<code-group>
  <code-block label="Java" active>

```java[src/main/java/example/booking/Worker.java]
package example.booking;

import io.infinitic.pulsar.InfiniticWorker;

public class Worker {
    public static void main(String[] args) {
        InfiniticWorker.fromFile(args[0], "configs/infinitic.yml").start();
    }
}
```
  </code-block>
  <code-block label="Kotlin">

```kotlin[src/main/kotlin/example/booking/Worker.kt]
package example.booking

import io.infinitic.pulsar.InfiniticWorker

fun main(args: Array<String>) {
    InfiniticWorker.fromFile(*args, "configs/infinitic.yml").start()
}
```
  </code-block>
</code-group>

### Run services all together

We may run all services within the same executable:

```sh
./gradlew run --args configs/all.yml
```

Or **alternatively**, run all services independently one-by-one to simulate a distributed environment:

### Run services individually

Those services can run from anywhere as soon as they have access to Pulsar (and Redis for the last one).

- Run CarRental service:

```sh
./gradlew run --args configs/carRental.yml
```

- Run FlightBooking service:

```sh
./gradlew run --args configs/flightBooking.yml
```

- Run HotelBooking service:

```sh
./gradlew run --args configs/hotelBooking.yml
```

- Run BookingWorkflow service:

```sh
./gradlew run --args configs/bookingWorkflow.yml
```

- Run engines:

```sh
./gradlew run --args configs/engines.yml
```

## Start A Booking Workflow

Now that **all** our services are running, we can start a workflow through an InfiniticClient:

```sh
./gradlew startWorkflow
```

This command triggers:

<code-group>
  <code-block label="Java" active>

```java[src/main/java/example/booking/Client.java]
package example.booking;

import example.booking.tasks.carRental.CarRentalCart;
import example.booking.tasks.flight.FlightBookingCart;
import example.booking.tasks.hotel.HotelBookingCart;
import example.booking.workflows.BookingWorkflow;
import io.infinitic.pulsar.InfiniticClient;
import java.util.UUID;

public class Client {
    public static void main(String[] args) {
        // instantiate Infinitic client based on infinitic.yml config file
        InfiniticClient client = InfiniticClient.fromFile("configs/infinitic.yml");

        // faking some carts
        CarRentalCart carRentalCart = new CarRentalCart(getId());
        FlightBookingCart flightCart = new FlightBookingCart(getId());
        HotelBookingCart hotelCart = new HotelBookingCart(getId());

        // starting a workflow
        client.startWorkflowAsync(
                BookingWorkflow.class,
                w -> w.book(carRentalCart, flightCart, hotelCart)
        ).join();

        // closing underlying PulsarClient
        client.close();
    }

    private static String getId() {
        return UUID.randomUUID().toString();
    }
}
```

  </code-block>
  <code-block label="Kotlin">

```kotlin[src/main/kotlin/example/booking/Client.kt]
package example.booking

import example.booking.tasks.carRental.CarRentalCart
import example.booking.tasks.flight.FlightBookingCart
import example.booking.tasks.hotel.HotelBookingCart
import example.booking.workflows.BookingWorkflow
import io.infinitic.pulsar.InfiniticClient
import kotlinx.coroutines.runBlocking
import java.util.UUID

fun main() = runBlocking {

    // instantiate Infinitic client based on infinitic.yml config file
    val client = InfiniticClient.fromFile("configs/infinitic.yml")

    // faking some carts
    val carRentalCart = CarRentalCart(getId())
    val flightCart = FlightBookingCart(getId())
    val hotelCart = HotelBookingCart(getId())

    // starting a workflow
    client.startWorkflow<BookingWorkflow> { book(carRentalCart, flightCart, hotelCart) }

    // closing underlying PulsarClient
    client.close()
}

fun getId() = UUID.randomUUID().toString()
```

  </code-block>
</code-group>

Assuming we've launched all services together, we should see something like this, where the services are running:

```log
CarRentalServiceFake     (4e00ee6c-0ab9-44b8-ab8c-41614efc8dc8): booking...
FlightBookingServiceFake (34ffd1d2-bca5-4873-81fc-f79260286ce0): booking...
HotelBookingServiceFake  (b7f16477-afbb-4dcb-a75a-f165f4dd6a82): booking...
CarRentalServiceFake     (4e00ee6c-0ab9-44b8-ab8c-41614efc8dc8): succeeded
FlightBookingServiceFake (34ffd1d2-bca5-4873-81fc-f79260286ce0): failed
HotelBookingServiceFake  (b7f16477-afbb-4dcb-a75a-f165f4dd6a82): failed
CarRentalServiceFake     (4e00ee6c-0ab9-44b8-ab8c-41614efc8dc8): canceled
BookingWorkflowImpl: book canceled
```

In the example above, both FlightBookingService and HotelBookingService failed, so the previous car rental was canceled.

## Failure Simulation

### Server Failures

We can manually test some crash scenarios:

- unexpectedly quit and restart some services
- unexpectedly close Pulsar and restart it
- unexpectedly close Redis and restart it

We should verify that any running workflows will automatically resume from where it stops!

This illustrates one of Infinitic best features: crash resilience.

### Task Failures

We can also test what happens in tasks when an exception is thrown, by uncommenting the lines below:

<code-group>
   <code-block label="Java" active>

```java[src/main/java/example/booking/tasks/hotel/HotelBookingServiceFake.java]
package example.booking.tasks.hotel;

public class HotelBookingServiceFake implements HotelBookingService {
    @Override
    public HotelBookingResult book(HotelBookingCart cart) {
        // fake emulation of success/failure
        println(cart, "booking ...");

        long r = (long) (Math.random() * 5000);
        try {
            Thread.sleep(r);
        } catch (InterruptedException e) {
            throw new RuntimeException("interrupted");
        }

        if (r >= 4000) {
            println(cart, "failed");
            return HotelBookingResult.FAILURE;
        }

        // uncomment lines below to test task retries
//        if (r >= 3000 ) {
//            println(cart, "exception! (retry in " + getRetryDelay() + " seconds)");
//            throw new RuntimeException("failing request");
//        }

        println(cart, "succeeded");
        return HotelBookingResult.SUCCESS;
    }

    @Override
    public void cancel(HotelBookingCart cart) {
        println(cart, "canceled");
    }

    public Float getRetryDelay() {
        return 5F;
    }

    private void println(HotelBookingCart cart, String msg) {
        System.out.println(this.getClass().getSimpleName() + "     (" + cart.getCartId() + "): " + msg);
    }
}
```
  </code-block>
  <code-block label="Kotlin">

```kotlin[src/main/kotlin/example/booking/tasks/hotel/HotelBookingServiceFake.kt]
package example.booking.tasks.hotel

import kotlin.random.Random

class HotelBookingServiceFake : HotelBookingService {
    override fun book(cart: HotelBookingCart): HotelBookingResult {
        // fake emulation of success/failure
        println("${this::class.simpleName}  (${cart.cartId}): booking ...")

        val r = Random.nextLong(0, 5000)
        Thread.sleep(r)

        return when {
            r >= 4000 -> {
                println("${this::class.simpleName}  (${cart.cartId}): failed")
                HotelBookingResult.FAILURE
            }
            // uncomment lines below to test task retries
//            r >= 3000 -> {
//                println("${this::class.simpleName}  (${cart.cartId}): exception! (retry in ${getRetryDelay()}s)")
//                throw RuntimeException("failing request")
//            }
            else -> {
                println("${this::class.simpleName}  (${cart.cartId}): succeeded")
                HotelBookingResult.SUCCESS
            }
        }
    }

    override fun cancel(cart: HotelBookingCart) {
        println("${this::class.simpleName}  (${cart.cartId}): canceled")
    }

    fun getRetryDelay() = 5F
}
```
  </code-block>
</code-group>

Here, the `getRetryDelay` method tells Infinitic to retry that task after 5 seconds in case of exceptions. Once the task eventually completed, the workflow will resume.
