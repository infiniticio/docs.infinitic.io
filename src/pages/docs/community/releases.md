---
title: Releases
description: ""
---

## v0.11.2

10/25/2022

### 🚀 New features

- new consumer property in Pulsar configuration to define default properties for Pulsar consumers
- new producer property in Pulsar configuration to define default properties for Pulsar producers

---

## v0.11.1

10/23/2022

### 🚀 New features

- Workflow Versioning

---

## v0.11.0

10/16/2022

### 🚀 New features

- new @Timeout annotation
- new @Retry annotation
- new @CheckMode annotation
- new WithTimeout interface
- new WithRetry interface
- new timeoutInSeconds parameter in worker's configuration file
- new retry parameter in worker's configuration file
- new checkMode in worker's configuration file

### 🚨 Breaking changes

- TaskOptions removed
- WorkflowOptions removed
- Services do not need anymore to extend abstract class Task
- Task context replaced by Task static properties

---

## v0.10.0

10/3/2022

### 🚀 New features

- new completeTimers function in clients
- Services can now be manually registered in workers (fix #168)

### 🚨 Breaking changes

- In configuration files, stateStorage is replaced by storage and stateCache is replaced by cache
- storage and cache configuration are now properties of those keywords (see doc)
- InfiniticClient and InfiniticWorker can now be used for both Pulsar and InMemory transport, removing the need for factories

### 🔬 Improvements

- Topics used for delayed messages now have a long TTL (fix #170)
- Improved WorkflowUpdatedException logging

---

## v0.9.12

9/10/2022

### 🔬 Improvements

- Bump version of Kotlin, Gradle and dependencies

---

## v0.9.11

6/28/2022

### 🪲 Fixes

- fix BytesSchemaVersion collision in KSchemaReader

---

## v0.9.10

6/27/2022

### 🪲 Fixes

- fix #164

---

## v0.9.9

6/5/2022

### 🔬 Improvements

- It's now possible to config Redis pool (maxTotal, maxIdle, minIdle). MaxTotal default is unlimited
- It's now possible to serialize/deserialize an empty object

---

## v0.9.8

5/29/2022

### 🪲 Fixes

- fix backward compatibility of workflow state storage
- fix backward compatibility of Pulsar message serialization

---

### v0.9.7

5/22/2022

### 🚀 New features

- MySQL can now be used to store states (thx to @GauthierHacout)

### 🪲 Fixes

- fix #154

### 🔬 Improvements

- WorkflowEngine is now idempotent when receiving multiple times the DispatchMethod message
- WorkflowEngine is now idempotent when receiving multiple times the SendSignal message

---

## v0.9.6

5/1/2022

### 🪲 Fixes

- This release fixes a bug introduced in 0.9.4 when getting the status of deferred signals

---

## v0.9.5

4/28/2022

### 🚨 Breaking changes

- use Java version 11

### 🔬 Improvements

- Bump libraries dependencies

---

## v0.9.4

4/18/2022

### 🚀 New features

- if we dispatch a workflow with a tag starting by "uniqueId:", Infinitic will check if another workflow with the same tag exists before dispatching it
change the behavior of channel.receive(): each time await() is applied, the workflow awaits a new signal
- channel.receive(n) will let you receive n signals through await() and throw a OutOfBoundAwaitException at n+1

### 🚨 Breaking changes

- await() method applied to a deferred channel.receive() does not return the same value anymore

### 🔬 Improvements

- Topics associated to clients and used for worker naming are now non-partitioned

---

## v0.9.3

4/2/2022

### 🪲 Fixes

This release fixes the issue preventing workers to run in v0.9.2

### 🔬 Improvements

- Add Infinitic version to schemas

---

## v0.9.2

3/28/2022

**This version contains a configuration bug in Java compatibility and must not be used**

### 🪲 Fixes

This release fixes a configuration bug in Java compatibility in 0.9.1

---

## v0.9.1

3/27/2022

**This version contains a configuration bug in Java compatibility and must not be used**

### 🚨 Breaking changes

- move Deferred and InfiniticClient to io.infinitic.clients

### 🔬 Improvements

- add backward compatibility test on WorkflowState
- add backward compatibility tests to topics schemas

---

## v0.9.0

3/21/2022

### 🚀 New features

- new retryTasks and retryTasksAsync methods to retry tasks in running workflows
- messages that can not be handled by the engines are not put in dead letter queues

### 🪲 Fixes

- fix a race condition where a client could send workflows with wrong parameters if sent asynchronously
- JSON deserialization does not fail on additional fields
- JSON deserialization use default value on missing fields (Kotlin)

### 🚨 Breaking changes

- it's not possible anymore to manage tasks individually (tasks that are no within a workflow).
- the internal data and topics structure has changed. Hopefully, that should be the last breaking change before v1.0

### 🔬 Improvements

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

2/12/2022

### 🪲 Fixes

- Fix #139

---

## v0.8.2

2/6/2022

### 🪲 Fixes

- Fix #137 - key-shared subscription could not guarantee that a given workflow or task is managed by a unique engine, if more than one topic leads to this engine

### 🚨 Breaking changes

- runningTimeout in TaskOptions has now been named maxRunDuration and should be a Duration object

### 🔬 Improvements

- Upgrade to Kotlin 1.6.10
- Bump version of 3rd party libs
- Discarded messages are now logged as warn
- Default values in client and workflow's newTask and newWorkflow functions are now null

---

## v0.8.1

12/18/2021

### 🪲 Fixes

- bump kotlin-logging version to 2.1.20 to mitigate Log4shell

### 🔬 Improvements

- remove unused directories node and infinitic-rest-api

---

## v0.8.0

10/24/2021

### 🚀 New features

- new dispatch syntax to start task and workflow. The need for a new syntax was induced by #130 (removing the async function)
- methods in the client have now an Async version, useful if we do not want to wait for message sending.
- workflows can now run multiple methods in parallel! A straightforward application is to easily retrieve the properties of a running workflow
- we now use String instead of UUID for ids. Using UUID was an implementation leak, that could prevent us in the future to let the user choose for an id

### 🪲 Fixes

- Fix #130
- Fix #56

### 🚨 Breaking changes

- removing the join() method on deferred (replaced by Async version on method in client)
- removing the async function in client and workflow, replaced by dispatch
- updated internal schemas

### 🔬 Improvements

- improved default value when using channels in Java
- refactored error management in workflows, with new exception: WorkerException, FailedTaskException, FailedWorkflowException, UnknowWorkflowException...
- bump version of plugins and libs

---

## V0.7.4

9/11/2021

### 🚀 New features

- authentication added to Pulsar configuration file to access to a secured Pulsar
- join() method to Deferred to wait for the triggering message to be sent to Pulsar
- join() method to InfiniticClient to wait for all messages to be sent to Pulsar
- client and worker are now closeable and wait for having sent all messages
- an in-memory implementation can be used during development by adding transport: inMemory in the configuration file.

### 🪲 Fixes

- fix bugs in workflow engines occurring in some edge cases

### 🚨 Breaking changes

- in Infinitic configuration file:
  - serviceUrl renamed to brokerServiceUrl to be on par with Pulsar documentation
  - serviceHttpUrl renamed to webServiceurl to be on par with Pulsar documentation
removed setupPulsar from PulsarInfiniticAdmin (not needed anymore)
- changes in internal schemas

### 🔬 Improvements

- needed tenant/namespace/topics are now automatically created at launch time by workers.
- infiniticClient topic is automatically deleted when quitting
- improved tests reliability

---

## V0.7.3

9/11/2021

** This release contains a syntax issue and should not be used **

---

## V0.7.2

7/30/2021

### 🪲 Fixes

- [Dashboard] add missing icons in git

### 🎉 Improvements

- [Dashboard] make data loading explicit with animated icon

---

## V0.7.1

7/20/2021

### 🪲 Fixes
- password for Redis is not exposed anymore in logs
- fixed a bug making SVG disappeared in Dashboard

---

## v0.7.0

7/15/2021

### 🚀 New feature

- New infinity-dashboard module implementing a first version of the infinitic dashboard. - - This version can:
    - display tasks and workflows (based on existing topics)
    - for each task or workflow, display connected workers and real-time stats of all topics used to manage it
- A @ignore annotation has beed added to label properties you may want to ignore in a workflow's state

### 🪲 Fixes

- fix #119
- fix #120 - logger variables are now ignored from workflow's state -

### 🚨 Breaking changes

- some topic names were changed - you need to use a new Pulsar namespace

### 🔬 Improvements

- dependencies were upgraded

---

## v0.6.5

5/28/2021

### 🪲 Fixes

- fix a bug appearing when for some java distribution due to bad detection of proxy classes

### 🚨 Breaking changes

- internal schema has changed - you need to use a new Pulsar namespace

### 🔬 Improvements

- upgrade dependencies, including Kotlin 1.5

---

## v0.6.4

5/19/2021

### 🚀 New Features
- [client, task, workflow] an @Name annotation allows you to decouple the name of tasks and workflows from their underlying implementation name
- [task] tags are now accessible from the task context

## v0.6.3

5/11/2021

### 🔬 Improvements

- better expose errors during task or workflow initialization in workers

---

## v0.6.2

5/11/2021

### 🔬 Improvements

- use new s01.oss.sonatype.org server for publishing
- infinitic-client module is now as an api-type dependency in infinitic-pulsar module (users do not need anymore to import infinitic-client)
