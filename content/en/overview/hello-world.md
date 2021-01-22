---
title: Hello World App
description: ""
position: 1.5
category: "Overview"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

We'll show here how to build an "Hello World" app from scratch, with the following steps:

- create a project
- write tasks
- write a workflow
- deploy workers
- run a workflow

The workflow `HelloWorld` will take a `name` string as input and return `"Hello $name!"` using sequentially 2 tasks run on distributed workers:

- a `sayHello` task that takes a  `name` string as input and returns `"Hello $name"`
- an `addEnthusiasm` task that takes a  `str` string as input and returns `"$str!"`

## Prerequisites

Make sure we have a running Pulsar cluster and a Redis database available (see [prequisites](/overview/prerequisites)). We need to have [Gradle](https://gradle.org/install/) installed also.

## Create Project

Create a new project within a new directory:

```sh
mkdir hello-world-app && cd hello-world-app && gradle init
```

Configure this project:

<code-group>
  <code-block label="Kotlin" active>

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
Enter selection (default: Java) [1..5] 4

Select build script DSL:
  1: Groovy
  2: Kotlin
Enter selection (default: Kotlin) [1..2] 2

Project name (default: hello-world):
Source package (default: hello.world):
```

  </code-block>
</code-group>

in our build gradle file, we add:

- Maven repository
- needed dependencies
- instruction to compile to Java 1.8

<code-group>
  <code-block label="Kotlin" active>

```kts[build.gradle.kts]
repositories {
    mavenCentral()
    jcenter()
}

dependencies {
    // needed by infinitic client (suspend functions)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.4.+")
    // infinitic libraries
    implementation("io.infinitic:infinitic-pulsar:0.1.+")
    implementation("io.infinitic:infinitic-client:0.1.+")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions.jvmTarget = JavaVersion.VERSION_1_8.toString()
}
```

  </code-block>
</code-group>

And install dependencies:

```sh
./gradlew install
```

## Writing Tasks

Let's create a `tasks` directory:

<code-group>
  <code-block label="Kotlin" active>

```bash
mkdir src/main/kotlin/hello/world/tasks
```

  </code-block>
</code-group>

in which, we add `HelloWorldService` interface:

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/tasks/HelloWorldService.kt]
package hello.world.tasks

interface HelloWorldService {
    fun sayHello(name: String?): String

    fun addEnthusiasm(str: String): String
}
```

  </code-block>
</code-group>

and `HelloWorldServiceImpl` implementation:

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/tasks/HelloWorldServiceImpl.kt]
package hello.world.tasks

class HelloWorldServiceImpl : HelloWorldService {
    override fun sayHello(name: String?) = "Hello ${name ?: "World"}"

    override fun addEnthusiasm(str: String) = "$str!"
}
```

  </code-block>
</code-group>

## Writing Workflow

Let's create a `workflows` directory:

<code-group>
  <code-block label="Kotlin" active>

```bash
mkdir src/main/kotlin/hello/world/workflows
```

  </code-block>
</code-group>

in which, we add `HelloWorld` interface (all workflow interfaces must extend `io.infinitic.workflows.Workflow`):

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/workflows/HelloWorld.kt]
package hello.world.workflows

import io.infinitic.workflows.Workflow

interface HelloWorld : Workflow {
    fun greet(name: String?) : String
}
```

  </code-block>
</code-group>

and `HelloWorldImpl` implementation (all workflow implementation must extend io.infinitic.workflows.AbstractWorkflow):

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/workflows/HelloWorldImpl.kt]
package hello.world.workflows

import hello.world.tasks.HelloWorldService
import io.infinitic.workflows.AbstractWorkflow
import io.infinitic.workflows.task

class HelloWorldImpl : AbstractWorkflow(), HelloWorld {
    private val helloWorldService = task<HelloWorldService>()

    override fun greet(name: String?): String {
        val str = helloWorldService.sayHello(name)
        val greeting =  helloWorldService.addEnthusiasm(str)
        println(greeting)

        return  greeting
    }
}
```

  </code-block>
</code-group>

Note the `task` function that creates a proxy from `HelloWorldService` interface. From a syntax point of view, this proxy can be used as `HelloWorldService` implementation. But instead of executing its methods, it sends the message to the workflow engine that a task execution is requested. That execution will be processed on task-executor workers. That's why nothing happens if we run a workflow without having deployed any worker.

## Pulsar Configuration

If we have not yet set up Pulsar for Infinitic, then it's time to do it.

This can be done through this Setup file:

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/Setup.kt]
package hello.world

import io.infinitic.pulsar.InfiniticAdmin
import org.apache.pulsar.client.admin.PulsarAdmin

fun main() {
    val pulsarAdmin = PulsarAdmin
        .builder()
        .serviceHttpUrl("http://localhost:8080")
        .build()

    val infiniticAdmin = InfiniticAdmin(pulsarAdmin, "infinitic", "dev")

    infiniticAdmin.init()
    infiniticAdmin.close()
}
```

  </code-block>
</code-group>

We can run it directly from our IDE, or add the `setupPulsar` Gradle task to our build file:

<code-group>
  <code-block label="Kotlin" active>

