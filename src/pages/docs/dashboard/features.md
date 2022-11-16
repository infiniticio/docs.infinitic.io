---
title: Features
description: ""
---

## List of workflows and tasks

Once set up, the dashboard presents all tasks and workflows that have been processed through your cluster:

![Dashboard ](/img/dashboard-infra.png)

You can see at a glance the # of deployed executors and their total backlog and throughput for each of them.

{% callout type="warning"  %}

For a near-real-time execution, you should have enough executors to prevent the backlog from growing.

{% /callout  %}

## Detail of topics used to run the workflows

For each workflow name, a set of topics are automatically deployed on Pulsar:

![Topics ](/img/dashboard-workflows-topics@2x.png)

By clicking on a workflow name on the dashboard, you can see the real-time statistics of all of them:

![Workflows ](/img/dashboard-infra-workflows.png)

## Detail of topics used to process the tasks

For each task name, a set of topics are automatically deployed on Pulsar:

![Tasks ](/img/dashboard-tasks-topics@2x.png)

By clicking on a task name on the dashboard, you can see the real-time statistics of all of them:

![Tasks details ](/img/dashboard-infra-tasks.png)

## Stats for a topic

Note that for each topic, you can see the very detail of its  metric by clicking on it:

![Topics details ](/img/dashboard-infra-details.png)
