---
title: Hello World Application
description: Quidem magni aut exercitationem maxime rerum eos.
---

We'll show here how to build an "Hello World" workflow from scratch, with the following steps:

- create a project
- write tasks
- write a workflow
- deploy workers
- run a workflow

The workflow `HelloWorld` will take a `name` string as input and return `"Hello $name!"` using sequentially 2 tasks run on distributed workers:

- a `sayHello` task that takes a `name` string as input and returns `"Hello $name"`
- an `addEnthusiasm` task that takes a `str` string as input and returns `"$str!"`

## Prerequisites

We need to have [Gradle](https://gradle.org/install/) installed, with: 

- an Apache Pulsar cluster ([install](https://pulsar.apache.org/docs/en/standalone-docker/))
- a Redis ([install](https://redis.io/topics/introduction)) or MySQL database, to store workflow states.

If we have Docker on our computer, we can simply run `docker-compose up` on this `docker-compose.yml` file:

```yaml
services:
  # Pulsar settings
  pulsar-standalone:
    image: apachepulsar/pulsar:2.10.0
    environment:
      - BOOKIE_MEM=" -Xms512m -Xmx512m -XX:MaxDirectMemorySize=1g"
    command: >
      /bin/bash -c "bin/apply-config-from-env.py conf/standalone.conf && bin/pulsar standalone"
    volumes:
      - "pulsardata:/pulsar/data"
      - "pulsarconf:/pulsar/conf"
    ports:
      - "6650:6650"
      - "8080:8080"
      - "8081:8081"

  # Redis storage for state persistence
  redis:
    image: redis:6.0-alpine
    ports:
      - "6379:6379"
    volumes:
      - "redisdata:/data"

volumes:
  pulsardata:
  pulsarconf:
  redisdata:
```

## Create project

Create a new project within a new directory:

```bash
mkdir hello-world && cd hello-world && gradle init
```

Configure this project:

{% code-java %}

```
Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 2

Select implementation language:
  1: C++
  2: Groovy
  3: Java
  4: Kotlin
  5: Swift
Enter selection (default: Java) [1..5] 3

Split functionality across multiple subprojects?:
  1: no - only one application project
  2: yes - application and library projects
Enter selection (default: no - only one application project) [1..2] 1

Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Kotlin) [1..2] 1

Project name (default: hello-world):
Source package (default: hello.world):
```

{% /code-java %}

{% code-kotlin %}

```sh
Select type of project to generate:
  1: basic
  2: application
  3: library
  4: Gradle plugin
Enter selection (default: basic) [1..4] 2

Select implementation language:
  1: C++
  2: Groovy
  3: Java
  4: Kotlin
  5: Swift
Enter selection (default: Java) [1..5] 4

Split functionality across multiple subprojects?:
  1: no - only one application project
  2: yes - application and library projects
Enter selection (default: no - only one application project) [1..2] 1

Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Kotlin) [1..2] 2

Select test framework:
  1: JUnit 4
  2: TestNG
  3: Spock
  4: JUnit Jupiter
Enter selection (default: JUnit 4) [1..4] 1

Project name (default: hello-world):
Source package (default: hello.world):
```

{% /code-kotlin %}

in our build gradle file, we add:

- Maven repository
- needed dependencies
- instruction to compile to Java 1.8

{% codes %}

```java [app/build.gradle]
plugins {
    id 'application'
}

application {
    // Define the main class for the application.
    mainClassName = 'hello.world.App'
}

repositories {
    mavenCentral()
}

dependencies {
    // infinitic client
    implementation "io.infinitic:infinitic-client:0.11.+"
    // infinitic worker
    implementation "io.infinitic:infinitic-worker:0.11.+"
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}
```

```kotlin [app/build.gradle.kts]
plugins {
    id("org.jetbrains.kotlin.jvm") version "1.5.10"

    application
}

repositories {
    mavenCentral()
}

dependencies {
    // infinitic client
    implementation("io.infinitic:infinitic-client:0.11.+")
    // infinitic worker
    implementation("io.infinitic:infinitic-worker:0.11.+")
}

tasks.withType<org.jetbrains.kotlin.gradle.services.KotlinCompile> {
    kotlinOptions.jvmTarget = JavaVersion.VERSION_11.toString()
}


application {
    // Define the main class for the application.
    mainClass.set("hello.world.AppKt")
}
```

{% /codes %}

And install dependencies:

```sh
./gradlew install
```

## Writing services

Let's create a `services` directory:

```sh
mkdir app/src/main/java/hello/world/services
```

in which, we add a `HelloWorldService` interface:

{% codes %}

```java [app/src/main/java/hello/world/services/HelloWorldService.java]
package hello.world.services;

public interface HelloWorldService {
    String sayHello(String name);

    String addEnthusiasm(String str);
}
```

```kotlin [app/src/main/kotlin/hello/world/services/HelloWorldService.kt]
package hello.world.services

interface HelloWorldService {
    fun sayHello(name: String): String

    fun addEnthusiasm(str: String): String
}
```

{% /codes %}

and a `HelloWorldServiceImpl` implementation:

{% codes %}

```java [app/src/main/java/hello/world/services/HelloWorldServiceImpl.java]
package hello.world.services;

public class HelloWorldServiceImpl implements HelloWorldService {
    @Override
    public String sayHello(String name) {

        return "Hello " + ((name == null) ? "World" : name);
    }

    @Override
    public String addEnthusiasm(String str) {

        return str + "!";
    }
}
```

```kotlin [app/src/main/kotlin/hello/world/services/HelloWorldServiceImpl.kt]
package hello.world.services

class HelloWorldServiceImpl : HelloWorldService {
    override fun sayHello(name: String) = "Hello $name"

    override fun addEnthusiasm(str: String) = "$str!"
}
```

{% /codes %}

## Writing workflow

Let's create a `workflows` directory:

```sh
mkdir app/src/main/java/hello/world/workflows
```

in which, we add a `HelloWorldWorkflow` interface:

{% codes %}

```java [app/src/main/java/hello/world/workflows/HelloWorldWorkflow.java]
package hello.world.workflows;

public interface HelloWorldWorkflow {
    String greet(String name);
}
```

```kotlin [app/src/main/kotlin/hello/world/workflows/HelloWorldWorkflow.kt]
package hello.world.workflows

interface HelloWorldWorkflow {
    fun greet(name: String): String
}
```

{% /codes %}

and a `HelloWorldWorkflowImpl` implementation:

{% callout type="warning"  %}

Workflow implementation must extend `io.infinitic.workflows.Workflow`

{% /callout  %}

{% codes %}

```java [app/src/main/java/hello/world/workflows/HelloWorldWorkflowImpl.java]
package hello.world.workflows;

import hello.world.services.HelloWorldService;
import io.infinitic.workflows.Workflow;

public class HelloWorldWorkflowImpl extends Workflow implements HelloWorld {
    // create a stub for the HelloWorldService
    private final HelloWorldService helloWorldService = newService(HelloWorldService.class);

    @Override
    public String greet(String name) {
        // synchronous call of HelloWorldService::sayHello
        String str = helloWorldService.sayHello(name);

        // synchronous call of HelloWorldService::addEnthusiasm
        String greeting =  helloWorldService.addEnthusiasm(str);

        // inline task to display the result
        inlineVoid(() -> System.out.println(greeting));

        return greeting;
    }
}
```

```kotlin [app/src/main/kotlin/hello/world/workflows/HelloWorldWorkflowImpl.kt]
package hello.world.workflows

import hello.world.services.HelloWorldService
import io.infinitic.workflows.Workflow

class HelloWorldWorkflowImpl: Workflow(), HelloWorld {
    // create a stub for the HelloWorldService
    private val helloWorldService = newService(HelloWorldService::class.java)

    override fun greet(name: String): String {
        // synchronous call of HelloWorldService::sayHello
        val str = helloWorldService.sayHello(name)

        // synchronous call of HelloWorldService::addEnthusiasm
        val greeting =  helloWorldService.addEnthusiasm(str)

        // inline task to display the result
        inline { println(greeting) }

        return  greeting
    }
}
```

{% /codes %}

Note the `newService` function creating a stub from the `HelloWorldService` interface. From a syntax point of view, this stub can be used as an implementation of `HelloWorldService` . But instead of executing a method, it sends a message to Infinitic requesting this execution. That's why nothing happens if we run a workflow without having deployed any worker.

## Pulsar configuration

The `app/infinitic.yml` file should contain the Pulsar configuration:

```yaml
pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```

## Deploying workers

The easiest way to build workers is from an `app/infinitic.yml` config file:

```yaml
storage:
  redis:
    host: localhost
    port: 6379
    user:
    password:
    database: 0

pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  tenant: infinitic
  namespace: dev

services:
  - name: hello.world.services.HelloWorldService
    class: hello.world.services.HelloWorldServiceImpl

workflows:
  - name: hello.world.workflows.HelloWorld
    class: hello.world.workflows.HelloWorldImpl
```

{% callout type="warning"  %}

Please update values for Redis and Pulsar connections if necessary.

{% /callout  %}

Then, to create a worker, just replace the App file with:

{% codes %}

```java [app/src/main/java/hello/world/App.java]
package hello.world;

import io.infinitic.worker.InfiniticWorker;

public class App {
    public static void main(String[] args) {
        try(InfiniticWorker worker = InfiniticWorker.fromConfigFile("infinitic.yml")) {
            worker.start();
        }
    }
}
```

```kotlin [app/src/main/kotlin/hello/world/App.kt]
package hello.world

import io.infinitic.worker.InfiniticWorker

fun main(args: Array<String>) {
    InfiniticWorker.fromConfigFile("infinitic.yml").use { worker ->
        worker.start()
    }
}
```

{% /codes %}

Our app is ready to run as a worker:

```sh
./gradlew run
```

We have a working worker listening Pulsar and waiting for instructions:

```sh
> Task :run
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
```

{% callout type="note"  %}

The SLF4J outputs are there because we do not have any logger yet in the app. To remove those messages, add our logger of choice (for example [Simple Logger] (#simple-logger) as a dependency in our Gradle build file.

{% /callout  %}

{% callout type="warning"  %}

When coding, workers need to be restarted to account for any change.

{% /callout  %}

## Start a workflow

The easiest way to instantiate an InfiniticClient is to use a config file exposing a `pulsar` configuration.
Here, we already have the `infinitic.yml` file that we can reuse in a new `Client` file:

{% codes %}

```java [app/src/main/java/hello/world/Client.java]
package hello.world;

import hello.world.workflows.HelloWorldWorkflow;
import io.infinitic.client.Deferred;
import io.infinitic.client.InfiniticClient;

public class Client {
    public static void main(String[] args) {
        String name = args.length > 0 ? args[0] : "World";

        try(InfiniticClient client = InfiniticClient.fromConfigFile("infinitic.yml")) {
            // create a stub from HelloWorldWorkflow interface
            HelloWorldWorkflow helloWorld = client.newWorkflow(HelloWorldWorkflow.class);

            // asynchronous dispatch of a workflow
            Deferred<String> deferred = client.dispatch(w::greet, name);

            // let's see what happens
            System.out.println("workflow " + HelloWorldWorkflow.class.getName() + " " + deferred.getId() + " dispatched!");
        }
    }
}
```

```kotlin [app/src/main/kotlin/hello/world/Client.kt]
package hello.world

import hello.world.workflows.HelloWorldWorkflow
import io.infinitic.client.Deferred
import io.infinitic.client.InfiniticClient

fun main(args: Array<String>) {
    val name = args.firstOrNull() ?: "World"

    InfiniticClient.fromConfigFile("infinitic.yml").use { client ->
        // create a stub from HelloWorld interface
        val helloWorld = client.newWorkflow(HelloWorldWorkflow::class.java)

        // dispatch workflow
        val deferred : Deferred<String> = client.dispatch(w::greet, name)

        // let's see what happens
        println("workflow ${HelloWorldWorkflow::class} ${deferred.id} dispatched!")
    }
}

```

{% /codes %}

We can run it directly from our IDE (we may need to change the working directory on the Run configuration), or add the `startWorkflow` Gradle task to our build file:

{% codes %}

```java [app/build.gradle]
...

task startWorkflow(type: JavaExec) {
    group = "infinitic"
    main = "hello.world.Client"
    classpath = sourceSets.main.runtimeClasspath
}
```

```kotlin [app/build.gradle.kts]
...

task("startWorkflow", JavaExec::class) {
    group = "infinitic"
    main = "hello.world.ClientKt"
    classpath = sourceSets["main"].runtimeClasspath
}
```

{% /codes %}

and run it from the command line:

```sh
./gradlew startWorkflow --args Infinitic
```

Where our app/worker is running, we should see:

```sh
Hello Infinitic!
```

Congrats! We have run our first Infinitic workflows.

## Debugging

### Check-list

Here is a check-list when encountering issues:

- Pulsar should be up and running
- Redis should be up and running
- `infinitic.yml` file:
  - should expose correct values to access Pulsar and Redis
  - should have `name` and `class` that match interface names and implementation full names respectively of our task and workflows
  - should have at least 1 taskEngine consumer, 1 workflowEngine consumer
- at least one worker should be running

{% callout type="warning"  %}

If nothing happens when it should not, remember that workers won't quit if an exception is thrown from our tasks or workflows. To see exceptions, we must install a logger and look at the log file.

{% /callout  %}

### Simple logger

To use `SimpleLogger` as logger in this app, just add the dependency in our Gradle build file:

{% codes %}

```java [app/build.gradle]
dependencies {
    ...
    implementation "org.slf4j:slf4j-simple:2.0.3"
    ...
}
```

```kotlin[app/build.gradle.kts]
dependencies {
    ...
    implementation("org.slf4j:slf4j-simple:2.0.3")
    ...
}
```

{% /codes %}

and this `simplelogger.properties` example file in our `resources` directory:

```shell [app/src/main/resources/simplelogger.properties]
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

### Working repository

If we fail to chase a bug, we still can copy this working repository and look for the differences:

{% code-java %}

```sh
git clone https://github.com/infiniticio/infinitic-example-java-hello-world
```

{% /code-java %}

{% code-kotlin %}

```sh
git clone https://github.com/infiniticio/infinitic-example-kotlin-hello-world
```

{% /code-kotlin %}

