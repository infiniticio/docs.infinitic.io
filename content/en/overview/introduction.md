---
title: Introduction
description: ""
position: 1.1
category: "Overview"
---

<!-- <img src="/preview.png" class="light-img" width="1280" height="640" alt=""/>
<img src="/preview-dark.png" class="dark-img" width="1280" height="640" alt=""/> -->

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow progress.

</alert>

Infinitic is a framework based on [Apache Pulsar](https://pulsar.apache.org/) that considerably eases building asynchronous distributed apps.

A lot of issues arise when you build and scale a distributed system - issues you don’t have in a single-process one. Infinitic provides simple but powerful libraries that let developers build distributed applications as if they were building on an infallible single-process system. It does this on top of Pulsar to benefit from its scalability and reliability.

Infinitic is very good at orchestrating workflows, ie. at managing the execution of tasks on distributed servers according to any complex scenario. Moreover, Infinitic ensures that a failure somewhere will never break your workflows.

At last, Infinitic lets you <nuxt-link to="#monitoring"> monitor </nuxt-link> everything occurring inside your app through dashboards.

Possible use cases are:

- microservices orchestration
- distributed transactions (payments...)
- data pipelines operations
- business processes implementation
- etc.

To start, we can:
- learn more about the <nuxt-link to="/overview/concepts"> concepts </nuxt-link> behind Infinitic,
- try a first pre-written <nuxt-link to="/overview/first-app"> example app </nuxt-link>,
- build our own <nuxt-link to="/overview/hello-world"> hello world app </nuxt-link>. 