---
title: Architecture
description: ""
position: 2.1
category: "Components"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

Infinitic has an [event-based 's architecture](https://medium.com/@gillesbarbier/under-the-hood-of-a-workflow-as-code-event-driven-engine-6107dab9b87c) based on Pulsar and processed by workers:

<img src="/architecture@2x.png" class="img" width="1280" height="640" alt=""/>

So, when using Infinitic, we have:
- a running [Pulsar](https://pulsar.apache.org/) cluster - this cluster could be in our own infrastructure or hosted by a 3rd-party vendor. Infinitic uses a dedicated tenant and namespace, and we are free to use this cluster for our other needs. During developement, we can use a local [standalone](https://pulsar.apache.org/docs/en/standalone/) Pulsar. 
- some Infinitic clients (used in our apps), in charge of starting tasks / workflows, and sending events to workflows
- multiples workers, possibly running on multiple machines, to process tasks and workflows. Those workers contain the actual code of tasks / workflows. When running tasks, those workers can also be some proxies or wrappers around our existing (micro)services.
- databases (currently Redis) to store the states or tasks / workflows

<alert type="info">
Currently Infinitic uses Redis for the storage of states. In order to minimize the infrastructure overhead, we would like to use stateful functions instead of workers/Redis as soon as this feature is production-ready in Pulsar.
</alert>

