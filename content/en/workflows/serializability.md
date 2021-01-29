---
title: Serializability
description: ""
position: 3.3
category: "Workflows"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

*Why must workflow parameters and return value be serializable/deserializable?*
- when a [client](/references/architecture) (or a [workflow executor](/references/architecture)) dispatches a workflow, it serializes parameters before sending them (along with class name and method name)
- when a [workflow executor](/references/architecture) receives a workflow to execute, it deserializes those parameters
- when a [workflow executor](/references/architecture) completes a workflow, it serializes the output and sent it back
- when a [workflow executor](/references/architecture) uses a workflow output in a parent workflow, it deserializes it

So workflows must follow the same serializability conditions as [tasks](/tasks/serializability).
