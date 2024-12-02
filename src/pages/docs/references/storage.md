---
title: Storage
description: 
---

Storage is used to store the state of the workflow, the relationship between workflow instances and tags, and task instances and tags.

Here are the different minimal configurations for the databases. Look at the builders' methods for more details.

## Redis

### Mandatory Parameters

- `host`: The hostname of the Redis server
- `port`: The port number the Redis server is listening on
- `username`: The username to connect to the Redis server
- `password`: The password to connect to the Redis server

Configuration using a builder:

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
  .build()
``` 

{% /codes %}

Configuration using a YAML configuration:

```yaml
storage:
  redis:
    host: localhost
    port: 6379
    username: redis
    password: ********
```

### Optional Parameters

If you need you can use the following optional parameters:
- `database`: The Redis database number to use
- `timeout`: Connection timeout in milliseconds
- `ssl`: Whether to use SSL/TLS for the connection
- `poolConfig`: Configuration for the Redis connection pool
  - `maxTotal` (default: -1): Maximum number of connections that can be allocated by the pool
  - `maxIdle` (default: 8): Maximum number of idle connections in the pool
  - `minIdle` (default: 0): Minimum number of idle connections to maintain in the pool

{% callout %}

Infinitic uses the [Jedis connection pool](https://github.com/redis/jedis) under the hood to manage database connections efficiently. If the optional parameters above are not specified, Jedis's default values will be used. You can refer to Jedis's documentation for more details about these parameters.

{% /callout %}

Configuration using a builder:

{% codes %}

```java
StorageConfig storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(6379)
  .setUsername("redis")
  .setPassword("********")
  .setDatabase(0)
  .setTimeout(2000)
  .setSsl(true)
  .setPoolConfig(
    PoolConfig.builder()
      .setMaxTotal(-1)
      .setMaxIdle(8)
      .setMinIdle(0)
      .build()
  )
  .build();
```

```kotlin
val storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(6379)
  .setUsername("redis")
  .setPassword("********")
  .setDatabase(0)
  .setTimeout(2000)
  .setSsl(true)
  .setPoolConfig(
    PoolConfig.builder()
      .setMaxTotal(-1)
      .setMaxIdle(8)
      .setMinIdle(0)
      .build()
  )
  .build()
``` 

{% /codes %}

Configuration using a YAML configuration:

```yaml
storage:
  mysql:
    host: localhost
    port: 6379
    username: redis
    password: ********
    database: 0
    timeout: 2000
    ssl: true
    poolConfig:
      maxTotal: -1
      maxIdle: 8
      minIdle: 0
```

## Postgres

### Mandatory Parameters

- `host`: The hostname of the Postgres server
- `port`: The port number the Postgres server is listening on
- `username`: The username to connect to the Postgres server
- `password`: The password to connect to the Postgres server

Configuration using a builder:

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

Configuration using a YAML configuration:

```yaml
storage:
  postgres:
    host: localhost
    port: 5432
    username: postgres
    password: ********
```

{% /codes %}

### Optional Parameters

If you need you can use the following optional parameters:
- `database` (default: "postgres"): The name of the database to use 
- `schema` (default: "infinitic"): The name of the schema to use 
- `keySetTable` (default: "key_set_storage"): The name of the table that stores key sets 
- `keyValueTable` (default: "key_value_storage"): The name of the table that stores key-value pairs 
- `maximumPoolSize`: Maximum size of the connection pool 
- `minimumIdle`: Minimum number of idle connections in the pool
- `idleTimeout`: Maximum amount of time in milliseconds that a connection can remain idle 
- `connectionTimeout`: Maximum time in milliseconds to wait for a connection from the pool 
- `maxLifetime`: Maximum lifetime of a connection in milliseconds

{% callout %}

Infinitic uses the [HikariCP connection pool](https://github.com/brettwooldridge/HikariCP) under the hood to manage database connections efficiently. If the optional parameters above are not specified, HikariCP's default values will be used. You can refer to HikariCP's documentation for more details about these parameters.

{% /callout %}

Configuration using a builder:

{% codes %}

```java
StorageConfig storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .setDatabase("postgres")
  .setSchema("infinitic")
  .setKeySetTable("key_set_storage")
  .setKeyValueTable("key_value_storage")
  .setMaximumPoolSize(10)
  .setMinimumIdle(10)
  .setIdleTimeout(600000L)
  .setConnectionTimeout(30000L)
  .setMaxLifeTime(1800000L)
  .build();
