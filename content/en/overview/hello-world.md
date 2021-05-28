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

- a `sayHello` task that takes a `name` string as input and returns `"Hello $name"`
- an `addEnthusiasm` task that takes a `str` string as input and returns `"$str!"`

## Prerequisites

Make sure we have a running Pulsar cluster and a Redis database available (see [prequisites](/overview/prerequisites)). We need to have [Gradle](https://gradle.org/install/) installed also.

## Create Project

Create a new project within a new directory:

```sh
mkdir hello-world && cd hello-world && gradle init
```

Configure this project:

<code-group>
 
  <code-block label="Java" active>

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

  </code-block>
  <code-block label="Kotlin">

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

  </code-block>
</code-group>

in our build gradle file, we add:

- Maven repository
- needed dependencies
- instruction to compile to Java 1.8

<code-group>
  <code-block label="Java" active>

```java[app/build.gradle]
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
    // to be removed from Pulsar 1.8 https://github.com/apache/pulsar/issues/9045
    implementation("org.apache.avro:avro") { version { strictly "1.9.+" } }

    // infinitic libraries
    implementation "io.infinitic:infinitic-pulsar:0.6.+"
}

java {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}
```

  </code-block>
  <code-block label="Kotlin">

```kts[app/build.gradle.kts]
plugins {
    id("org.jetbrains.kotlin.jvm") version "1.5.10"

    application
}

repositories {
    mavenCentral()
}

dependencies {
    // to be removed from Pulsar 1.8 https://github.com/apache/pulsar/issues/9045
    implementation("org.apache.avro:avro") { version { strictly("1.9.+") } }

    // infinitic libraries
    implementation("io.infinitic:infinitic-pulsar:0.6.+")
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions.jvmTarget = JavaVersion.VERSION_1_8.toString()
}


application {
    // Define the main class for the application.
    mainClass.set("hello.world.AppKt")
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
  <code-block label="Java" active>

```sh
mkdir app/src/main/java/hello/world/tasks
```

  </code-block>
  <code-block label="Kotlin">

```sh
mkdir app/src/main/kotlin/hello/world/tasks
```

  </code-block>
</code-group>

in which, we add `HelloWorldService` interface:

<code-group>
  <code-block label="Java" active>

```java[app/src/main/java/hello/world/tasks/HelloWorldService.java]
package hello.world.tasks;

public interface HelloWorldService {
    String sayHello(String name);

    String addEnthusiasm(String str);
}
```

  </code-block>
  <code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/tasks/HelloWorldService.kt]
package hello.world.tasks

interface HelloWorldService {
    fun sayHello(name: String): String

    fun addEnthusiasm(str: String): String
}
```

  </code-block>
</code-group>

and `HelloWorldServiceImpl` implementation:

<code-group><code-block label="Java" active>

```java[app/src/main/java/hello/world/tasks/HelloWorldServiceImpl.java]
package hello.world.tasks;

import io.infinitic.tasks.Task;

public class HelloWorldServiceImpl extends Task implements HelloWorldService {
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

</code-block><code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/tasks/HelloWorldServiceImpl.kt]
package hello.world.tasks

import io.infinitic.tasks.Task

class HelloWorldServiceImpl : Task(), HelloWorldService {
    override fun sayHello(name: String) = "Hello $name"

    override fun addEnthusiasm(str: String) = "$str!"
}
```

</code-block></code-group>

<alert type="warning">

Task implementation must extend `io.infinitic.task.Task`

</alert>

## Writing Workflow

Let's create a `workflows` directory:

<code-group>
  <code-block label="Java" active>

```sh
mkdir app/src/main/java/hello/world/workflows
```

  </code-block>
  <code-block label="Kotlin">

```sh
mkdir app/src/main/kotlin/hello/world/workflows
```

  </code-block>
</code-group>

in which, we add `HelloWorld` interface:

<code-group>
  <code-block label="Java" active>

```java[app/src/main/java/hello/world/workflows/HelloWorld.java]
package hello.world.workflows;

import javax.annotation.Nullable;

public interface HelloWorld {
    String greet(@Nullable String name);
}
```

  </code-block>
  <code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/workflows/HelloWorld.kt]
package hello.world.workflows

interface HelloWorld {
    fun greet(name: String): String
}
```

  </code-block>
</code-group>

and `HelloWorldImpl` implementation:

<alert type="warning">

Workflow implementation must extend `io.infinitic.workflows.Workflow`

</alert>

<code-group>
  <code-block label="Java" active>

```java[app/src/main/java/hello/world/workflows/HelloWorldImpl.java]
package hello.world.workflows;

import hello.world.tasks.HelloWorldService;
import io.infinitic.workflows.Workflow;

public class HelloWorldImpl extends Workflow implements HelloWorld {
    private final HelloWorldService helloWorldService = newTask(HelloWorldService.class);

