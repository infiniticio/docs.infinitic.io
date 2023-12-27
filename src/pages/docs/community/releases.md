---
title: Releases
description: ""
---
## v0.12.2

{% version-improvements /%}

* Restore config files as data classes instead of interfaces
* Restore `fromConfig` method for clients and workers
* iImprove worker logging

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
- new timeoutInSeconds parameter in worker's configuration file
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
- refactored error management in workflows, with new exception: WorkerException, FailedTaskException, FailedWorkflowException, UnknowWorkflowException...
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
