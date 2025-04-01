# Roadmap

This is the Chimera Roadmap

Chimera is just a few lines of code, and a lot of best practices

When you decide to build Chimera based invariant suite, you're helping us build the tech of the future that will help you do your work faster

Create Chimera App is the simplest example of using the Chimera Framework

It's currently in it's 2nd iteration and it's the most verbose it will ever be

Our goal with Create Chimera App 3 is to have most devs write exclusivelty properties and doomsday handlers

- [X] Enforce using TargetFunctions as a means to explore state
- [X] Create Managers to generalize dynamic config and deployments
- [ ] Wait for Solidity to add Templates to be able to support any form of Managers
- [ ] Refine the usage of GhostVariables vs the role of inlining checks, especially wrt Inductive Simplifications
- [X] Standardize the usage of simple Target Functions, use clamped handlers as a superset of them
- [ ] Use Formal Methods to generate automatic clamps for target functions
- [ ] Add the Formal Methods, and TargetFunctions to a Fuzzer as to abstract them away
- [ ] Convert all fuzzing to concolic / category based to check one concrete path by a candiate only once (and then optimize the result later)