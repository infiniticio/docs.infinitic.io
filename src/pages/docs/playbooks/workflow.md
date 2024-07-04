---
title: Workflow Playbook
description: .
---

This page describes how to implement common situations.

## Recurring Workflow

## Sending a signal to itself

## Follow-up on asynchronous tasks 

## Forwarding workflow's matadata to services

## Register programmatically Workflows

## Register programmatically Services



## Connecting to a Pulsar cluster

{% callout type="note"  %}

If they do not exist already, tenant and namespace are automatically created by Infinitic workers at launch time.

{% /callout  %}

Infinitic clients and workers need to know how to connect to our Pulsar cluster.
This is done through a `pulsar` entry within their configuration file.

### Minimal configuration

The minimal configuration - typically needed for development - contains:

```yaml
pulsar:
  brokerServiceUrl: pulsar://localhost:6650
  webServiceUrl: http://localhost:8080
  tenant: infinitic
  namespace: dev
```
