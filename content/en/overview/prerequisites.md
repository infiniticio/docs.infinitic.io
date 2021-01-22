---
title: Prerequisites
description: ""
position: 1.3
category: "Overview"
fullscreen: true
---

<alert type="info">

Infinitic is still in active development. Subscribe [here](https://infinitic.substack.com) to follow the progress.

</alert>

To run Infinitic you need :

- an Apache Pulsar cluster ([install](https://pulsar.apache.org/docs/en/standalone-docker/))
- a Redis database, to store tasks and workflow states ([install](https://redis.io/topics/introduction)).

If you have Docker on your computer, you can simply run `docker-compose up` on this `docker-compose.yml` file:

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
