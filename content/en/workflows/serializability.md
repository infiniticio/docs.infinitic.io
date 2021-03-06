---
title: Serializability
description: ""
position: 5.4
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

_Why must workflow parameters and return value be serializable/deserializable?_

- when a [client](/clients/building-client) (or a workflow executor) dispatches a workflow, it serializes parameters before sending them (along with class name and method name)
- when a workflow executor receives a workflow to execute, it deserializes those parameters
- when a workflow executor completes a workflow, it serializes the output and sent it back
- when a workflow executor uses a workflow output in a parent workflow, it deserializes it

So workflows must follow the same serializability conditions as [tasks](/tasks/serializability).
