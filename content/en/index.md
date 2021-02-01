---
title: Introduction
description: ""
position: 1
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow progress.

</alert>

Infinitic is a framework based on [Apache Pulsar](https://pulsar.apache.org/) that considerably eases building asynchronous distributed apps.

Many issues arise when we build and scale a distributed system - issues we don’t have in a single-process one. Infinitic provides simple but powerful libraries that let developers build distributed applications as if they were run on an infallible single-process system. It does this on top of Pulsar to benefit from its scalability and reliability.

Infinitic is very good at orchestrating workflows, ie. at managing the execution of tasks on distributed servers according to any complex scenario. Moreover, Infinitic ensures that a failure somewhere will never break your workflows.

At last, Infinitic lets us monitor everything occurring inside your app through dashboards.

Possible use cases are:

- microservices orchestration
- distributed transactions (payments...)
- data pipelines operations
- business processes implementation
- etc.

To start, we can:

- learn more about the <nuxt-link to="/overview/concepts"> concepts </nuxt-link> behind Infinitic,
- try a first pre-written <nuxt-link to="/overview/example-app"> example app </nuxt-link>,
- build our own <nuxt-link to="/overview/hello-world"> hello world app </nuxt-link>.
