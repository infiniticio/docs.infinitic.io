---
title: Getting started
pageTitle: Scalable Workflow Engine For Distributed Services.
description: Infinitic's official documentation, your comprehensive guide to mastering Infinitic's scalable workflow engine for distributed services. Dive into detailed tutorials, explore in-depth concepts, and discover practical examples to leverage Infinitic effectively in your Java or Kotlin projects. Whether you're orchestrating microservices, managing data pipelines, or implementing complex business processes, our documentation provides the tools and insights you need for success. Start enhancing your distributed systems with Infinitic's robust, scalable, and resilient framework today.
---
By using Infinitic, you can streamline the creation of resilient business processes, implementing an event-driven architecture in weeks instead of months. Infinitic provides peace of mind, ensuring that a failure in any component will never break your workflows. {% .lead %}

Infinitic Building with Infinitic requires running:
- a **database** for saving the workflow states (currently supporting Redis and MySQL, adding more is an easy task)
- an **event streaming platform** (currently supporting [Apache Pulsar](https://pulsar.apache.org/) as a dependency)
- applications - called **workers** in Infinitic terminology - built with Infinitic SDK that handles the essential tasks such as implementing events consumer, producer, serialization, schemas, and error management. This allows you to focus on your application-specific code. 
    - Workflow workers are in charge of managing the flow of data between Services
    - Services workers are in charge or exeuting your Services, either by containing a full implementation or by making API calls to your pre-existing APIs.

Infinitic is ideal for a wide range of applications requiring high scalability and high reliability, such as:

* Orchestrating microservices
* Managing distributed transactions
* Operating data pipelines
* Implementing business processes
* And more

Using Infinitic, you get:

* **Flexibility** : Embrace the unconstrained full power of programming languages with loops, conditions, and data manipulation to define your durable processes
* **Ease of Maintenance** : Workflows are easy to understand, consolidated in a single class, and version-controlled like any standard codebase.
* **Enhanced Observability** : Comprehensive monitoring is in place, with detailed insights available on dashboards.
* **Unmatched Reliability** : Workflows are resilient to service or worker failures, ensuring consistent operation.
* **High Scalability**: Infinitic employs an event-driven architecture at its core, which guarantees exceptional scalability.

{% callout type="note" title="Infinitic is currently available in Java and Kotlin." %}

*Click the {% code-icon type="java" /%} button in the top navigation bar to select the programming language for this documentation*.

Infinitic can support more programming languages. [Contact us](/docs/community/contact) if interested.

{% /callout  %}

{% quick-links %}

{% quick-link title="Terminology" icon="installation" href="/docs/introduction/terminology" description="Learn the different components of Infinitic: Services, Tasks, Workflows, Workers, Clients." /%}

{% quick-link title="Under The Hood" icon="presets" href="/docs/introduction/event-driven-workflows" description="Learn how workflows processed by Infinitic are fully event-driven, horizontally scalable, and immune to errors." /%}

{% quick-link title="Workflow Examples" icon="plugins" href="/docs/introduction/examples" description="Workflow examples showcasing how easy it is to build complex business processes and how powerful Infinitic is." /%}

{% quick-link title="Hello World" icon="theming" href="/docs/introduction/hello-world" description="Step-by-type guide to build our first workflow." /%}

{% /quick-links %}
