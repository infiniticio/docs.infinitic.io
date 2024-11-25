---
title: Storage
description: 
---

Storage is used to store the state of the workflow, the relationship between workflow instances and tags, and task instances and tags.

Here are the different minimal configurations for the databases. Look at the builders' methods for more details.

## Redis

Using a builder:

{% codes %}

```java
StorageConfig storageConfig = RedisStorageConfig.builder()
  .setHost("localhost")
  .setUsername("redis")
  .setPassword("********")
  .setPort(6379)
  .build();
```

```kotlin
val storageConfig = RedisStorageConfig.builder()
  .setHost("localhost")
  .setPort(6379)
  .setUsername("redis")
  .setPassword("********")
  .build();
``` 

{% /codes %}

Or using a YAML configuration:

```yaml
storage:
  redis:
    host: localhost
    port: 6379
    username: redis
    password: myRedisPassword
```

## Postgres

Using a builder:

{% codes %}

```java
StorageConfig storageConfig = PostgresStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .build();
```

```kotlin
val storageConfig = PostgresStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .build()
``` 

Or using a YAML configuration:

```yaml
storage:
  postgres:
    host: localhost
    port: 5432
    username: postgres
    password: myPostgresPassword
```

{% /codes %}

## MySQL

Using a builder:

{% codes %}

```java
StorageConfig storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(3306)
  .setUsername("root")
  .setPassword("********")
  .build();
```

```kotlin
val storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(3306)
  .setUsername("root")
  .setPassword("********")
  .build();
``` 

{% /codes %}

Or using a YAML configuration:

```yaml
storage:
  mysql:
    host: localhost
    port: 3306
    username: root
    password: myMysqlPassword
```

## In Memory

Using a builder:

{% codes %}

```java
StorageConfig storageConfig = InMemoryConfig();
```

```kotlin
val storageConfig = InMemoryConfig();
``` 

{% /codes %}

Or using a YAML configuration:

```yaml
storage:
  inMemory: 
```

{% callout type="warning" %}

This storage should only be used for testing purposes, as it does not persist any data.

{% /callout %}
