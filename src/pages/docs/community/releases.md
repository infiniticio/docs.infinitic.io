---
title: Releases
description: This section lists the release notes for Infinitic, detailing new features, improvements, and bug fixes for each version, keeping developers updated on the latest enhancements and changes.
---

## v0.16.2

{% version-new-features /%}
* All components now support message batching:
  * [Service Executors](/docs/services/deployment#batching)
  * [Service Tag Engine](/docs/services/deployment#batching-beta)
  * [Workflow Executors](/docs/workflows/deployment#batching-beta)
  * [Workflow State Engines](/docs/workflows/deployment#batching-beta-2)
  * [Workflow Tag Engine](/docs/workflows/deployment#batching-beta-3)

  Batching groups multiple messages together into a single batch at three stages:
  * When receiving messages from the broker
  * When processing messages
  * When sending messages to the broker

  This technique significantly improves efficiency and reduces latency for high-throughput applications by minimizing the number of network calls required.

{% version-breaking-changes /%}
* The `@Batch` annotation parameters have been removed. Batch configuration is now handled at the deployment level.

{% version-improvements /%}
* Improved concurrency handling for components that use keys (Service Tag Engine, Workflow State Engine, Workflow Tag Engine). Previously, setting `concurrency > 1` would create multiple consumers equal to the concurrency value. Now, only one consumer is created (matching other components' behavior), with messages sharded internally to prevent parallel processing of messages with the same key.

## v0.16.1

{% version-bug-fixes /%}

* Resolved an issue that occurred when calling `or(deferred1, deferred2).await()` within a loop, specifically when `deferred1` is a deferred signal.

## v0.16.0

{% version-new-features /%}

* [Batch processing](/docs/services/batched) of Tasks: 
  Enables efficient handling of operations that benefit from bulk processing, such as sending emails, updating databases, or calling external APIs. Tasks with the same `batchKey` in their metadata are processed together in a single batch.

* In-Memory implementation for testing: 
  The internal message exchange is now fully abstracted, paving the way for potential future support of alternative message brokers. This version introduces an in-memory implementation, ideal for testing purposes, allowing tests to run without the need for a Pulsar cluster.

* Enhanced [Event Listener](/docs/events/creation): 
  Infinitic introduces a more powerful way to monitor internal events. This feature can be used to trigger external actions or send events to analytics databases for dashboard creation. The event listener now automatically detects existing Services and Workflows, listening to their events. All events are now processed in batches for improved efficiency.

* Improved Development Logging:
  To address the challenges of debugging distributed systems, Infinitic now offers a streamlined method for viewing CloudEvents during development. Simply set the log level to DEBUG for these classes:
  - io.infinitic.cloudEvents.WorkflowStateEngine.$workflowName
  - io.infinitic.cloudEvents.WorkflowExecutor.$workflowName
  - io.infinitic.cloudEvents.ServiceExecutor.$serviceName
  This enhancement provides greater visibility into the system's internal workings, making it easier to identify and resolve issues.

{% version-breaking-changes /%}

* Worker configuration: A new page in the documentation is available to explain how to [set workers](/docs/components/workers). Please refer to it for more details on the following changes:
  * **State Engines and Tag Engines settings must now be explicitly defined**. Implicit settings are no longer supported.
  * Config builder setters have been standardized to use `set` + variable name (e.g., `setMaxPoolSize` instead of `maxPoolSize`).
  * Time-related settings now use consistent suffixes: "Seconds" replaces "InSeconds", "Minutes" replaces "InMinutes", etc.
  * Static methods for Clients and Workers configuration now use "Yaml" prefix: `fromYamlResource`, `fromYamlString`, `fromYamlFile`.
  * Storage:
    * Explicit storage configuration is now required. Default values for local development have been removed to prevent confusion in production environments.
    * 'user' parameter renamed to 'username' in MySQLConfig, PostgresConfig, and RedisConfig.
  * Pulsar:
    * Pulsar configuration moved under the `transport` keyword.
    * Pulsar client config now under `client` keyword, with expanded settings.
    * Policies field names refactored for consistency.
    * `delayedTTLInSeconds` renamed to `timerTTLSeconds` in Pulsar Policies configuration.
  * Dashboard:
    * All settings must now be under the `dashboard` keyword.
  * `ExponentialBackoffRetryPolicy` class renamed to `WithExponentialBackoffRetry`.
* CloudEvents updates:
  * Cloud-event listener are not anymore created under services and workflows
  * Format changes for improved clarity and consistency.
  * Sources now clearly differentiate between executor and stateEngine.
  * Workflow version defaults to 0 when undefined (previously null).
  * "start" command renamed to "dispatch".
  * "ended" event renamed to "completed".


{% version-bug-fixes /%}
- In workflows, if a property is present in the workflow history but disappeared from the workflow class, a warning is now emitted. Previously an error was thrown.
- when using dispatchAsync, multiple successive calls would use only the last arguments used
- Fix use of Schema for Postgres

{% version-improvements /%}
* More reliable client deletion when topic is closing
* Improved implementation of consumers to ensure all messages are processed, even in case of errors or Shutdown

* Lib updates:
  - Kotlin: 2.0.0 -> 2.0.10
  - CloudEvents: 3.0.0 -> 4.0.1
  - Jackson: 2.17.1 -> 2.17.2
  - Uuid: 5.0.0 -> 5.1.0
  - Kotest: 5.9.0 -> 5.9.1
  - kotlinx-serialization-json: 1.6.3 -> 1.7.1
  - TestContainers: 1.19.8 -> 1.20.1
  - Mockk: 1.13.11 -> 1.13.12
  - Pulsar: 3.0.4 -> 3.0.7
  - Slf4j: 2.0.13 -> 2.0.16
  - Logging: 6.0.9 -> 7.0.0
  - Compress: 1.26.1 -> 1.27.1

## v0.15.0

{% callout type="warning"  %}

Please ensure to terminate all running workers prior to upgrading to version 0.15.0. This is crucial because prior versions earlier than 0.15.0, are unable to deserialize messages produced by the new version 0.15.0.

{% /callout  %}


{% version-new-features /%}

* Add support for [JsonView](/docs/references/serialization#json-view-support)
* Workers can now be created from a YAML String, through the `fromConfigYaml` static method
* All configuration objects (`PulsarConfig`, `MySQLConfig`, `RedisConfig`, `PostgresConfig`, `CaffeineConfig`...) can now be manually created through builders. 
* `serviceDefault`, `workflowDefault`, `defaultStorage` can now be manually registered in Workers

{% version-breaking-changes /%}

* [Serialization](/docs/references/serialization):
  * Both serialization of arguments and deserialization are now conducted in accordance with the types defined in the interfaces. This contrasts with our prior implementation, which performed these operations based on the actual type of objects involved.
  * The revamped approach broadens applicability, aptly resolving the concerns cited in issue #80. Nonetheless, when faced with situations involving polymorphism, the responsibility now lies with the user to furnish deserializers with adequate information. 

* Worker: configuration file:
  * The configuration parameters, `brokerServiceUrl` and `webServiceUrl`, must now be explicitly specified in PulsarConfig. Previously, the system would default to the settings of a local Pulsar cluster when these values were not provided. Despite its convenience in local development, this implicit default behavior could potentially lead to complications while deploying the project in a production environment.
  * In the configurations for `workflows` and `workflowDefault`, we have revised the property name `workflowEngine` to `stateEngine`. We believe this new terminology more accurately reflects the function of this property.
  * The configuration for `cache` now needs to be nested within the `storage` configuration. This update aligns logically with the intended usage, as the cache is exclusively utilized for storage-related functions.
  * The execution policy for tasks has been revised: by default, **failed tasks will no longer be subject to automatic retries**. To implement retry functionality, users are required to explicitly configure a retry policy. We believe this change will help alleviate potential confusion for new users, who may be perplexed by tasks appearing to fail after 10 minutes due to the previously implicit retry mechanism.
  * Renaming all config files by putting a `Config` suffix on them.

* Worker: manual registration of Service and Workflow:
  * `registerService` method is now `registerServiceExecutor` for consistency
  * `registerWorkflowExecutor` now uses a factory as parameter instead of a class name

* Workflows behavior: the use of `Deferred` objects in workflow properties or arguments is now prohibited. Should a Deferred object appear in these contexts, an explicit exception will be thrown. This measure was put into place due to some issues identified in certain edge cases of the previous implementation. More importantly, allowing the transmission of Deferred objects to other workflows seems wrong. 

{% version-bug-fixes /%}

* Fix [#254](https://github.com/infiniticio/infinitic/issues/254) An exception raised directly in the workflow does not appear in logs
* Fix [#242](https://github.com/infiniticio/infinitic/issues/242) serviceDefault is not used for manually registered services
* Fix [#248](https://github.com/infiniticio/infinitic/issues/248) @Ignore annotation can not be used in Java
* Fix [#80](https://github.com/infiniticio/infinitic/issues/80) Can not return a list, map, set from tasks and workflows

{% version-improvements /%}

* Add compression info to logging at worker start
* Add log message for existing workflow with same customId tag
* Improve performance by adding a cache to  Method and Class introspection that occurs at each task and workflow processing
* Add more test to ensure that backward compatibility

## v0.14.1

{% version-new-features /%}

* Users can now update the object mapper for fine-grained control of serialization.
* Fix [#233](https://github.com/infiniticio/infinitic/issues/233) - Introduced `keySetTable` and `keyValueTable` settings for storage configuration, allowing custom names for storage tables.

{% version-breaking-changes /%}

* Renamed `Task.set` to `Task.setContext`.
* `workflowId`, `workflowName`, `methodId`, `methodName`, `tags`, and `meta` are now static properties of the `Workflow` class.

{% version-improvements /%}

* Enhanced the `and` operator for `Deferred`.

{% version-bug-fixes /%}
* Fix [#239](https://github.com/infiniticio/infinitic/issues/239)

## v0.14.0

{% version-new-features /%}

* **Added PostgreSQL support for storage.**
* Expanded storage options for MySQL with the following `HikariConfig` properties: `minimumIdle`, `idleTimeout`, `connectionTimeout`, and `maxLifetime`.

{% version-breaking-changes /%}

* In storage configuration, the `maxPoolSize` option has been replaced by `maximumPoolSize` to ensure consistency with `HikariConfig` properties.

{% version-improvements /%}

* To improve the detection of configuration issues, a warning is now emitted the first time a message is produced on a topic without a consumer.
* Resources are now properly closed when worker initialization fails.

* Updated the versions of the following dependencies:
  - Avro (1.10.0 to 1.10.1)

## v0.13.3

{% version-improvements /%}

* Can use immutable metadata when dispatching tasks
* Use Kotlin 2.0.0

* bump libraries version
    - `kotlinx-coroutines` from 1.8.0 to 1.8.1
    - `fasterxml.jackson` from 2.17.0 to 2.17.1
    - `kotest` from 5.8.1 to 5.9.0
    - `testcontainers` from 1.19.7 to 1.19.8bump
    - `mockk` from 1.13.10 to 1.13.11
    - `avro4k` from 1.10.0 to 1.10.1
    - `slf4j` from 2.0.12 to 2.0.13
    - `kotlin-logging-jvm` from 6.03 to 6.0.9

* target Java version 17 

## v0.13.2

{% version-bug-fixes /%}

* Fix [#227](https://github.com/infiniticio/infinitic/issues/227): all workflow tasks messages are going to the same partition

## v0.13.1

{% version-breaking-changes /%}

* The new default setting for cache is no cache 
* Workflow and Service names are now escaped in topic's name - it's a breaking change only in the unlikely situation where you have special characters in those names 

{% version-improvements /%}

* **Pulsar version is now 3.0.4 (from 2.11.2)**
* Workflow Tasks are processed on a key-shared subscription. This allows new workflow versions to be deployed continuously.
* Improve test coverage for tags
* Improve test coverage for infinitic-transport-pulsar module
* Client's topics are now deleted when clients are interrupted. 
* Client's topics are not recreated by producers if already deleted
* Bump version of dependencies:
  - CloudEvents (2.5.0 to 3.0.0)
  - Jackson (2.15.3 to 2.17.0)
  - java-uuid-generator (4.3.0 to 5.0.0)
  - Kotest (5.8.0 to 5.8.1)
  - TestContainers (1.19.5 to 1.19.7)
  -  Mockk (1.13.8 to 1.13.10).
  - commons-compress (1.25.0 to 1.26.1)


{% version-bug-fixes /%}

* **Fix backward compatibility with 0.12.3** (in 0.13.0, some messages were wrongly discarded, leading to stuck workflows)
* Fix a bug introduced in 0.13.0 that led to the possible creation of multiple workflow instance with the same customId tag
* "none" cache setting now correctly means no cache, previously if was the default cache

## v0.13.0

{% version-breaking-changes /%}

* The `context` property of the `Task` singleton, which was accessible during task execution, has been removed due to its redundancy with other properties.
* In workers,

  * the method `registerService` has been replaced by 2 methods `registerServiceExecutor`and `registerServiceTagEngine`.
  * the method `registerWorkflow` has been replaced by 3 methods `registerWorkflowExecutor`, `registerWorkflowTagEngine`, and `registerWorkflowStateEngine`.
* The following libraries are no longer exposed by Infinitic. If you were using them, you must now add them to the dependencies of your project:

  * `org.jetbrains.kotlinx:kotlinx-serialization-json`
  * `com.jayway.jsonpath:json-path`
  * `com.sksamuel.hoplite:hoplite-core`

{% version-new-features /%}

* **CloudEvents (beta):** Infinitic now expose its events in [CloudEvents](https://cloudevents.io) json format. This allow users to build their own dashboards, logs, or even add hooks to some specific events.

  Examples of events exposed are:

  * for methods of workflows: `startMethod`, `cancelMethod`, `methodCanceled`, `methodcompleted`, `methodFailed`, `methodTimedOut`
  * for tasks within workflows: `taskDispatched`, `taskCompleted`, `taskFailed`,`taskCanceled`, `taskTimedOut`
  * for workflows within workflows: `remoteMethodDispatched`,`remoteMethodCompleted`,`remoteMethodFailed`,`remoteMethodCanceled`,`remoteMethodTimedOut`.
  * for the workflow executor itself (also called WorkflowTask) `executorDispatched`, `executorCompleted`, `executorFailed`

  Each event is accompanied by relevant data, such as the error details for a `taskFailed` event or the arguments for a `remoteMethodDispatched` event.

  Note1: The events are generated by reading the actual events from Infinitic's topics, rather than being produced by interceptors in the workers. This approach is deliberately chosen to prevent any potential slowdown in the processing of workflows or the introduction of errors. Additionally, it facilitates the possibility of regenerating events if necessary. Most of the time, event generation is expected to be nearly real-time, as the processing of these events is typically less resource-intensive than the execution of tasks or workflows.

  Note2: the format of these events differs from Infinitic's internal format. This is intentional, as Infinitic may utilize internal data that is not pertinent for public API exposure. Additionally, while those events' format should be eventually stable, Infinitic's internal format may undergo changes to meet evolving needs without affecting backward compatibility with existing messages.

  *This feature is currently in beta and may be refined based on user feedback.*
* **Delegated Tasks**: In certain cases, tasks cannot be processed directly by a worker, and instead, the task invokes another system for processing, typically through an HTTP call. If the external system can process the task synchronously and return the output (or report a failure), the process works smoothly. However, if the external system cannot provide a synchronous response, the situation becomes ambiguous, leaving Infinitic without a clear indication of whether the task has been completed or failed, nor an ability to retrieve the result. Starting with version 0.13.0, Infinitic introduces a "delegated task" feature. This feature, enabled through an annotation on the task, informs Infinitic that the method's completion does not signify the task's completion and that it should await asynchronous notification of the task's outcome. To support this functionality, a new `completeDelegatedTask` method has been added to the `InfiniticClient`.
* InfiniticWorker now offers new methods that allow for the programmatic registration of services and workflows, bypassing the need for configuration files. While initially used for internal testing, this feature can also be beneficial in scenarios where using configuration files is impractical.

{% version-improvements /%}

* Infinitic has been updated to use UUID version 7. These are sortable UUIDs that include a timestamp, which is expected to enhance performance when used as primary keys in databases.
* **Idempotency**: In scenarios where hardware or network issues occur, there's a possibility that the same tasks may be processed multiple times. Ultimately, it falls upon the user to ensure tasks are designed to be idempotent as required. Starting from version 0.13.0, the `taskId` can be reliably used as an idempotent key. This is because Infinitic will generate the same value for `taskId`, even if the task creation process is executed repeatedly.
* **Performance Improvement:** Prior to version 0.13.0, initiating a workflow involved sending a message to the workflow engine, which would then create an entry to store its state in the database. Following this, it would send another message to commence the workflow execution in order to identify and dispatch the first task. This task information would be relayed back to the engine for dispatch. The drawback of this approach was evident during surges in workflow initiation (for example, 1 million starts), where Infinitic had to sequentially store 1 million state entries before beginning to process the first task. This could significantly delay the start of task processing in practical scenarios. Since the release of version 0.13.0, the execution process has been optimized. Now, the first task is processed immediately upon dispatch by all available workers, substantially reducing the "time to first execution."
* **Worker Graceful Shutdown**: Infinitic is designed to ensure no messages are lost and that workflow executions continue under any circumstances. However, prior to version 0.13.0, shutting down a worker could result in a significant number of duplicated messages or actions. This was because the worker could close while still sending multiple messages. With the introduction of version 0.13.0, workers now attempt to complete any ongoing executions before shutting down, with a default grace period of 30 seconds. This duration can be adjusted using the new `shutdownGracePeriodSeconds` setting in the worker configuration.
* **Worker Quicker Start**: Upon startup, a worker verifies the existence of the tenant, namespace, and necessary topics for the services and workflows it utilizes, creating them if necessary. Previously, this setup was performed sequentially. Now, it is executed in parallel, significantly reducing startup time, especially in scenarios where a worker is responsible for managing a large number of tasks or workflows.
* 

{% version-bug-fixes /%}

* Fix false warning about topics being partitioned
* Fixed the behavior of `getSecondsBeforeRetry`, which defines the task retry strategy. When the value is less than or equal to 0, retries will now occur immediately. Previously, no retry would be attempted in this scenario.
* If the `methodId` is not specified when using `CompleteTimers` client method, all timers of the workflow will now be completed. Previously, only the timers on the main method were completed in the absence of a specified `methodId`.

## v0.12.3

{% version-new-features /%}

- A new configuration option `maxPoolSize` has been introduced to the MySQL storage configuration. This option allows you to specify the maximum number of connections in the connection pool.
- The `tagEngine` setting can now be configured under `serviceDefault`.
- The `tagEngine` and `workflowEngine` settings can now be configured under `workflowDefault`.

{% version-breaking-changes /%}

- The entries `service` and `workflow` in the worker configuration, which were used to establish default values for services and workflows, have been renamed. The updated names are `serviceDefault` and `workflowDefault`, respectively.

{% version-improvements /%}

- Not being able to check tenant / namespace does not trigger an error anymore.

## v0.12.2

{% version-improvements /%}

* Restore config files as data classes instead of interfaces
* Restore `fromConfig` method for clients and workers
* Improve worker logging

## v0.12.1

{% version-new-features /%}

* `WithTimeout` interfaces on Workflows interfaces can now be used to define global timeouts

{% version-bug-fixes /%}

* Fix Json Serialization of WorkflowTask parameters and return value for previous versions
* Fix GetIds on client for inMemory implementation

{% version-improvements /%}

* WorkflowTask parameters and return value are now serialized using avro with schema fingerprint - this will improve future backward compatibilities

## v0.12.0

{% version-new-features /%}

* @TimeOut annotations on Services and Workflows interfaces can now be used to define global timeouts (including message transportation and retries) increasing workflow reliability - fix [#74](https://github.com/infiniticio/infinitic/issues/74) &  [#198 ](https://github.com/infiniticio/infinitic/issues/198)
* Pulsar tenant, namespace and topics are created on-the-fly when needed. ("client-response" topics are not created systematically anymore)
* We now check that services and workflows implementation defined in configuration are actually an implementation of the provided name  - fix [#200](https://github.com/infiniticio/infinitic/issues/200)
* A subscription is now automatically created to DLQ to avoid losing the messages
* The workflow engine is now aware of messages sent to Dead Letter Queue

{% version-improvements /%}

* Refactor of Transport (Pulsar and InMemory implementation)
* End-to-end tests are now done directly on Pulsar (when Docker is available)
* Additional backward compatibility tests
* Improved logging
* Throwable are not caught anymore anywhere
* Use io.github.oshai:kotlin-logging-jvm for Logging
* Fixed https://github.com/infiniticio/infinitic/security/dependabot/33

## v0.11.7

{% version-improvements /%}

- Bump to gradle 8.4 and use jvm toolchain 17
- Update to kotlin 1.9.20
- Update CI to jvm 17 and separate build, test and lint
- Bump several libraries
- Plugin replace ktfmt with Spotless (with ktfmt) for better integration
- use testContainers for testing Redis

## v0.11.6

{% version-bug-fixes /%}

- fix [#184](https://github.com/infiniticio/infinitic/issues/184)

{% version-new-features /%}

With the help of [@cyrilStern](https://github.com/cyrilStern), workflows' state can now be stored in a compressed format

{% version-improvements /%}

Bump dependencies version:

- com.ncorti.ktfmt.gradle from 0.11.0 to 0.12.0
- mysql:mysql-connector-java from 8.0.32 to 8.0.33
- org.testcontainers:mysql from 1.17.6 to 1.18.3

## v0.11.5

{% version-improvements /%}

Bump dependencies version:

- kotlinx-coroutines from 1.6.4 to 1.7.1
- caffeine from 3.1.3 to 3.1.6
- kotlinx-serialization-json from 1.5.0-RC to 1.5.1
- json-path from 2.7.0 to 2.8.0
- jackson from 2.14.2 to 2.15.2
- kotest from 5.5.5 to 5.6.2
- mockk from 1.13.4 to 1.13.5
- avro4k from 1.6.0 to 1.7.0
- hoplite from 2.7.1 to 2.7.4
- pulsar from 2.11.0 to 2.11.1
- kweb from 1.3.7 to 1.4.0
- slf4j from 2.0.6 to 2.0.7
- kotlin-logging from 3.0.0 to 3.0.5

[@Enach](https://github.com/enach): Improve MySQL table structure with an additional index on KeySet

## v0.11.4

{% version-bug-fixes /%}

- fixed a bug occurring for tasks longer than 30 seconds

{% version-improvements /%}

- upgrade of dependencies

## v0.11.3

{% version-bug-fixes /%}

- fix bug in which a state was not deleted after completion of an async child-workflow or method

{% version-improvements /%}

- use Ktfmt instead of Ktlint

---

## v0.11.2

{% version-new-features /%}

- new consumer property in Pulsar configuration to define default properties for Pulsar consumers
- new producer property in Pulsar configuration to define default properties for Pulsar producers

---

## v0.11.1

{% version-new-features /%}

- Workflow Versioning

---

## v0.11.0

{% version-new-features /%}

- new @Timeout annotation
- new @Retry annotation
- new @CheckMode annotation
- new WithTimeout interface
- new WithRetry interface
- new timeoutSeconds parameter in worker's configuration file
- new retry parameter in worker's configuration file
- new checkMode in worker's configuration file

{% version-breaking-changes /%}

- TaskOptions removed
- WorkflowOptions removed
- Services do not need anymore to extend abstract class Task
- Task context replaced by Task static properties

---

## v0.10.0

{% version-new-features /%}

- new completeTimers function in clients
- Services can now be manually registered in workers (fix #168)

{% version-breaking-changes /%}

- In configuration files, stateStorage is replaced by storage and stateCache is replaced by cache
- storage and cache configuration are now properties of those keywords (see doc)
- InfiniticClient and InfiniticWorker can now be used for both Pulsar and InMemory transport, removing the need for factories

{% version-improvements /%}

- Topics used for delayed messages now have a long TTL (fix #170)
- Improved WorkflowUpdatedException logging

---

## v0.9.12

{% version-improvements /%}

- Bump version of Kotlin, Gradle and dependencies

---

## v0.9.11

{% version-bug-fixes /%}

- fix BytesSchemaVersion collision in KSchemaReader

---

## v0.9.10

{% version-bug-fixes /%}

- fix #164

---

## v0.9.9

{% version-improvements /%}

- It's now possible to config Redis pool (maxTotal, maxIdle, minIdle). MaxTotal default is unlimited
- It's now possible to serialize/deserialize an empty object

---

## v0.9.8

{% version-bug-fixes /%}

- fix backward compatibility of workflow state storage
- fix backward compatibility of Pulsar message serialization

---

## v0.9.7

{% version-new-features /%}

- MySQL can now be used to store states (thx to @GauthierHacout)

{% version-bug-fixes /%}

- fix #154

{% version-improvements /%}

- WorkflowEngine is now idempotent when receiving multiple times the DispatchMethod message
- WorkflowEngine is now idempotent when receiving multiple times the SendSignal message

---

## v0.9.6

{% version-bug-fixes /%}

- This release fixes a bug introduced in 0.9.4 when getting the status of deferred signals

---

## v0.9.5

{% version-breaking-changes /%}

- use Java version 11

{% version-improvements /%}

- Bump libraries dependencies

---

## v0.9.4

{% version-new-features /%}

- if we dispatch a workflow with a tag starting by "uniqueId:", Infinitic will check if another workflow with the same tag exists before dispatching it
  change the behavior of channel.receive(): each time await() is applied, the workflow awaits a new signal
- channel.receive(n) will let you receive n signals through await() and throw a OutOfBoundAwaitException at n+1

{% version-breaking-changes /%}

- await() method applied to a deferred channel.receive() does not return the same value anymore

{% version-improvements /%}

- Topics associated to clients and used for worker naming are now non-partitioned

---

## v0.9.3

{% version-bug-fixes /%}

This release fixes the issue preventing workers to run in v0.9.2

{% version-improvements /%}

- Add Infinitic version to schemas

---

## v0.9.2

**This version contains a configuration bug in Java compatibility and must not be used**

{% version-bug-fixes /%}

This release fixes a configuration bug in Java compatibility in 0.9.1

---

## v0.9.1

**This version contains a configuration bug in Java compatibility and must not be used**

{% version-breaking-changes /%}

- move Deferred and InfiniticClient to io.infinitic.clients

{% version-improvements /%}

- add backward compatibility test on WorkflowState
- add backward compatibility tests to topics schemas

---

## v0.9.0

{% version-new-features /%}

- new retryTasks and retryTasksAsync methods to retry tasks in running workflows
- messages that can not be handled by the engines are not put in dead letter queues

{% version-bug-fixes /%}

- fix a race condition where a client could send workflows with wrong parameters if sent asynchronously
- JSON deserialization does not fail on additional fields
- JSON deserialization use default value on missing fields (Kotlin)

{% version-breaking-changes /%}

- it's not possible anymore to manage tasks individually (tasks that are no within a workflow).
- the internal data and topics structure has changed. Hopefully, that should be the last breaking change before v1.0

{% version-improvements /%}

- wrap any exception in storage into a StorageException
- refactor and simplify Pulsar implementations into a new infinitic-transport-pulsar module
- refactor and simplify in-memory implementations into a new infinitic-transport-inmemory module
- split tag implementations into new infinitic-task-tag and infinitic-workflow-tag modules
- remove unused metrics-related code
- remove task-engine: tasks are now sent directly to workers.
- update clients, workflow engine, and workers to take into account the task engine removal
- add blockifqueue=true in Pulsar producer

---

## v.0.8.3

{% version-bug-fixes /%}

- Fix #139

---

## v0.8.2

{% version-bug-fixes /%}

- Fix #137 - key-shared subscription could not guarantee that a given workflow or task is managed by a unique engine, if more than one topic leads to this engine

{% version-breaking-changes /%}

- runningTimeout in TaskOptions has now been named maxRunDuration and should be a Duration object

{% version-improvements /%}

- Upgrade to Kotlin 1.6.10
- Bump version of 3rd party libs
- Discarded messages are now logged as warn
- Default values in client and workflow's newTask and newWorkflow functions are now null

---

## v0.8.1

{% version-bug-fixes /%}

- bump kotlin-logging version to 2.1.20 to mitigate Log4shell

{% version-improvements /%}

- remove unused directories node and infinitic-rest-api

---

## v0.8.0

{% version-new-features /%}

- new dispatch syntax to start task and workflow. The need for a new syntax was induced by #130 (removing the async function)
- methods in the client have now an Async version, useful if we do not want to wait for message sending.
- workflows can now run multiple methods in parallel! A straightforward application is to easily retrieve the properties of a running workflow
- we now use String instead of UUID for ids. Using UUID was an implementation leak, that could prevent us in the future to let the user choose for an id

{% version-bug-fixes /%}

- Fix #130
- Fix #56

{% version-breaking-changes /%}

- removing the join() method on deferred (replaced by Async version on method in client)
- removing the async function in client and workflow, replaced by dispatch
- updated internal schemas

{% version-improvements /%}

- improved default value when using channels in Java
- refactored error management in workflows, with new exception: WorkerException, TaskFailedException, WorkflowFailedException, UnknowWorkflowException...
- bump version of plugins and libs

---

## V0.7.4

{% version-new-features /%}

- authentication added to Pulsar configuration file to access to a secured Pulsar
- join() method to Deferred to wait for the triggering message to be sent to Pulsar
- join() method to InfiniticClient to wait for all messages to be sent to Pulsar
- client and worker are now closeable and wait for having sent all messages
- an in-memory implementation can be used during development by adding transport: inMemory in the configuration file.

{% version-bug-fixes /%}

- fix bugs in workflow engines occurring in some edge cases

{% version-breaking-changes /%}

- in Infinitic configuration file:
  - serviceUrl renamed to brokerServiceUrl to be on par with Pulsar documentation
  - serviceHttpUrl renamed to webServiceurl to be on par with Pulsar documentation
    removed setupPulsar from PulsarInfiniticAdmin (not needed anymore)
- changes in internal schemas

{% version-improvements /%}

- needed tenant/namespace/topics are now automatically created at launch time by workers.
- infiniticClient topic is automatically deleted when quitting
- improved tests reliability

---

## V0.7.3

**This release contains a syntax issue and should not be used**

---

## V0.7.2

{% version-bug-fixes /%}

- [Dashboard] add missing icons in git

{% version-improvements /%}

- [Dashboard] make data loading explicit with animated icon

---

## V0.7.1

{% version-bug-fixes /%}

- password for Redis is not exposed anymore in logs
- fixed a bug making SVG disappeared in Dashboard

---

## v0.7.0

{% version-new-features /%}

- New infinity-dashboard module implementing a first version of the infinitic dashboard. - - This version can:
  - display tasks and workflows (based on existing topics)
  - for each task or workflow, display connected workers and real-time stats of all topics used to manage it
- A @ignore annotation has beed added to label properties you may want to ignore in a workflow's state

{% version-bug-fixes /%}

- fix #119
- fix #120 - logger variables are now ignored from workflow's state -

{% version-breaking-changes /%}

- some topic names were changed - you need to use a new Pulsar namespace

{% version-improvements /%}

- dependencies were upgraded

---

## v0.6.5

{% version-bug-fixes /%}

- fix a bug appearing when for some java distribution due to bad detection of proxy classes

{% version-breaking-changes /%}

- internal schema has changed - you need to use a new Pulsar namespace

{% version-improvements /%}

- upgrade dependencies, including Kotlin 1.5

---

## v0.6.4

{% version-new-features /%}

- [client, task, workflow] an @Name annotation allows you to decouple the name of tasks and workflows from their underlying implementation name
- [task] tags are now accessible from the task context

## v0.6.3

{% version-improvements /%}

- better expose errors during task or workflow initialization in workers

---

## v0.6.2

{% version-improvements /%}

- use new s01.oss.sonatype.org server for publishing
- infinitic-client module is now as an api-type dependency in infinitic-pulsar module (users do not need anymore to import infinitic-client)
