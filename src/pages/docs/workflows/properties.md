---
title: Properties
description: ""
---

It could be useful to expose public properties of our workflow. We will illustrate this with the small example of a very simple loyalty program:

{% codes %}

```java
public class LoyaltyImpl extends Workflow implements Loyalty {
    private final Integer weekInSeconds = 3600*24*7;

    private Integer points = 0;

    @Override
    public void start() {
        Instant now = inline(Instant::now);

        int w = 0;
        while (w < 56) {
            // every week, a new point is added
            w++;
            timer(now.plusSeconds(w * weekInSeconds)).await();
            points++;
        }
    }
}
```

```kotlin
class LoyaltyImpl : Workflow(), Loyalty {
    private val weekInSeconds = 3600*24*7;

    private var points = 0

    override fun start() {
        val now = inline { Instant.now() }

        var w = 0
        while (w < 56) {
            // every week, a new point is added
            w++
            timer(now.plusSeconds((w * weekInSeconds).toLong())).await()
            points++
        }
    }
}
```

{% /codes %}

The workflow above basically increment a `points` counter every week for a year. Note how easy it is to code it using Infinitic!

Now, we will see:

- how to know the current values of `points`
- how to add bonus points for exceptional events

## Getting workflow properties

To get the current values of `points`, we only need to add a getter to it in the workflow interface
(in Kotlin, we only need to set `points` as public to create the corresponding getter/setter):

{% codes %}

```java
public class LoyaltyImpl extends Workflow implements Loyalty {
    private Integer points = 0;

    @Override
    public Integer getPoints() {
        return points;
    }

    ...
}
```

```kotlin
class LoyaltyImpl : Workflow(), Loyalty {
    var points = 0

    ...
}
```

{% /codes %}

That's all we need, as a client (or another workflow) can now access the value of `points` by targeting the right workflow and synchrously running the getter method on it (as explained [here](workflows/parallel#parallel-methods)):

{% codes %}

```java
Loyalty loyalty = client.getWorkflowById(Loyalty.class, id);

Integer points = loyalty.getPoints();
```

```kotlin
val loyalty = client.getWorkflowById(Loyalty::class.java, id)

val points = loyalty.points
```

{% /codes %}

Of course, if needed, we can apply a similar technique for setters!

## Trigger action on a running workflow

Let's add a method adding points for exceptional events:

{% codes %}

```java
public class LoyaltyImpl extends Workflow implements Loyalty {
    ...

    @Override
    public void addBonus(BonusEvent event) {
        switch (event) {
            case REGISTRATION_COMPLETED:
                points+= 100;
                break;

            case FORM_COMPLETED:
                points+= 200;
                break;

            case ORDER_COMPLETED:
                points+= 500;
                break;
        }
    }

    ...
}
```

```kotlin
class LoyaltyImpl : Workflow(), Loyalty {
    ...

    override fun addBonus(event: BonusEvent) {
        points += when (event) {
            BonusEvent.REGISTRATION_COMPLETED -> 100
            BonusEvent.FORM_COMPLETED -> 200
            BonusEvent.ORDER_COMPLETED -> 500
        }
    }
}
```

{% /codes %}

That's basically all we need. Now, we can add bonus points from a client:

{% codes %}

```java
Loyalty loyalty = client.getWorkflowById(Loyalty.class, id);

client.dispatchVoid(loyalty::addBonus, BonusEvent.REGISTRATION_COMPLETED);
```

```kotlin
val loyalty = client.getWorkflowById(Loyalty::class.java, id)

client.dispatch(loyalty::addBonus, BonusEvent.REGISTRATION_COMPLETED)
```

{% /codes %}

or from another workflow:

{% codes %}

```java
Loyalty loyalty = getWorkflowById(Loyalty.class, id);

dispatchVoid(loyalty::addBonus, BonusEvent.REGISTRATION_COMPLETED);
```

```kotlin
val loyalty = getWorkflowById(Loyalty::class.java, id)

dispatch(loyalty::addBonus, BonusEvent.REGISTRATION_COMPLETED)
```

{% /codes %}

Of course, from there it's easy to enrich the workflow behavior, for example by adding actions when a user reaches different threshold points.
