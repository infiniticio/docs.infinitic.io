---
title: Interfaces as Contracts
description: Explore how Infinitic leverages Java interfaces as contracts in event-driven systems, simplifying development by automating event management, serialization, and routing. Learn the benefits of this approach for building scalable, maintainable, and type-safe distributed applications.
---

When using Infinitic, all communications are done through messages. But contrary to the usual way we build event-driven systems, you don't have to define events, their structure, or how they flow through your system.

**Infinitic uses Java interfaces to define the contract between services and their consumers**. These Java interfaces describe all public methods and their parameters, establishing a clear API for interaction.

Here's how Infinitic makes building event-driven applications more straightforward:

1. **No Need to Define Events**: In traditional event-driven systems, you'd need to define various events, their structures, and how they flow through your system. With Infinitic, you don't have to worry about this. The framework automatically handles event creation and management based on your service interfaces.

2. **No Schema Management**: Infinitic eliminates the need for manual schema definition and maintenance. Infinitic manages that for you and ensures backward compatibility with extensive testing.

3. **Serialization and Deserialization Handled**: You don't have to write code to serialize your data into events or deserialize events back into data. Infinitic takes care of this process, seamlessly converting your method calls and their parameters into events, and vice versa.

4. **No Need to Build Events**: Based on the Java interface you provide, Infinitic creates stubs that convert method calls to events.

5. **Automatic Event Routing**: You don't need to set up event routing or configure message queues. Infinitic handles the routing of events to the appropriate services based on your interface definitions.

6. **Built-in Error Handling and Retries**: Infinitic provides robust error handling and retry mechanisms out of the box, reducing the amount of boilerplate code you need to write for handling failures in your event-driven system.

7. **No Need to Learn Pulsar Specifics**: Infinitic abstracts away the complexities of working directly with Pulsar. You don't need to learn how to implement consumers or producers, understand topic configurations, or manage partitioning strategies. Infinitic removes the need for developers to become experts in specific event broker technologies


By abstracting these complexities, Infinitic allows you to focus on writing your core business logic rather than spending time on the intricacies of event-driven architecture. 

This approach provides several additional benefits:

* **Contract Enforcement**: The interface ensures that the Service implementation adheres to the agreed-upon contract, reducing the risk of breaking changes that could affect consumers.

* **Documentation**: The interface serves as a form of documentation, clearly outlining the available operations and their expected inputs and outputs.

* **Type Safety**: By using strongly-typed interfaces, you get compile-time checks, reducing runtime errors and improving overall code reliability.

* **IDE Support**: Interfaces enable better IDE support, including auto-completion and refactoring tools, which can significantly improve developer productivity.

* **Testability**: Interfaces make it easier to create mock objects for testing, allowing you to isolate and test individual components of your system more effectively.

{% callout type="note"  %}

To promote accessibility and reuse, Java interfaces (and the objects they contain) can be grouped in a common module shared across different teams. This approach facilitates clear communication and collaboration between teams, as they can easily understand and use the services provided by other parts of the organization.

{% /callout  %}

