---
title: Service Logging
description: .
---

## Logging

{% callout type="warning" %}

Service Executors internally catch exceptions to manage task retries and failures. However, this means that these exceptions won't be visible in your application's standard error output. To effectively monitor and debug your service workers, it's crucial to implement a SL4J logger.

{% /callout %}

### Recommendations

Here are some recommendations for configuring your logging:

- Set the default log level to `warn`. This will allow you to see the most important information and avoid flooding your logs with too 
much information.

- Log the `io.infinitic.workers.InfiniticWorker` class at the `info` level. This allows you to monitor the worker's status and configuration.

- During development, consider logging the `io.infinitic.cloudEvents.ServiceExecutor.$serviceName` class at the `debug` level. This will display [events](/docs/services/events) related to your Service Executor in JSON format, which can be helpful for debugging.

### SimpleLogger Example 

To use SimpleLogger for logging in your Infinitic worker, follow these steps:

- Add the SimpleLogger dependency to your Gradle build file:

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

-  Add an `simplelogger.properties` example file in our `resources` directory:
    ```shell
    # Default logging detail level for all instances of SimpleLogger.
    org.slf4j.simpleLogger.defaultLogLevel=warn

    # Other Settings
    # ...

    # Log the InfiniticWorker class at the info level
    org.slf4j.simpleLogger.log.io.infinitic.workers.InfiniticWorker=info
    # Log the cloudevents of the ServiceExecutor's services at the info level
    org.slf4j.simpleLogger.log.io.infinitic.cloudEvents.ServiceExecutor.CarRentalService=info
    org.slf4j.simpleLogger.log.io.infinitic.cloudEvents.ServiceExecutor.FlightBookingService=info
    org.slf4j.simpleLogger.log.io.infinitic.cloudEvents.ServiceExecutor.HotelBookingService=info
    ```

