---
title: Pulsar
description: This page provides a comprehensive guide on installing and setting up Apache Pulsar for use with Infinitic. It covers recommendations for managed Pulsar clusters, retention policies, and the creation of dedicated tenants and namespaces for environment separation. Additionally, it details the configuration needed to connect Infinitic clients and workers to a Pulsar cluster, including minimal setup for development, transport encryption, authentication methods, and default settings for producers and consumers to ensure reliable message handling.
---
## Pulsar installation

To install Pulsar, refer to the [Pulsar](http://pulsar.apache.org/docs/en/standalone/) documentation.

{% callout type="note"  %}

Infinitic can run on managed Pulsar cluster. It has been tested on [StreamNative](/docs/references/pulsar#stream-native), [Datastax](/docs/references/pulsar#datastax) and [CleverCloud](/docs/references/pulsar#clever-cloud). We recommend using them if you are new to Pulsar.

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


## Using Managed Pulsar

How to configure Pulsar access when using Infinitic with various managed Pulsar services:

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

### [Pandio](https://pandio.com)

As of July 2024, Infinitic does not work on Pandio due to limitations on programmatic topic creation.

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

