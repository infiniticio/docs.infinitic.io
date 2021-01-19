---
title: Our First App
description: ""
position: 1.4
category: "Overview"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

## Description

For this first app, we will showcase Infinitic capabilities by implementing a booking process combining a car rental, a flight and a hotel reservation.

> Important: we require that all 3 bookings have to be successful together: if any of them fails, we should cancel the other bookings that were successful.

<img src="/first-app.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/first-app.png" class="dark-img" width="1280" height="640" alt=""/>

## Implementation

We need 3 services: `CarRentalService`, `FlightBookingService`, and `HotelBookingService`, each of them having 2 tasks `book` and `cancel` with respectively `CarRentalCart`, `FlightBookingCart` and `HotelBookingCart` as parameter.

For example, this is `HotelBookingService`'s signature (`CarRentalService` and `FlightBookingService`'s signatures are similar):

<code-group>
  <code-block label="Kotlin" active>

```kotlin
interface HotelBookingService {
    fun book(cart: HotelBookingCart): HotelBookingResult

    fun cancel(cart: HotelBookingCart)
}
```

  </code-block>
</code-group>

The orchestration of a complete booking will be done through the `book` method of `BookingWorkflow`:

<code-group>
  <code-block label="Kotlin" active>

```kotlin
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

            inline { println("${this::class.simpleName}: booking canceled") }
            return BookingResult.FAILURE
        }

        // everything went fine
        inline { println("${this::class.simpleName}: booking succeeded") }
        return BookingResult.SUCCESS
    }
}
```

  </code-block>
</code-group>

This `book` method:

- triggers 3 tasks(`book(carRentalCart)` from `CarRentalService`, `book(flightCart)` from `FlightBookingService`, and `book(hotelCart)` from `HotelBookingService`). Those tasks are dispatched _in parallel_ thanks to the use of the `async` function.
- then wait for the completion of the car rental (by using `result()` method)
- then wait for the completion of the flight booking (by using `result()` method)
- then wait for the completion of the hotel booking (by using `result()` method)
- if at least one of those bookings were not successful:
  - triggers (sequentially) the cancelation of the other successful bookings
  - then ends the workflow with a `BookingResult.FAILURE` return value
- else ends the workflow with a `BookingResult.SUCCESS` return value

The code above is really all we need to build this workflow.

To demonstrate that, **we will now run it.**

## Prerequisites

Make sure we have a running Pulsar cluster and a Redis database available (see [prequisites](/overview/prerequisites)). We need to have Java installed also.

## Installation

Clone this repository locally:

<code-group>
  <code-block label="Kotlin" active>

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

## Pulsar's Configuration

_If it's the first time we use Infinitic with our Pulsar cluster_, we need to run:

```sh
./gradlew setupPulsar
```

This command will:

- create an `infinitic` Pulsar tenant (from `pulsar.tenant` value in `configs/infinitic.yml`)
- create a `dev` namespace (from `pulsar.namespace` value in `configs/infinitic.yml`) with relevant options such as [deduplication enabled](https://pulsar.apache.org/docs/en/cookbooks-deduplication/), [partitioned topics](https://pulsar.apache.org/docs/en/concepts-messaging/#partitioned-topics), [schema enforced](https://pulsar.apache.org/docs/en/schema-get-started/) and retention [policies](https://pulsar.apache.org/docs/en/cookbooks-retention-expiry/).

## Run workers

Now, we'll launch different services:

- Run CarRental service: `./gradlew run --args configs/carRental.yml`
- Run FlightBooking service: `./gradlew run --args configs/flightBooking.yml`
- Run HotelBooking service: `./gradlew run --args configs/hotelBooking.yml`
- Run BookingWorkflow service: `./gradlew run --args configs/bookingWorkflow.yml`
- Run engines: `./gradlew run --args configs/engines.yml`

> Note: if we want to start all services together, we can do `./gradlew run --args="configs/all.yml"`

**Those services can run from anywhere as soon as they have access to Pulsar** (and Redis for the last one). Those commands just set up and start an `InfiniticWorker` from the configuration files (both the one provided with the command line and `infinitic.yml`):

<code-group>
  <code-block label="Kotlin" active>

```kotlin
package infinitic.example.kotlin.booking

import io.infinitic.pulsar.InfiniticWorker

fun main(args: Array<String>) {
    InfiniticWorker.fromFile(*args, "configs/infinitic.yml").start()
}
```

  </code-block>
</code-group>

## Start A Booking Workflow

Now that **all** our services are running, we can use a client to start a workflow: `./gradlew startWorkflow`

<code-group>
  <code-block label="Kotlin" active>

```kotlin
package infinitic.example.kotlin.booking

import infinitic.example.kotlin.booking.tasks.carRental.CarRentalCart
import infinitic.example.kotlin.booking.tasks.flight.FlightBookingCart
import infinitic.example.kotlin.booking.tasks.hotel.HotelBookingCart
import infinitic.example.kotlin.booking.workflows.BookingWorkflow
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
```

  </code-block>
</code-group>

In our terminal, we should see something like (assuming we've launched all services in the same terminal):

```log
CarRentalServiceFake     (4e00ee6c-0ab9-44b8-ab8c-41614efc8dc8): booking ...
FlightBookingServiceFake (34ffd1d2-bca5-4873-81fc-f79260286ce0): booking ...
HotelBookingServiceFake  (b7f16477-afbb-4dcb-a75a-f165f4dd6a82): booking ...
CarRentalServiceFake     (4e00ee6c-0ab9-44b8-ab8c-41614efc8dc8): succeeded
FlightBookingServiceFake (34ffd1d2-bca5-4873-81fc-f79260286ce0): failed
HotelBookingServiceFake  (b7f16477-afbb-4dcb-a75a-f165f4dd6a82): failed
CarRentalServiceFake     (4e00ee6c-0ab9-44b8-ab8c-41614efc8dc8): canceled
BookingWorkflowImpl: book canceled
```

In this example, both FlightBookingService and HotelBookingService failed, so the previous car rental was canceled.

## Failure Simulation

### Server Failures

We can manually test some crash scenario:

- unexpectedly quit and restart some services
- unexpectedly close Pulsar and restart it

We should verify that any ongoing workflows will automatically resume from where it stops!

This is because workflows state and tasks state are automatically saved at each step. 
And if this operation fails for any reason, the underlying message will be reprocessed.

### Task Failures
We can also test what happens in tasks when an exception is thrown, by uncommenting the lines below:

<code-group>
  <code-block label="Kotlin" active>

```kotlin
package infinitic.example.kotlin.booking.tasks.hotel

import java.lang.RuntimeException
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
            // r >= 3000 -> {
            //    println("${this::class.simpleName}  (${cart.cartId}): exception! (retry in ${getRetryDelay()}s)")
            //    throw RuntimeException("failing request")
            //}
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

The `getRetryDelay` method provides the delay to wait after an exception before triggering a new attempt (5 seconds here). 