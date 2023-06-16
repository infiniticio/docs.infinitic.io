---
title: Pulsar
description: ""
---

## Pulsar installation

To install Pulsar, refer to the [Pulsar](http://pulsar.apache.org/docs/en/standalone/) documentation.

{% callout type="note"  %}

Infinitic can run on managed Pulsar cluster. It has been tested on [StreamNative](https://streamnative.io/), [Datastax](https://www.datastax.com/products/astra-streaming) and [CleverCloud](https://www.clever-cloud.com). We recommend using them if you are new to Pulsar.

{% /callout  %}

## Pulsar setup

Infinitic does not require specific settings, nevertheless, it's recommended to set up [retention policies](https://pulsar.apache.org/docs/en/cookbooks-retention-expiry/) to avoid losing messages when workers are not connected.

We recommend using Infinitic using a dedicated Pulsar [tenant](https://pulsar.apache.org/docs/en/concepts-multi-tenancy/#tenants) and using [namespaces](https://pulsar.apache.org/docs/en/concepts-multi-tenancy/#namespaces) to distinguish the production environment from dev or staging.
For example, we may want to create one namespace per developer, plus one for staging and one for production.

{% callout type="note"  %}

If they do not exist already, tenant and namespace are automatically created by Infinitic workers at launch time.

{% /callout  %}

## Connecting to a Pulsar cluster

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

### Transport encryption

[Transport Encryption using TLS](https://pulsar.apache.org/docs/en/security-tls-transport/#client-configuration) can be configured with those additional parameters:

```yaml
pulsar:
  ...
  useTls: true
  tlsAllowInsecureConnection: false
  tlsTrustCertsFilePath: /path/to/ca.cert.pem
  tlsEnableHostnameVerification: false
```

If we use a [KeyStore](https://pulsar.apache.org/docs/en/security-tls-keystore/#configuring-clients), it can be configured with:

```yaml
pulsar:
  ...
  useKeyStoreTls: true
  tlsTrustStoreType: JKS
  tlsTrustStorePath: /var/private/tls/client.truststore.jks
  tlsTrustStorePassword: clientpw
```

### Authentication

Using [Json Web Token](https://pulsar.apache.org/docs/en/security-jwt/):

```yaml
pulsar:
  ...
  authentication:
    token: our_token

```

Using [Athen](https://pulsar.apache.org/docs/en/security-athenz/#configure-clients-for-athenz):

```yaml
pulsar:
  ...
  authentication:
    tenantDomain: shopping
    tenantService: some_app
    providerDomain: pulsar
    privateKey: file:///path/to/private.pem
    keyId: v1
```

Using [OAuth2](https://pulsar.apache.org/docs/en/security-oauth2/#pulsar-client)

```yaml
pulsar:
  ...
  authentication:
    privateKey: file:///path/to/key/file.json
    issuerUrl: https://dev-kt-aa9ne.us.auth0.com
    audience: https://dev-kt-aa9ne.us.auth0.com/api/v2/
```

## Default producer settings

We can provide default settings for all producers. All are optional. Pulsar default will be used if not provided.

```yaml
pulsar:
  ...
  producer:
    autoUpdatePartitions: # Boolean
    autoUpdatePartitionsIntervalSeconds: # Double
    batchingMaxBytes: # Int
    batchingMaxMessages: # Int
    batchingMaxPublishDelaySeconds: # Double
    blockIfQueueFull: # Boolean (Infinitic default: true)
    compressionType: # CompressionType
    cryptoFailureAction: # ProducerCryptoFailureAction
    defaultCryptoKeyReader: # String
    encryptionKey: # String
    enableBatching: # Boolean
    enableChunking: # Boolean
    enableLazyStartPartitionedProducers: # Boolean
    enableMultiSchema: # Boolean
    hashingScheme: # HashingScheme
    messageRoutingMode: # MessageRoutingMode
    properties: # Map<String, String>
    roundRobinRouterBatchingPartitionSwitchFrequency: # Int
    sendTimeoutSeconds: # Double
```

## Default consumer settings

We can provide default settings for all consumers. All are optional. Pulsar default will be used if not provided.

```yaml
pulsar:
  ...
  consumer:
    loadConf: # Map<String, String>
    subscriptionProperties: # Map<String, String>
    ackTimeoutSeconds: # Double
    isAckReceiptEnabled: # Boolean
    ackTimeoutTickTimeSeconds: # Double
    negativeAckRedeliveryDelaySeconds: # Double
    defaultCryptoKeyReader: # String
    cryptoFailureAction: # ConsumerCryptoFailureAction
    receiverQueueSize: # Int
    acknowledgmentGroupTimeSeconds: # Double
    replicateSubscriptionState: # Boolean
    maxTotalReceiverQueueSizeAcrossPartitions: # Int
    priorityLevel: # Int
    properties: # Map<String, String>
    autoUpdatePartitions: # Boolean
    autoUpdatePartitionsIntervalSeconds: # Double
    enableBatchIndexAcknowledgment: # Boolean
    maxPendingChunkedMessage: # Int
    autoAckOldestChunkedMessageOnQueueFull: # Boolean
    expireTimeOfIncompleteChunkedMessageSeconds: # Double
    startPaused: # Boolean
    maxRedeliverCount: # Int (Infinitic default: 3)
```