    @Override
    public String greet(String name) {
        String str = helloWorldService.sayHello(name);
        String greeting =  helloWorldService.addEnthusiasm(str);
        inline(() -> { System.out.println(greeting); return null; });

        return greeting;
    }
}
```

  </code-block>
  <code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/workflows/HelloWorldImpl.kt]
package hello.world.workflows

import hello.world.tasks.HelloWorldService
import io.infinitic.workflows.Workflow

class HelloWorldImpl: Workflow(), HelloWorld {
    private val helloWorldService = newTask<HelloWorldService>()

    override fun greet(name: String): String {
        val str = helloWorldService.sayHello(name)
        val greeting =  helloWorldService.addEnthusiasm(str)
        inline { println(greeting) }

        return  greeting
    }
}
```

  </code-block>
</code-group>

Note the `task` function creating a stub from the `HelloWorldService` interface. From a syntax point of view, this stub can be used as an implementation of `HelloWorldService` . But instead of executing a method, it sends a message to Infinitic requesting this execution. That's why nothing happens if we run a workflow without having deployed any worker.

## Pulsar Configuration

If we have not yet set up Pulsar for Infinitic, then it's time to do it.

This can be done through this Setup file:

<code-group>
  <code-block label="Java" active>

```java[app/src/main/java/hello/world/Setup.java]
package hello.world;

import io.infinitic.pulsar.PulsarInfiniticAdmin;

public class Setup {
    public static void main(String[] args) {
        PulsarInfiniticAdmin infiniticAdmin = PulsarInfiniticAdmin.fromConfigFile("infinitic.yml");

        infiniticAdmin.setupPulsar();
        infiniticAdmin.close();
    }
}
```

  </code-block>
  <code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/Setup.kt]
package hello.world

import io.infinitic.pulsar.PulsarInfiniticAdmin

fun main() {
    val admin = PulsarInfiniticAdmin.fromConfigFile("infinitic.yml")

    admin.setupPulsar()
    admin.close()
}
```

  </code-block>
</code-group>

The `app/infinitic.yml` file sould contain the Pulsar configuration:

```yaml[app/infinitic.yml]
pulsar:
  serviceUrl: pulsar://localhost:6650
  serviceHttpUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```

We can add the `setupPulsar` Gradle task to our build file:

<code-group>
   <code-block label="Java" active>

```java[app/build.gradle]
...

task setupPulsar(type: JavaExec) {
    group = "infinitic"
    main = "hello.world.Setup"
    classpath = sourceSets.main.runtimeClasspath
}
```

  </code-block>
  <code-block label="Kotlin">

```kts[app/build.gradle.kts]
...

task("setupPulsar", JavaExec::class) {
    group = "infinitic"
    main = "hello.world.SetupKt"
    classpath = sourceSets["main"].runtimeClasspath
}
```

  </code-block>
</code-group>

and run it from the command line:

```sh
./gradlew setupPulsar
```

This command will:

- create an `infinitic` Pulsar tenant
- create a `dev` namespace with relevant options such as [deduplication enabled](https://pulsar.apache.org/docs/en/cookbooks-deduplication/), [partitioned topics](https://pulsar.apache.org/docs/en/concepts-messaging/#partitioned-topics), [schema enforced](https://pulsar.apache.org/docs/en/schema-get-started/) and [retention policies](https://pulsar.apache.org/docs/en/cookbooks-retention-expiry/).

<alert type="warning">

This procedure must be done each time we need to run Infinitic on a new Pulsar tenant or namespace.

</alert>

## Deploying Workers

The easiest way to build workers is from an `app/infinitic.yml` config file:

```yaml[app/infinitic.yml]
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

tasks:
  - name: hello.world.tasks.HelloWorldService
    class: hello.world.tasks.HelloWorldServiceImpl

workflows:
  - name: hello.world.workflows.HelloWorld
    class: hello.world.workflows.HelloWorldImpl
```

<alert type="warning">

Please update values for Redis and Pulsar connections if necessary.

</alert>

Then, to create a worker, just replace the App file with:

<code-group><code-block label="Java" active>

```java[app/src/main/java/hello/world/App.java]
package hello.world;

import io.infinitic.pulsar.PulsarInfiniticWorker;

public class App {
    public static void main(String[] args) {
        PulsarInfiniticWorker.fromConfigFile("infinitic.yml").start();
    }
}
```

</code-block><code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/App.kt]
package hello.world

import io.infinitic.pulsar.PulsarInfiniticWorker

fun main(args: Array<String>) {
    PulsarInfiniticWorker.fromConfigFile("infinitic.yml").start()
}
```

</code-block></code-group>

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
Workflow hello.world.workflows.HelloWorld:
- workflow executor      : (instances: 1) hello.world.workflows.HelloWorldImpl
- tag engine             : (storage: redis, cache: caffeine, instances: 1)
- workflow task engine   : (storage: redis, cache: caffeine, instances: 1)
- workflow engine        : (storage: redis, cache: caffeine, instances: 1)

