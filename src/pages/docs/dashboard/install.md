---
title: Install
description: ""
---

Currently, Infinitic's web-based dashboard focuses on providing an easy way to monitor our infrastructure, showing statistics of Pulsar topics used specifically to manage each task/service or workflow.

Since this dashbord directly interacts with Pulsar, it is required to deploy it into the same network as the Pulsar clusters to be able to talk to it.

## Build from source code

To run this dashboard, add to a project:

- the `pulsar-dashboard` lib
- a logger
- the `application` plugin
- the `shadow` plugin to build a fat jar

{% codes %}

```java [build.gradle]
...

plugins {
    ...
    id 'application'
    id("com.github.johnrengelman.shadow").version("7.0.0")
}

repositories {
    ...
    mavenCentral()
    maven { url = "https://jitpack.io" }
}

dependencies {
    ...
    implementation "io.infinitic:infinitic-dashboard:0.11.+"
}

application {
    mainClass = 'full.name.of.Main'
}

shadowJar {
    mergeServiceFiles()
}

```

```kotlin [build.gradle.kts]
...
plugins {
    ...
    application
    id("com.github.johnrengelman.shadow").version("7.0.0")
}

repositories {
    ...
    mavenCentral()
    maven("https://jitpack.io")
}

dependencies {
    ...
    implementation "org.slf4j:slf4j-simple:2.0.3" // or another logger
    implementation("io.infinitic:infinitic-dashboard:0.11.+")
}

application {
    mainClass.set("full.name.of.MainKt")
}

tasks.withType<ShadowJar> {
    mergeServiceFiles()
}

```

{% /codes %}

Note that use of jitpack.io is mandatory, as the [KWeb](http://docs.kweb.io/en/latest/) dependency is not yet published on MavenCentral().

The dashboard server can then be started using:

{% codes %}

```java
import io.infinitic.dashboard.InfiniticDashboard;

public class App {
    public static void main(String[] args) {
        String file = args.length>0 ? args[0] : "infinitic.yml";

        InfiniticDashboard.fromConfigFile(file).start();
    }
}
```

```kotlin
import io.infinitic.dashboard.InfiniticDashboard

fun main(String[] args) {
    val file = args.getOrNull(0) ?: "infinitic.yml"

    InfiniticDashboard.fromConfigFile(file).start()
}
```

{% /codes %}

where `infinitic.yml` is a configuration file mapped to a `io.infinitic.config.DashboardConfig` instance, for example:

```yaml [infinitic.yml]
port: 16097 # default port for KWeb server

debug: true # default value for KWeb server

pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```
