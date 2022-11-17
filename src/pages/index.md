---
title: Getting started
pageTitle: Unbreakable Business Processess.
description: ""
---

Built on top of [Apache Pulsar](https://pulsar.apache.org/), Infinitic lets us easily orchestrate services distributed on multiple servers - in any complex scenario. With the peace of mind of knowing that a failure somewhere will never break our workflows. {% .lead %}

Possible use cases are:

- microservices orchestration
- distributed transactions
- data pipelines operations
- business processes implementation
- etc.

Using Infinitic, we get:

- **versatility**: we can use loops, conditions, data manipulations instructions provided by the programming language, without being limited by the capabilities of a DSL
- **maintainability**: our workflows are easy to understand, defined in one place, and versioned like any other piece of code
- **observability**: everything is closely monitored and exposed on dashboards
- **reliability**: workflows are immune to services or workers failures

{% callout type="note" title="Choose your programming language" %}

Infinitic is currently available in Java and Kotlin.

*Click the {% code-icon type="java" /%} button in the top navigation bar to select the programming language for this documentation*.

Infinitic can support more programming languages. [Contact us](/docs/community/contact) if interested.

{% /callout  %}


{% quick-links %}

{% quick-link title="Terminology" icon="installation" href="/docs/introduction/terminology" description="Learn the different components of Infinitic: Services, Tasks, Workflows, Workers, Clients." /%}

{% quick-link title="Under The Hood" icon="presets" href="/docs/introduction/event-driven-workflows" description="Learn how workflows processed by Infinitic are fully event-driven, horizontally scalable, and immune to errors." /%}

{% quick-link title="Workflow Examples" icon="plugins" href="/docs/introduction/examples" description="Workflow examples showcasing how easy it is to build complex business processes and how powerful Infinitic is." /%}

{% quick-link title="Hello World" icon="theming" href="/docs/introduction/hello-world" description="Step-by-type guide to build our first workflow." /%}

{% /quick-links %}
