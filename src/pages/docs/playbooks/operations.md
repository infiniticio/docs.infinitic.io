---
title: Operations Playbook
description: .
---


## Using Managed Pulsar

This page describes how to configure Pulsar access when using Infinitic with various managed Pulsar services:

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