Task hello.world.tasks.HelloWorldService:
- task executor          : (instances: 1) hello.world.tasks.HelloWorldServiceImpl
- tag engine             : (storage: redis, cache: caffeine, instances: 1)
- task engine            : (storage: redis, cache: caffeine, instances: 1)
- metrics engine         : (storage: redis, cache: caffeine)

Worker "standalone-10-17" ready
```

<alert type="info">

The SLF4J outputs are there because we do not have any logger yet in the app. To remove those messages, add our logger of choice (for example <nuxt-link to="#simple-logger">Simple Logger</nuxt-link>) as a dependency in our Gradle build file.

</alert>

<alert type="warning">

When coding, workers need to be restarted to account for any change.

</alert>

## Start A Workflow

The easiest way to instantiate an PulsarInfiniticClient is to use a config file exposing a `pulsar` configuration.
Here, we already have the `infinitic.yml` file that we can reuse in a new `Client` file:

<code-group><code-block label="Java" active>

```java[app/src/main/java/hello/world/Client.java]
package hello.world;

import hello.world.workflows.HelloWorld;
import io.infinitic.client.InfiniticClient;
import io.infinitic.pulsar.PulsarInfiniticClient;

public class Client {
    public static void main(String[] args) {
        InfiniticClient client = PulsarInfiniticClient.fromConfigFile("infinitic.yml");
        String name = args.length>0 ? args[0] : "World";

        // create a stub from HelloWorld interface
        HelloWorld helloWorld = client.newWorkflow(HelloWorld.class);

        // asynchronous dispatch of a workflow
        client.async(helloWorld, w -> w.greet(name));

        System.out.println("workflow " + HelloWorld.class.getName() + " dispatched!");
    }
}
```

</code-block><code-block label="Kotlin">

```kotlin[app/src/main/kotlin/hello/world/Client.kt]
package hello.world

import hello.world.workflows.HelloWorld
import io.infinitic.client.newWorkflow
import io.infinitic.pulsar.PulsarInfiniticClient

fun main(args: Array<String>) {
    val client = PulsarInfiniticClient.fromConfigFile("infinitic.yml")
    val name = args.firstOrNull() ?: "World"

    // create a stub from HelloWorld interface
    val helloWorld = client.newWorkflow<HelloWorld>()
    // dispatch a workflow
    client.async(helloWorld) { greet(name) }

    println("workflow ${HelloWorld::class} dispatched!")
}
```

</code-block></code-group>

We can run it directly from our IDE (you may need to change the working directory on the Run configuration), or add the `startWorkflow` Gradle task to our build file:

<code-group>
  <code-block label="Java" active>

```java[app/build.gradle]
...

task startWorkflow(type: JavaExec) {
    group = "infinitic"
    main = "hello.world.Client"
    classpath = sourceSets.main.runtimeClasspath
}
```

  </code-block>
  <code-block label="Kotlin">

```kts[app/build.gradle.kts]
...

task("startWorkflow", JavaExec::class) {
    group = "infinitic"
    main = "hello.world.ClientKt"
    classpath = sourceSets["main"].runtimeClasspath
}
```

  </code-block>
</code-group>

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

### Check List

Here is a check-list when encountering issues:

- Pulsar should be up and running
- Redis should be up and running
- `infinitic.yml` file:
  - should expose correct values to access Pulsar and Redis
  - should have `name` and `class` that match interface names and implementation full names respectively of our task and workflows
  - should have at least 1 taskEngine consumer, 1 workflowEngine consumer
- at least one worker should be running

<alert type="warning">

If nothing happens when it should not, remember that workers won't quit if an exception is thrown from our tasks or workflows. To see exceptions, we must install a logger and look at the log file.

</alert>

### Simple Logger

To use `SimpleLogger` as logger in this app, just add the dependency in our Gradle build file:

<code-group>
  <code-block label="Java" active>

```java[app/build.gradle]
dependencies {
    ...
    implementation "org.slf4j:slf4j-simple:1.7.+"
    ...
}
```

  </code-block>
  <code-block label="Kotlin">

```kts[app/build.gradle.kts]
dependencies {
    ...
    implementation("org.slf4j:slf4j-simple:1.7.+")
    ...
}
```

  </code-block>
</code-group>

and this `simplelogger.properties` example file in our `resources` directory:

```properties[app/src/main/resources/simplelogger.properties]
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

### Working Repository

If we fail to chase a bug, we still can copy this working repository and look for the differences:

<code-group>
  <code-block label="Java" active>

```sh
git clone https://github.com/infiniticio/infinitic-example-java-hello-world
```

  </code-block>
  <code-block label="Kotlin">

```sh
git clone https://github.com/infiniticio/infinitic-example-kotlin-hello-world
```

  </code-block>
</code-group>
