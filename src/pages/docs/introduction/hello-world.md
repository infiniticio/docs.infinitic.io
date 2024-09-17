---
title: Hello World Application
description: This page offers a step-by-step guide to creating your first Infinitic workflow, ideal for Java and Kotlin developers new to distributed systems. Learn the basics of setting up a project, writing tasks and workflows, deploying workers, and running a workflow in a simple, approachable format. This tutorial provides the foundational knowledge needed to start building scalable and resilient applications with Infinitic.
---
This guide will walk you through building a "Hello World" workflow from scratch, covering these steps:

* Creating a project
* Writing tasks
* Writing a workflow
* Deploying workers
* Starting a workflow

Our `HelloWorkflow` workflow will take a `name` string as input and return `"Hello $name!"`, utilizing two tasks run on distributed workers:

* A `sayHello` task that inputs a `name` string and outputs `"Hello $name"`
* An `addEnthusiasm` task that inputs a `str` string and outputs `"$str!"`

## Prerequisites

Before we begin, ensure you have installed the following dependencies:

* [Gradle](https://gradle.org/install/)
* An Apache Pulsar cluster ([installation guide](https://pulsar.apache.org/docs/en/standalone))
* A Redis ([installation guide](https://redis.io/download)) or MySQL database for storing workflow states.

You can either run Redis and Pulsar on their own, or with [Docker](https://www.docker.com/get-started/), you can set up the environment using the provided `docker-compose.yml` file:

```yaml
services:
  # Pulsar
  pulsar-standalone:
    image: apachepulsar/pulsar:3.0.4
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

Start by creating a new project:

```bash
mkdir hello-world && cd hello-world && gradle init
```

Configure this project by selecting the following settings (you may see slightly different prompts depending on your version of gradle):

{% code-java %}

Ensure that the version of Java you select matches what you have installed.

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

In our [Gradle build file](https://docs.gradle.org/current/userguide/build_file_basics.html), we'll include:

* The Maven repository
* The required dependencies
* A directive to compile using Java 17"

{% codes %}

```java
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
    implementation "io.infinitic:infinitic-client:0.16.0"
    // infinitic worker
    implementation "io.infinitic:infinitic-worker:0.16.0"
}

java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
```

```kotlin
plugins {
    id("org.jetbrains.kotlin.jvm") version "2.0.0"

    application
}

repositories {
    mavenCentral()
}

dependencies {
    // infinitic client
    implementation("io.infinitic:infinitic-client:0.16.0")
    // infinitic worker
    implementation("io.infinitic:infinitic-worker:0.16.0")
}

tasks.withType<org.jetbrains.kotlin.gradle.services.KotlinCompile> {
    kotlinOptions.jvmTarget = JavaVersion.VERSION_17.toString()
}


application {
    // Define the main class for the application.
    mainClass.set("hello.world.AppKt")
}
```

{% /codes %}

Once you've updated your gradle build file, install the dependencies by running:

```sh
./gradlew install
```

## Writing services

Next, create a `services` directory:

```sh
mkdir -p app/src/main/java/hello/world/services
```

Within this directory, define the `HelloServiceservice in its own file:

{% codes %}

```java
package hello.world.services;

import io.infinitic.annotations.Name;

@Name(name = "HelloService")
public interface HelloService {

    String sayHello(String name);

    String addEnthusiasm(String str);
}
```

```kotlin
package hello.world.services

import io.infinitic.annotations.Name

@Name("HelloService")
interface HelloService {
    fun sayHello(name: String): String

    fun addEnthusiasm(str: String): String
}
```

{% /codes %}

Within the same services directory, next define the `HelloServiceImpl` file, which will contain our tasks:

{% codes %}

```java
package hello.world.services;

public class HelloServiceImpl implements HelloService {
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

```kotlin
package hello.world.services

class HelloServiceImpl : HelloService {
    override fun sayHello(name: String) = "Hello $name"

    override fun addEnthusiasm(str: String) = "$str!"
}
```

{% /codes %}

## Writing workflow

Set up a `workflows` directory:

```sh
mkdir -p app/src/main/java/hello/world/workflows
```

Within it, add the `HelloWorkflow` interface:

{% codes %}

```java
package hello.world.workflows;

import io.infinitic.annotations.Name;

@Name(name = "HelloWorkflow")
public interface HelloWorkflow {
    String greet(String name);
}
```

```kotlin
package hello.world.workflows

import io.infinitic.annotations.Name

@Name("HelloWorkflow")
interface HelloWorkflow {
    fun greet(name: String): String
}
```

{% /codes %}

And its `HelloWorkflowImpl` implementation:

{% callout type="warning"  %}

This implementation must extend `io.infinitic.workflows.Workflow`

{% /callout  %}

{% codes %}

```java
package hello.world.workflows;

import hello.world.services.HelloService;
import io.infinitic.workflows.Workflow;

public class HelloWorkflowImpl extends Workflow implements HelloWorkflow {
    // create a stub for the HelloService
    private final HelloService helloService = newService(HelloService.class);

    @Override
    public String greet(String name) {
        // synchronous call of HelloService::sayHello
        String str = helloService.sayHello(name);

        // synchronous call of HelloService::addEnthusiasm
        String greeting =  helloService.addEnthusiasm(str);

        // inline task to display the result
        inlineVoid(() -> System.out.println(greeting));

        return greeting;
    }
}
```

```kotlin
package hello.world.workflows

import hello.world.services.HelloService
import io.infinitic.workflows.Workflow

class HelloWorkflowImpl: Workflow(), HelloWorkflow {
    // create a stub for the HelloService
    private val helloService = newService(HelloService::class.java)

    override fun greet(name: String): String {
        // synchronous call of HelloService::sayHello
        val str = helloService.sayHello(name)

        // synchronous call of HelloService::addEnthusiasm
        val greeting =  helloService.addEnthusiasm(str)

        // inline task to display the result
        inline { println(greeting) }

        return  greeting
    }
}
```

{% /codes %}

Note: the `newService` function creates a stub from the `HelloService` interface.

Syntax-wise, this stub functions like an implementation of `HelloService`. However, instead of executing a method directly, it sends a message to carry out the execution. This is why running a workflow without deploying any workers will result in no action being taken.

## Pulsar configuration

Configure Pulsar in the  `app/infinitic.yml` file:

```yaml
pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```

## Deploying workers

Set up services and workflows, and update values for Redis and Pulsar connections as necessary:

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
  - name: HelloService
    class: hello.world.services.HelloServiceImpl

workflows:
  - name: HelloWorkflow
    class: hello.world.workflows.HelloWorkflowImpl
```

Replace the App file with:

{% codes %}

```java
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

```kotlin
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

The SLF4J output messages appear because our app doesn't have a logger set up yet. To eliminate these messages, we can add a logger of our choice, such as [Simple Logger](#simple-logger), as a dependency in our Gradle build file.

{% /callout  %}

{% callout type="warning"  %}

When making code changes, it's necessary to restart the workers to ensure they incorporate these updates.

{% /callout  %}

## Start a workflow

Use a config file with pulsar configuration to instantiate an `InfiniticClient`. Use this client to create a workflow stub and dispatch the workflow.

Here, we already have the `infinitic.yml` file that we can reuse:

{% codes %}

```java
package hello.world;

import hello.world.workflows.HelloWorkflow;
import io.infinitic.client.Deferred;
import io.infinitic.client.InfiniticClient;

public class Client {
    public static void main(String[] args) {
        String name = args.length > 0 ? args[0] : "World";

        try(InfiniticClient client = InfiniticClient.fromConfigFile("infinitic.yml")) {
            // create a stub from HelloWorkflow interface
            HelloWorkflow helloWorld = client.newWorkflow(HelloWorkflow.class);

            // asynchronous dispatch of a workflow
            Deferred<String> deferred = client.dispatch(w::greet, name);

            // let's see what happens
            System.out.println("workflow " + HelloWorkflow.class.getName() + " " + deferred.getId() + " dispatched!");
        }
    }
}
```

```kotlin
package hello.world

import hello.world.workflows.HelloWorkflow
import io.infinitic.client.Deferred
import io.infinitic.client.InfiniticClient

fun main(args: Array<String>) {
    val name = args.firstOrNull() ?: "World"

    InfiniticClient.fromConfigFile("infinitic.yml").use { client ->
        // create a stub from HelloWorkflow interface
        val helloWorld = client.newWorkflow(HelloWorkflow::class.java)

        // dispatch workflow
        val deferred : Deferred<String> = client.dispatch(w::greet, name)

        // let's see what happens
        println("workflow ${HelloWorkflow::class} ${deferred.id} dispatched!")
    }
}

```

{% /codes %}

We can run this directly from our IDE (remembering to possibly adjust the working directory in the Run configuration), or we can add a `startWorkflow` Gradle task to our build file:

{% codes %}

```java
...
tasks.register('startWorkflow', JavaExec) {
    group = "infinitic"
    mainClass = "hello.world.Client"
    classpath = sourceSets.main.runtimeClasspath
}
```

```kotlin
...
task<JavaExec>("startWorkflow") {
    group = "infinitic"
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("hello.world.ClientKt")
}
```

{% /codes %}

and run it from the command line:

```sh
./gradlew startWorkflow --args Infinitic
```

Where the app/worker is running, we should see:

```sh
Hello Infinitic!
```

Congrats! You have run your first Infinitic workflows.

## Debugging

### Check-list

In case of issues, check:

- If Pulsar and Redis are running
- Correctness of `infinitic.yml` file that
  - should expose correct values to access Pulsar and Redis
  - should have `name` and `class` that match interface names and implementation full names respectively of our task and workflows
- If at least one worker is running

{% callout type="warning"  %}

Keep in mind that workers will continue running even if an exception occurs in our tasks or workflows. To observe these exceptions, you need to set up a logger and then review the log file for any errors.

{% /callout  %}

### Simple logger

To use `SimpleLogger` as logger in this app, just add the dependency in our Gradle build file:

{% codes %}

```java
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

```shell
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
