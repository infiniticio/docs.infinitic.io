---
title: Pulsar
description: This page provides a comprehensive guide on installing and setting up Apache Pulsar for use with Infinitic. It covers recommendations for managed Pulsar clusters, retention policies, and the creation of dedicated tenants and namespaces for environment separation. Additionally, it details the configuration needed to connect Infinitic clients and workers to a Pulsar cluster, including minimal setup for development, transport encryption, authentication methods, and default settings for producers and consumers to ensure reliable message handling.
---

{% callout %}

Infinitic can run on Pulsar clusters managed by third parties. It has been tested on [StreamNative](/docs/references/pulsar#stream-native), [Datastax](/docs/references/pulsar#datastax) and [CleverCloud](/docs/references/pulsar#clever-cloud).
We recommend these services for users new to Pulsar.

{% /callout  %}


## Pulsar Installation And Setup

For Pulsar installation instructions, please refer to the official Apache Pulsar [documentation](http://pulsar.apache.org/docs/en/standalone/).


### Recommended Configuration

While Infinitic doesn't require specific Pulsar settings, we recommend the following namespace / topic configuration:

| Parameter | Recommended Value | Description |
|-----------|-------------------|-------------|
| retentionTimeMinutes | 10080  | (7 days) Ensures messages are kept for a week |
| retentionSizeMB | 1024 | (1GB)  Limits the total size of retained messages |
| messageTTLSeconds | 1209600  or 31622400 | (14 days or 1 year) Sets message lifetime before expiration|
| delayedDeliveryTickTimeMillis | 1000|  (1 second)  Controls the frequency of checking for delayed messages |

**Rationale for These Settings:**

* Retention Parameters: The retention time and size ensure that Pulsar doesn't delete messages before a worker has a chance to process them, even in cases of temporary worker downtime or backlog.

* Message TTL: 
   - For standard topics: 14 days provides a generous window for message processing.
   - For topics with delayed messages: 1 year allows for long-term scheduled tasks.

* Delayed Delivery Tick Time: The 1-second interval balances responsiveness with CPU usage, particularly beneficial for scenarios involving large delays.

{% callout type="note" %}

Infinitic workers automatically create the tenant, namespace and topics at launch if they don't exist, with the recommended configuration.

{% /callout  %}


### Multi-tenancy Support

Pulsar has native multi-tenancy capabilities, allowing for efficient resource isolation and management across different environments or teams within a single Pulsar cluster.

This multi-tenancy capabilities extend to Infinitic. For example:

  * Dedicate a tenant for Infinitic (e.g., `infinitic`)
  * Use namespaces to separate environments (e.g., development, staging, production):

    - `infinitic/dev_alice`
    - `infinitic/dev_bob`
    - `infinitic/staging`
    - `infinitic/production`


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

## Pulsar Exception

### Exception During Message Deserialization

Infinitic handles all aspects of message deserialization internally. User content is not deserialized at this stage but during the subsequent task preparation phase. Infinitic messages are serialized in Avro format, and rigorous testing ensures backward compatibility for all messages. Deserialization errors are extremely rare but can occur in specific scenarios, such as upgrading Infinitic to a new version and then rolling back to a previous version, if these versions have schema changes.

If a deserialization error occurs:

* The affected message is immediately negatively acknowledged and queued for reprocessing by another broker.
* After three unsuccessful attempts, the message is moved to a dead letter queue, and the error is logged. The number of retry attempts can be adjusted using the `maxRedeliverCount` parameter in the [consumer configuration](/docs/references/pulsar#consumer-settings).

In this unlikely event, the task remains pending in the workflow that dispatched it, as Infinitic cannot identify which specific task was in the failed message. To resolve this situation, you have two options:

1. [Retry ongoing tasks](/docs/clients/retry-failed-tasks) (ideally, your tasks should be idempotent to ensure safe retries).
2. If the issue was caused by an Infinitic downgrade, revert the downgrade and resend the messages from the dead letter queues to their original topics.

### Exception During Message Sending

When Infinitic processes a message, it sends new messages to the event brokers. If Infinitic fails to send a message successfully, it will immediately stop and attempt to negatively acknowledge the current message. Once negatively acknowledged, Pulsar will automatically reattempt to deliver the message after a delay. If the message cannot be successfully consumed after three attempts, it is moved to a dead letter queue, and the error is logged.

Key settings to consider:

- `ackTimeout`: Defines the period within which Infinitic must acknowledge received messages. If a message is not acknowledged within this period, it is considered unacknowledged, and the broker will resend it to the consumer. *By default, the acknowledgment timeout is disabled*, meaning that messages delivered to a consumer will not be redelivered unless the consumer stops or explicitly acknowledges or negatively acknowledges them.
- `maxRedeliverCount`: Specifies the maximum number of times a message can be redelivered to a consumer after it has been negatively acknowledged (NACKed) or not acknowledged within the acknowledgment timeout period, before being sent to a Dead Letter Queue. The default is 3 for Infinitic.
- `negativeAckRedeliveryDelay`: Determines the delay period that Pulsar will wait before redelivering a negatively acknowledged message. This delay helps manage transient errors by preventing immediate retries. The default is 60 seconds.

Those settings can be set on [consumers](#consumer-settings).

## Using Infinitic With Third-Party Providers

Infinitic has been tested successfully with the following providers:

### [Clever-Cloud](https://clever-cloud.com)

1. In your [Clever-Cloud console](https://console.clever-cloud.com), select "create... an add-on", then "Pulsar". 

2. After your add-on is created, select the "Service dependencies" tab to get the information relevant to your Pulsar namespace:
![Clever-Cloud Dashboard ](/img/clevercloud-pulsar.png)

3. Use the provided data to set up Infinitic access to Pulsar:

```yaml
pulsar:
  brokerServiceUrl: pulsar+ssl://materiamq.eu-fr-1.services.clever-cloud.com:6651 # Paste ADDON_PULSAR_BINARY_URL here
  webServiceUrl: https://materiamq.eu-fr-1.services.clever-cloud.com:443          # Paste ADDON_PULSAR_HTTP_URL here
  tenant: orga_f8786ef8-ac53-43ec-8c34-f81dab32b7cb              # Paste ADDON_PULSAR_TENANT here
  namespace: pulsar_f3f94e46-0a32-4430-a05f-f458abca7297         # Paste ADDON_PULSAR_NAMESPACE here
  authentication:
    token: EnYKDBgDIggKBggE**********************EgIYDRIkCAASIDZ # Paste ADDON_PULSAR_TOKEN here
```

### [Datastax](https://www.datastax.com/)

1. In your [Datastax console](https://astra.datastax.com) , select the "Streaming" icon on the left navbar, and create a new tenant.

2. Select the "Connect" tab:
![Datastax Details](/img/datastax-details.png)

3. Click "Token Manager" to open the "Settings" tab, where you can create a new Token.

4. Configure Infinitic Pulsar as follows:

```yaml
pulsar:
  brokerServiceUrl: pulsar+ssl://pulsar-gcp-europewest1.streaming.datastax.com:6651 # See Tenant Details
  webServiceUrl: https://pulsar-gcp-europewest1.api.streaming.datastax.com          # See Tenant Details
  tenant: test-inf # See Tenant Details
  namespace: dev   # Your choice
  authentication:
    token: eyJhbGciOiJS********************pIzmCvpI8t_g # Paste the token here
```

{% callout type="warning"  %}

As of July 2024, you need to enable the "Auto Topic Creation" setting in the "Settings" tab of your namespace (see "Namespace and Topics"). If not enabled, the Infinitic worker will be unable to programmatically create the needed topics.

{% /callout  %}

### [StreamNative](https://streamnative.io)

{% callout %}

StreamNative's offering differs from other providers in that it offers to manage a full Apache Pulsar cluster for you, while other providers typically offer a tenant in a shared cluster.

{% /callout  %}

1. In your [StreamNative console](https://console.streamnative.cloud), create an instance (multiple deployment options available).

2. After creation (which can take a few minutes), select your new instance and go to the "Details" tab. You will find the Access Points:
![StreamNative Details](/img/streamnative-details.png)

3. Click the "Connect To Cluster" link and follow the process. You can choose between two authentications methods:

    * OAUTH2

      a - Download the file and save it to a safe place (e.g. to `/Users/gilles/.sn/infinitic-admin.json`)

      b - Then your Infinitic pulsar configuration is:

      ```yaml
      pulsar:
        brokerServiceUrl: pulsar+ssl://pc-3d190e03.euw1-turtle.streamnative.g.snio.cloud:6651 # See Cluster Details
        webServiceUrl: https://pc-3d190e03.euw1-turtle.streamnative.g.snio.cloud              # See Cluster Details
        tenant: infinitic # Your choice
        namespace: dev    # Your choice
        authentication:
          issuerUrl: https://auth.streamnative.cloud/
          privateKey: file:///YOUR-KEY-FILE-PATH # e.g file:///Users/gilles/.sn/infinitic-admin.json
          audience: urn:sn:pulsar:o-ye4kl:infinitic # See Cluster Details
      ```

    * API Key

      a - Create an API key (choose the expiration date wisely), then copy it.

      b - Configure Infinitic Pulsar as follows:

      ```yaml
      pulsar:
        brokerServiceUrl: pulsar+ssl://pc-3d190e03.euw1-turtle.streamnative.g.snio.cloud:6651 # See Cluster Details
        webServiceUrl: https://pc-3d190e03.euw1-turtle.streamnative.g.snio.cloud              # See Cluster Details
        tenant: infinitic # Your choice
        namespace: dev    # Your choice
        authentication:
          token: eyJhbGciOiJSUzII*************MWt8BFgm2rK4aA # Paste the API key here
      ```

## Pulsar Client Settings

Infinitic allows you to customize Pulsar producer and consumer settings to optimize performance for your specific use case. Below are the configuration options for both producers and consumers.

### Producer Settings

You can provide default settings for all producers in the `pulsar.producer` section of your configuration file. All settings are optional; Pulsar defaults will be used if not specified.

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

The `blockIfQueueFull` setting for producers defaults to true in Infinitic, which differs from Pulsar's default.

Consult the Apache Pulsar documentation for detailed explanations of each setting.


### Consumer Settings

Similarly, you can configure default settings for all consumers in the `pulsar.consumer` section. All settings are optional, with Pulsar defaults used if not provided.
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

The `maxRedeliverCount` for consumers is set to 3 by default in Infinitic.

Consult the Apache Pulsar documentation for detailed explanations of each setting.
