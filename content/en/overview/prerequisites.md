---
title: Prerequisites
description: ""
position: 1.3
category: "Overview"
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

## Installation

To run Infinitic you need :

- an Apache Pulsar cluster ([install](https://pulsar.apache.org/docs/en/standalone-docker/))
- a Redis database, to store tasks and workflow states ([install](https://redis.io/topics/introduction)).

If you have Docker on your computer, you can simply run `docker-compose up` on this `docker-compose.yml` file
(this installs also [Pulsar Manager](#pulsar-manager-setup)):

```yml
services:
  # Pulsar settings
  pulsar-standalone:
    image: apachepulsar/pulsar:2.7.0
    environment:
      - BOOKIE_MEM=" -Xms512m -Xmx512m -XX:MaxDirectMemorySize=1g"
    command: >
      /bin/bash -c "bin/apply-config-from-env.py conf/standalone.conf && bin/pulsar standalone"
    volumes:
      - "pulsardata:/pulsar/data"
      - "pulsarconf:/pulsar/conf"
    ports:
      - "6650:6650"
      - "8080:8080"
      - "8081:8081"

  # Pulsar Manager
  dashboard:
    image: apachepulsar/pulsar-manager:v0.2.0
    ports:
      - "9527:9527"
      - "7750:7750"
    depends_on:
      - pulsar-standalone
    links:
      - pulsar-standalone
    environment:
      SPRING_CONFIGURATION_FILE: /pulsar-manager/pulsar-manager/application.properties

  # Redis storage for state persistence
  redis:
    image: redis:6.0-alpine
    ports:
      - "6379:6379"
    volumes:
      - "redisdata:/data"

volumes:
  pulsardata:
  pulsarconf:
  redisdata:
```

## Pulsar Manager Setup

Optionally you may want to [install Pulsar Manager](https://github.com/apache/pulsar-manager), a web-based GUI management tool for managing and monitoring Pulsar.

<alert>

This section is here to help but is not specifically related to Infinitic. Please look at [Pulsar Manager](https://github.com/apache/pulsar-manager) website for a reference.

</alert>

Pulsar Manager will be available on [localhost:9527](http://localhost:9527). To be able to log in, do not forget to create an admin user (user = "admin", password = "apachepulsar") with:

```bash
CSRF_TOKEN=$(curl http://localhost:7750/pulsar-manager/csrf-token)
curl \
    -H "X-XSRF-TOKEN: $CSRF_TOKEN" \
    -H "Cookie: XSRF-TOKEN=$CSRF_TOKEN;" \
    -H 'Content-Type: application/json' \
    -X PUT http://localhost:7750/pulsar-manager/users/superuser \
    -d '{"name": "admin", "password": "apachepulsar", "description": "test", "email": "username@test.org"}'
```

To create an environment, choose a name (eg. "standalone") and provide the service url of Pulsar.

**If you use Docker**, you need to provide an url accessible _from the Pulsar Manager container_. To obtain it, do

```bash
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $pulsarName
```

where `$pulsarName` is the name of the Pulsar container (get it by `docker-compose ps`). you should obtain something like `172.18.0.2`.
Then the service url to use for adding an environment is `http://172.18.0.2:8080`.
