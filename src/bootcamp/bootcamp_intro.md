# Bootcamp Introduction

## What is fuzzing?

Before we get into Chimera we need to understand what stateful fuzzing, our preferred testing method at Recon, is and how it works. 

In short stateful fuzzing allows us to manipulate the state of deployed contracts by making randomized call sequences to [handler functions](../using_recon/building_handlers.md#what-are-handlers). With the state manipulated we can then test an assertion that we make about the contract's state at any given point in time. This is in contrast to stateless fuzzing which only calls an individual test function with random inputs and therefore limits the possible state that's explored before making an assertion.

Since this isn't meant to be a full introduction to how fuzzing works (see the [Echidna documentation](https://secure-contracts.com/program-analysis/echidna/introduction/fuzzing-introduction.html) for that), for our use case you just need to understand that we're using a tool that makes a randomized series of calls with random inputs which allows us to test an assertion. 

## What is the Chimera Framework?

Now with a general understanding of how fuzzing works we can start to look at how the [Chimera Framework](../oss/chimera.md) works and see how we've used it to create our [Create Chimera App](../writing_invariant_tests/create_chimera_app.md) template. 

We'll also look at an example of how we can use Chimera to scaffold Morpho, a simple real-world contract that will allow us to understand how we can write invariant tests.

### The Core Concept

The key reason the Chimera Framework was created was because normally if you wanted to write tests for [Foundry](https://getfoundry.sh/introduction/overview/), [Echidna](https://github.com/crytic/echidna), [Medusa](https://github.com/crytic/medusa), [Halmos](https://github.com/a16z/halmos) or [Kontrol](https://github.com/runtimeverification/kontrol) you'd need to use a different format for each. This mean you'd either have to maintain multiple test suites to use each of these tools or find a way to stitch your test suite together so they all work. 

The Chimera Framework solves for running all these tools by giving you a scaffolding that resolves the process of stitching things together so you can just drop in your tests, written with the most familiar format provided by Foundry, and they automatically work with all of the above mentioned tools.

> In this first section we'll just be focused on understanding the Chimera Framework, for info on how to run each tool see the [Chimera](src/writing_invariant_tests/chimera_framework.md) page.

## The Four Phases of Invariant Testing

Before diving into the example we'll first look at some of the key points of how to best execute invariant testing that will help reduce decision-making fatigue and allow you to do a better job. These will provide the framework for each part of the bootcamp.

We've developed this approach because at the end of the day, the time spent writing the test is a sunken cost. The primary value of invariant testing is in preventing bugs, so standardizing the way you write tests is key if you don't want to waste time reinventing the wheel each time you're building a test suite. 

After looking at these different phases we'll get into scaffolding Morpho but you can skip ahead to the [Getting Started](#getting-started) section if you want to start right away.

### Phase 1: Setup Phase
In this phase your only goal should be to deploy the contracts in a meaningful state.

### Phase 2: Coverage
The next phase is all about achieving line coverage over the contracts of interest that you're testing. This is key because without it you can define any number of properties but they'll be worthless because you won't be meaningfully testing them without actually reaching all possible states in your target system. 

### Phase 3: Write Properties
This phase is pretty straightforward, you define properties using your understanding of the system in English then translate them into implementations in Solidity.

### Phase 4: Iterate
The final phase is iteration, where you reflect on the properties and setup you've written and determine if there are further properties to be written or improvements to be made. We'll see down below how the properties we can write are fundamentally limited by our system setup as using things like mocks can limit what we expect to be true about the system.

## The Philosophy of Testing

The key benefit of invariant testing is not necessarily the tests themselves but rather the ability that they give you to think about and test edge cases and your understanding of the system.

The Chimera framework is here to offload the required thinking related to setting up the test suite to help you streamline your process and get you through achieving coverage and breaking properties as soon as possible.

## Next Steps 

If you understand the above you're now ready to get started with [Day 1](./bootcamp_day_1.md) of the bootcamp.