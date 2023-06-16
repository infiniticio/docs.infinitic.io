---
title: Service Workers
description: Quidem magni aut exercitationem maxime rerum eos.
---

Infinitic provides a generic worker that executes tasks or workflows depending on its configuration.
When configured to run a service, a worker will:

- listen to Pulsar for messages intended for this service
- deserialize parameters and process the requested task
- serialize the return value and send it back.

![Service workers](/img/concept-task@2x.png)

{% callout type="note"  %}

Service workers are horizontally scalable: to increase throughput and resilience, just start workers on multiple servers.

{% /callout  %}

Service workers also catch any thrown exception to automatically retry the task (see [task failure](/docs/services/syntax#task-failure)).

## Starting a Service worker

First, let's add the `infinitic-worker` dependency into our project:

{% codes %}

```java [build.gradle]
dependencies {
    ...
    implementation "io.infinitic:infinitic-worker:0.11.+"
    ...
}
```

```kotlin [build.gradle.kts]
dependencies {
    ...
    implementation("io.infinitic:infinitic-worker:0.11.+")
    ...
}
```

{% /codes %}

Then, we can start a worker with:

{% codes %}

```java
import io.infinitic.workers.InfiniticWorker;

public class App {
    public static void main(String[] args) {
        try(InfiniticWorker worker = InfiniticWorker.fromConfigFile("infinitic.yml")) {
            worker.start();
        }
    }
}
```

```kotlin
import io.infinitic.workers.InfiniticWorker

fun main() {
    InfiniticWorker.fromConfigFile("infinitic.yml").use { worker ->
        worker.start()
    }
}
```

{% /codes %}

We can also use `.fromConfigResource("/infinitic.yml")` if the configuration file is located in the resource folder.

## Configuration file

Here is an example of a valid `infinitic.yml` file:

```yaml
# (Optional) Worker name
name: gilles_worker

# Pulsar settings
pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev

# (Optional) default values for services
service:
  concurrency: 10
  timeoutInSeconds: 400
  retry:
    maximumRetries: 6

# Services definition
services:
  - name: example.booking.services.carRental.CarRentalService
    class: example.booking.services.carRental.CarRentalServiceImpl
    concurrency: 5
    timeoutInSeconds: 100
  - name: example.booking.services.flight.FlightBookingService
    class: example.booking.services.flight.FlightBookingServiceImpl
  - name: example.booking.services.hotel.HotelBookingService
    class: example.booking.services.hotel.HotelBookingServiceImpl
```

This configuration contains
- an optional worker name
- optional default values for service's `concurrency`, `timeoutInSeconds` and `retry`
- the [Pulsar settings](/docs/references/pulsar)
- the description of services:

| Name | Type | Description | Default
| ---- | ---- | ----------- | ------- |
| `name`        | string  | name of the service (its interface per default) |
| `class`       | string  | name of the class to instantiate |
| `concurrency` | integer | number of tasks executed in parallel | 1
| `timeoutInSeconds` | double | maximum duration of a task execution before timeout | null
| `retry` | RetryPolicy | retry policy for the tasks of this service | cf. below

{% callout type="warning"  %}

Worker `name` (when provided) must be unique among all our workers and clients connected to the same Pulsar namespace.

{% /callout  %}

{% callout type="warning"  %}

Any `class` declared in this configuration file must have an empty constructor (to be instantiable by workers).

{% /callout  %}

### Concurrency

Per default, tasks are executed one after the other for a given service. If we provide a value for `concurrency`, like:

```yaml
concurrency: 50
```

the Service worker will execute at most 50 tasks in parallel for this service.

### Timeout policy

Per default, tasks have no timeout defined. If we provide a value for `timeoutInSeconds`:

```yaml
timeoutInSeconds: 100
```

the Service worker will throw an `io.infinitic.exceptions.tasks.TimeoutException` if the task is still
 executing after `timeoutInSeconds` seconds.

The task will be then retried - or not - based on its retry policy.

{% callout type="note"  %}

The timeout can also be defined directly from the Service, through a [`WithTimeout`](/docs/services/syntax#withtimeout-interface) interface or [`@Timeout`](/docs/services/syntax#timeout-annotation) annotation

{% /callout  %}

### Retries policy

The `retry` parameter lets us define a truncated randomized exponential backoff retry policy.
If none is provided, this default setting is applied:

```yaml
retry:
  minimumSeconds: 1      
  maximumSeconds: 1000   # default = 1000 * minimumSeconds
  backoffCoefficient: 2  
  randomFactor: 0.5     
  maximumRetries: 11    
  ignoredExceptions:     
    - # name of an first exception to ignore
    - # name of an second exception to ignore
    - # name of an third exception to ignore
```

If an exception - not listed in `ignoredExceptions` - is thrown during the task execution, and if `maximumRetries` is not reached yet, then the task will be retried after (seconds):

```
min(maximumSeconds, minimumSeconds * (backoffCoefficient ^ attempt)) * 
  (1 + randomFactor * (2 * random() - 1))
```

where `random()` is a random value between `0` and `1`.

If we do not want any retries, the simplest configuration is:

```yaml
retry:    
  maximumRetries: 0   
```

{% callout type="note"  %}

The retry policy can also be defined directly from the Service, through a [`WithRetry`](/docs/services/syntax#withretry-interface) interface or [`@Retry`](/docs/services/syntax#retry-annotation) annotation

{% /callout  %}

## Service registration

We can register a service directly with a worker. It can be useful if you need to inject some dependencies in our service:

{% codes %}

```java
import io.infinitic.workers.InfiniticWorker;

public class App {
    public static void main(String[] args) {
        try(InfiniticWorker worker = InfiniticWorker.fromConfigFile("infinitic.yml")) {
            worker.registerService(
                // service name
                CarRentalService.class.getName(),                                                
                // function providing an instance of the service
                () -> new CarRentalServiceFake(/* some injection here*/),
                // number of parallel processings (default: 1)
                50,
                // instance of WithTimeout (default: null)
                withTimeout,
                // instance of WithRetry (default: null)
                withRetry
            );
            worker.start();
        }
    }
}
```

```kotlin
import io.infinitic.workers.InfiniticWorker

fun main(args: Array<String>) {
    InfiniticWorker.fromConfigFile("infinitic.yml").use { worker ->
        worker.registerService(
            // service name
            CarRentalService.class.getName(), 
            // function providing an instance of the service                          
            { CarRentalServiceFake(/* some injection here*/) },
            // number of parallel processings (default: 1)
            50,
            // instance of WithTimeout (default: null)
            withTimeout,
            // instance of WithRetry (default: null)
            withRetry
        )
        worker.start()
    }
}
```

{% /codes %}

(cf. [withTimeout](/docs/services/syntax#withtimeout-interface) and [withRetry](/docs/services/syntax#withretry-interface))

## Logging

{% callout type="warning"  %}

Exceptions are caught within service workers. Let's not forget to add a Log4J implementation to our project to be able to see errors.

{% /callout  %}

For example, to use `SimpleLogger` just add the dependency in our Gradle build file:

{% codes %}

```java
dependencies {
    ...
    implementation "org.slf4j:slf4j-simple:2.0.3"
    ...
}
```

```kotlin
dependencies {
    ...
    implementation("org.slf4j:slf4j-simple:2.0.3")
    ...
}
```

{% /codes %}

and this `simplelogger.properties` example file in our `resources` directory:

```shell [src/main/resources/simplelogger.properties]
# SLF4J's SimpleLogger configuration file
# Simple implementation of Logger that sends all enabled log messages, for all defined loggers, to System.err.

# Uncomment this line to use a log file
#org.slf4j.simpleLogger.logFile=infinitic.log

# Default logging detail level for all instances of SimpleLogger.
# Must be one of ("trace", "debug", "info", "warn", or "error").
# If not specified, defaults to "info".
org.slf4j.simpleLogger.defaultLogLevel=warn

# Set to true if you want the current date and time to be included in output messages.
# Default is false, and will output the number of milliseconds elapsed since startup.
org.slf4j.simpleLogger.showDateTime=true

# Set to true if you want to output the current thread name.
# Defaults to true.
org.slf4j.simpleLogger.showThreadName=false


# Set to true if you want the last component of the name to be included in output messages.
# Defaults to false.
org.slf4j.simpleLogger.showShortLogName=true
```
