# The Chimera Roadmap

Chimera is just a few lines of code, and a lot of best practices wrapped into an invariant testing framework.

When you decide to build a Chimera-based invariant suite, you're helping us build the tech of the future that will help you do your work faster.

## Create Chimera App
[Create chimera app](../oss/create_chimera_app.md) is the simplest example of using the Chimera Framework.

It's currently in its second iteration and it's the most verbose it will ever be. Our goal with create chimera app 3 is to have developers exclusively write properties and doomsday handlers.

Here's the progress we've made on our roadmap with Create Chimera App:

- [X] Enforce using a `TargetFunctions` contract as a means to explore state
- [X] Create managers to generalize dynamic config and deployments
- [X] Standardize the usage of simple target function handlers and use clamped handlers as a superset of them

Here's where we're going with create chimera app 3:

- [ ] Using Template types to be able to support any form of Managers
- [ ] Refine the usage of `GhostVariables` vs the role of inlining checks, especially with respect to inductive simplifications
- [ ] Use formal methods to generate automatic clamps for target functions
- [ ] Use formal methods, and target functions directly in a fuzzer to abstract them away
- [ ] Convert all fuzzing to concolic / category-based to check one concrete path by a candidate only once (and then optimize the result later)