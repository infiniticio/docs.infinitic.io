---
title: Implementing Dynamic Workflows
description: Learn how to implement dynamic workflows that can be easily modified without coding, enabling business agility and rapid process adaptation.
---

The ability to define workflows dynamically through a configuration file, or a user interface can become a game-changer for businesses seeking agility and rapid process adaptation,  

Consider practical applications like:
* A human resources department creating custom onboarding workflows that can be adjusted for different roles or departments without involving IT
* Customer service teams designing dynamic support escalation paths that can be refined based on changing business rules
* Supply chain managers building adaptive procurement workflows that can be quickly modified to respond to market changes
* Marketing teams creating personalized campaign approval processes that can be tailored to different product lines or regions

This approach democratizes workflow design, breaking down the traditional barriers between technical and non-technical teams. By enabling dynamic workflow definition through a user-friendly interface, organizations can achieve unprecedented flexibility, reducing dependency on developers for every process modification and empowering business users to optimize their own operational processes.

While Infinitic doesn't provide a built-in DSL interpreter, it offers powerful primitives that make it straightforward to build one.

The key idea is to:
1. Define your workflow logic in a DSL format (like JSON or YAML)
2. Create an interpreter workflow that reads and executes this DSL
3. Use Infinitic's core features like task dispatching, parallel execution, and error handling to implement the DSL commands

## How To Define Dynamic Workflows

Dynamic workflows can be defined using a domain-specific language (DSL) specified in formats like JSON or YAML. While you can create your own custom DSL format, there are also established standards available like the [serverless workflow DSL](https://github.com/serverlessworkflow/specification/blob/main/dsl.md) that provide open (but not stable yet) workflow definition capabilities.

The DSL acts as a configuration layer that describes the workflow's structure, logic, and behavior. This separation of workflow definition from implementation allows workflows to be modified without changing code.

Here's an example workflow definition using a YAML-based DSL:

```yaml
document:
  dsl: '1.0.0-alpha5'
  namespace: test
  name: fork-example
  version: '0.1.0'
do:
  - raiseAlarm:
      fork:
        compete: true
        branches:
          - callNurse:
              call: http
              with:
                method: put
                endpoint: https://fake-hospital.com/api/v3/alert/nurses
                body:
                  patientId: ${ .patient.fullName }
                  room: ${ .room.number }
          - callDoctor:
              call: http
              with:
                method: put
                endpoint: https://fake-hospital.com/api/v3/alert/doctor
                body:
                  patientId: ${ .patient.fullName }
                  room: ${ .room.number }
```

The advantages of using such a DSL format include:
* Simplified workflow creation through an intuitive UI
* Increased accessibility for non-technical users to design workflows
* Enhanced participation of non-technical teams

## How To Run a DSL With Infinitic

Although Infinitic does not offer a pre-built implementation for dynamic workflows, it does provide the necessary building blocks to facilitate their execution.

To run dynamic workflows, you will need to develop a workflow that functions as a DSL interpreter:

{% codes %}

```java
import io.infinitic.workflows.Workflow;

public class DynamicWorkflowImpl extends Workflow implements DynamicWorkflow {
    @Override
    public Void run(String dsl, String input) {
       // Interpreter implementation
    }
}
```

```kotlin
import io.infinitic.workflows.Workflow

class DynamicWorkflowImpl : Workflow(), DynamicWorkflow {
    override fun run(dsl: String, input: String) {
       // Interpreter implementation
    }
}
```

{% /codes %}

This workflow will interpret and execute the DSL through these steps:

1. Parse the input data:
   * Convert the `dsl` string into a structured JSON object that can be traversed
   * Parse the `input` string into a JSON object containing the input variables

2. Create an interpreter that walks through the DSL nodes:
   * Start at the root node and process each command sequentially
   * For each command node, determine its type (e.g. `http`, `fork`, `parallel`)
   * Execute the appropriate logic based on the command type

3. Handle different command types - for example:
   * For `http` commands:
     ```yaml
     - callNurse:
         call: http
         with:
           method: put
           endpoint: https://fake-hospital.com/api/v3/alert/nurses
     ```
     The interpreter would trigger a Service that performs the actual HTTP request with the specified parameters

   * For `fork` commands:
     ```yaml
     fork:
       branches:
         - callNurse
         - callDoctor
     ```
     The interpreter would:
     - Create a deferred task for each branch using Infinitic's task dispatching
     - Use Infinitic's [`and()`](/docs/workflows/deferred#combining-deferred) to wait for all branches to complete
     - Or use [`or()`](/docs/workflows/deferred#combining-deferred) to wait for any branch to complete

4. Handle variable substitution:
   * Replace variables like `${ .patient.fullName }` with actual values from the input data
   * Validate that all required variables are present

This approach allows the execution of multiple workflow definitions using the same interpreter. Additionally, it's a flexible system allowing for the definition of new workflow patterns within the DSL by extending the interpreter code. 
