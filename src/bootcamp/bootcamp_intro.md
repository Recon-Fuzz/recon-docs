# Bootcamp Introduction

This bootcamp is meant to take you from no knowledge of invariant testing to a point where you feel comfortable writing invariant tests to find bugs in a production system. Over the three parts of the bootcamp we'll cover the following:
- How to scaffold an invariant testing suite using the Recon extension
- How to create a simplified system setup for your invariant testing suite 
- How to achieve full coverage over the contracts of interest in your invariant suite
- How to implement properties to test with Foundry, Echidna, Medusa, Halmos and Kontrol
- How to debug broken properties

The following is a breakdown of each lesson for easier navigating:
1. [Part 1](./bootcamp/bootcamp_part_1.md) - scaffolding, setup and coverage
2. [Part 2](./bootcamp/bootcamp_part_2.md) - achieving full coverage and multidimensional testing 
3. Part 3 - **TODO: add description once section is complete**


Note that each part is cumulative, building off of the topics and code from the previous section so if it's your first time here it might be best to work through them in order. 

Each part uses the [Morpho repository](https://github.com/morpho-org/morpho-blue) as an example as it provides real-world complexity while still being sufficiently simple to create a simple test suite for it in a few hours. 

Below we cover some useful topics that can be helpful for beginners using fuzzing for invariant testing with the Chimera Framework for the first time. If you're already familiar with the Chimera Framework, skip ahead to the first section [here](./bootcamp/bootcamp_part_1.md). 

## What is fuzzing?

At Recon our preferred testing method is stateful fuzzing.

Stateful fuzzing allows us to manipulate the state of deployed contracts in a test environment by chaining randomized calls to [handler functions](../using_recon/building_handlers.md#what-are-handlers) into sequences. With the ability to manipulate the contract's state in all possible ways that a user might, we can then test an assertion that we make about the contract's state at any given point in time. 

Stateless fuzzing, in contrast, only calls an individual test function with random inputs and therefore limits the possible states that can be explored before making an assertion.

Since this isn't meant to be a full introduction to how fuzzing works (see the [Echidna documentation](https://secure-contracts.com/program-analysis/echidna/introduction/fuzzing-introduction.html) for that), for our use case in invariant testing you just need to understand that we're using a tool that **makes a randomized series of calls with random inputs which allows us to test an assertion**. 

## What is the Chimera Framework?

Now with a general understanding of how fuzzing works we can start to look at how the [Chimera Framework](../oss/chimera.md) works and see how we've used it to create our [Create Chimera App](../writing_invariant_tests/create_chimera_app.md) template. 

### The Core Concept

The Chimera Framework was created because typically if you wanted to write tests for [Foundry](https://getfoundry.sh/introduction/overview/), [Echidna](https://github.com/crytic/echidna), [Medusa](https://github.com/crytic/medusa), [Halmos](https://github.com/a16z/halmos) or [Kontrol](https://github.com/runtimeverification/kontrol) you'd need to use a different format for each. This meant you'd either have to maintain multiple test suites for each of these tools or find a way to stitch your test suite together so they all work. 

The Chimera Framework solves for running all these tools by giving you a scaffolding so you can just drop in your tests, written with the most familiar format provided by Foundry, and they automatically work with all of the above mentioned tools.

## The Four Phases of Invariant Testing

Invariant testing is unique in that it's a particularly labor intensive form of testing when you consider all the necessary aspects like scaffolding, setup, debugging, writing properties, etc.. This means there are more decisions to be made which can ultimately lead to fatigue and building a subpar suite. 

Below we've outlined the primary steps we've identified from multiple invariant testing engagements which should give you a step-by-step process to follow when building a suite to reduce decision making fatigue and allow you to do a better job.

We've developed this approach because ultimately, the time spent writing the test is a sunken cost. The primary value of invariant testing is in preventing bugs, so standardizing the way you setup and write tests is key if you don't want to waste time reinventing the wheel each time you're building a test suite. 

### Phase 1: Setup Phase
In this phase your only goal should be to deploy the contracts in a meaningful state.

### Phase 2: Coverage
The next phase is all about achieving line coverage over the contracts of interest that you're testing. This is key because without it you can define any number of properties but they'll be worthless because you won't be meaningfully testing them without actually reaching all possible states in your target system. 

### Phase 3: Write Properties
This phase is pretty straightforward, you define properties using your understanding of the system in English then translate them into implementations in Solidity.

### Phase 4: Iterate
The final phase is iteration, where you reflect on the properties and setup you've written and determine if there are further properties to be written or improvements to the setup be made. 

## The Philosophy of Testing

The key benefit of invariant testing is not necessarily the tests themselves but rather the ability that they give you to think about and test edge cases and your understanding of the system. 

If you can learn to think in invariants even while only manually reviewing contracts, this can lead you potentially exploit paths that may not have been considered. With an invariant suite in place you can then test these using tools that simulate how a user would interact with the system and have a greater likelihood of proving they either hold or don't. 

The Chimera Framework and the phases outlined above are our attempt to minimize the required low value thinking related to setting up the test suite to streamline the process and get you through achieving coverage and breaking properties as fast as possible.