```

```kotlin
val storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(5432)
  .setUsername("postgres")
  .setPassword("********")
  .setDatabase("postgres")
  .setSchema("infinitic")
  .setKeySetTable("key_set_storage")
  .setKeyValueTable("key_value_storage")
  .setMaximumPoolSize(10)
  .setMinimumIdle(10)
  .setIdleTimeout(600000L)
  .setConnectionTimeout(30000L)
  .setMaxLifeTime(1800000L)
  .build()
``` 

{% /codes %}

Configuration using a YAML configuration:

```yaml
storage:
  postgres:
    host: localhost
    port: 5432
    username: postgres
    password: ********
    database: postgres
    schema: infinitic    
    keySetTable: key_set_storage
    keyValueTable: key_value_storage
    maximumPoolSize: 10
    minimumIdle: 10
    idleTimeout: 600000
    connectionTimeout: 30000
    maxLifetime: 1800000
```

## MySQL

### Mandatory Parameters

- `host`: The hostname of the MySQL server
- `port`: The port number the MySQL server is listening on
- `username`: The username to connect to the MySQL server
- `password`: The password to connect to the MySQL server

Configuration using a builder:

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
  .build()
``` 

{% /codes %}

Configuration using a YAML configuration:

```yaml
storage:
  mysql:
    host: localhost
    port: 3306
    username: root
    password: ********
```

### Optional Parameters

If you need you can use the following optional parameters:
- `database` (default: "infinitic"): The name of the database to use 
- `keySetTable` (default: "key_set_storage"): The name of the table that stores key sets 
- `keyValueTable` (default: "key_value_storage"): The name of the table that stores key-value pairs 
- `maximumPoolSize`: Maximum size of the connection pool 
- `minimumIdle`: Minimum number of idle connections in the pool
- `idleTimeout`: Maximum amount of time in milliseconds that a connection can remain idle 
- `connectionTimeout`: Maximum time in milliseconds to wait for a connection from the pool 
- `maxLifetime`: Maximum lifetime of a connection in milliseconds

{% callout %}

Infinitic uses the [HikariCP connection pool](https://github.com/brettwooldridge/HikariCP) under the hood to manage database connections efficiently. If the optional parameters above are not specified, HikariCP's default values will be used. You can refer to HikariCP's documentation for more details about these parameters.

{% /callout %}

Configuration using a builder:

{% codes %}

```java
StorageConfig storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(3306)
  .setUsername("root")
  .setPassword("********")
  .setDatabase("infinitic")
  .setKeySetTable("key_set_storage")
  .setKeyValueTable("key_value_storage")
  .setMaximumPoolSize(10)
  .setMinimumIdle(10)
  .setIdleTimeout(600000L)
  .setConnectionTimeout(30000L)
  .setMaxLifeTime(1800000L)
  .build();
```

```kotlin
val storageConfig = MySQLStorageConfig.builder()
  .setHost("localhost")
  .setPort(3306)
  .setUsername("root")
  .setPassword("********")
  .setDatabase("infinitic")
  .setKeySetTable("key_set_storage")
  .setKeyValueTable("key_value_storage")
  .setMaximumPoolSize(10)
  .setMinimumIdle(10)
  .setIdleTimeout(600000L)
  .setConnectionTimeout(30000L)
  .setMaxLifeTime(1800000L)
  .build()
``` 

{% /codes %}

Configuration using a YAML configuration:

```yaml
storage:
  mysql:
    host: localhost
    port: 3306
    username: root
    password: ********
    database: infinitic
    keySetTable: key_set_storage
    keyValueTable: key_value_storage
    maximumPoolSize: 10
    minimumIdle: 10
    idleTimeout: 600000
    connectionTimeout: 30000
    maxLifetime: 1800000
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