```kts[src/main/kotlin/hello/world/build.gradle.kts]
task("setupPulsar", JavaExec::class) {
    group = "infinitic"
    main = "hello.world.SetupKt"
    classpath = sourceSets["main"].runtimeClasspath
}
```

  </code-block>
</code-group>

and run it from the command line:

```bash
./gradlew setupPulsar
```

This command will:

- create an `infinitic` Pulsar tenant
- create a `dev` namespace with relevant options such as [deduplication enabled](https://pulsar.apache.org/docs/en/cookbooks-deduplication/), [partitioned topics](https://pulsar.apache.org/docs/en/concepts-messaging/#partitioned-topics), [schema enforced](https://pulsar.apache.org/docs/en/schema-get-started/) and [retention policies](https://pulsar.apache.org/docs/en/cookbooks-retention-expiry/).

<alert type="warning">

This procedure must be done each time we need to run Infinitic on a new Pulsar tenant or namespace.

</alert>

## Deploying Workers

The easiest way to build workers is from an `infinitic.yml` config file:

```yaml[infinitic.yml]
mode: worker
stateStorage: redis

redis:
  host: localhost
  port: 6379
  user:
  password:
  database: 0

pulsar:
  serviceUrl: pulsar://localhost:6650
  tenant: infinitic
  namespace: dev

taskEngine:
  consumers: 1

workflowEngine:
  consumers: 1

monitoring:
  consumers: 1

tasks:
  - name: hello.world.tasks.HelloWorldService
    class: hello.world.tasks.HelloWorldServiceImpl

workflows:
  - name: hello.world.workflows.HelloWorld
    class: hello.world.workflows.HelloWorldImpl
```

<alert type="warning">

The configuration file `infinitic.yml` should contain correct values for Redis and Pulsar connections. Please update them if necessary.

</alert>

Then, to create a worker, just replace the App file:

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/App.kt]
package hello.world

import io.infinitic.pulsar.InfiniticWorker

fun main(args: Array<String>) {
    InfiniticWorker.fromFile("infinitic.yml").start()
}
```

  </code-block>
</code-group>

Our app is ready to run as a worker:

```bash
./gradlew run
```

We have a working worker listening Pulsar and waiting for instructions:

```bash
> Task :run
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
```


<alert type="info">

The SLF4J outputs are there because we do not have any logger yet in the app. To remove those messages, add our logger of choice (for example <nuxt-link to="#simple-logger">Simple Logger</nuxt-link>) as a dependency in our Gradle build file. 

</alert>

<alert type="warning">

When coding, keep in mind that workers need to be restarted to account for any change.

</alert>


## Start A Workflow

The easiest way to instantiate an InfiniticClient is to use a config file exposing a `pulsar` configuration.
Here, we already have the `infinitic.yml` file that we can reuse in a new `Client` file:

<code-group>
  <code-block label="Kotlin" active>

```kotlin[src/main/kotlin/hello/world/Client.kt]
package hello.world

import hello.world.workflows.HelloWorld
import io.infinitic.pulsar.InfiniticClient
import kotlinx.coroutines.runBlocking

fun main(args: Array<String>) = runBlocking {
    val client = InfiniticClient.fromFile("infinitic.yml")

    client.startWorkflow<HelloWorld> { greet(args.firstOrNull()) }

    client.close()
}
```

  </code-block>
</code-group>

We can run it directly from our IDE, or add the `startWorkflow` Gradle task to our build file:

<code-group>
  <code-block label="Kotlin" active>

```kts[src/main/kotlin/hello/world/build.gradle.kts]
task("startWorkflow", JavaExec::class) {
    group = "infinitic"
    main = "hello.world.ClientKt"
    classpath = sourceSets["main"].runtimeClasspath
}
```

  </code-block>
</code-group>

and run it from the command line:

```bash
./gradlew startWorkflow --args Infinitic
```

Congrats! We have run our first Infinitic workflow. Where our app/worker is running, we should see:

```bash
> Task :run
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
Hello Infinitic!
```

## Debugging

Here is a check-list when encountering issues:
- Pulsar should be up and running
- Redis should be up and running
- `infinitic.yml` file:
  - should expose correct values to access Pulsar and Redis
  - should have `name` and `class` that match interface names and implementation full names respectively of our task and workflows
  - should have at least 1 taskEngine consumer, 1 workflowEngine consumer
-  at least one worker should be running

<alert type="warning">

If nothing happens when it should not, remember that workers won't quit if an exception is thrown from our tasks or workflows. To see exceptions, we must install a logger and look at the log file.

</alert>


### Simple Logger
To use `SimpleLogger` as logger in this app, just add the dependency in our Gradle build file:

<code-group>
  <code-block label="Kotlin" active>

```kts[build.gradle.kts]
dependencies {
    ...
    implementation("org.slf4j:slf4j-simple:1.7.+")
    ...
}
```
  </code-block>
</code-group>

and this `simplelogger.properties` example file in our `resources` directory:

```properties[src/main/resources/simplelogger.properties]
# SLF4J's SimpleLogger configuration file
# Simple implementation of Logger that sends all enabled log messages, for all defined loggers, to System.err.

# Log file
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
