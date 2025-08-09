# Bootcamp Introduction

This bootcamp is meant to take you from no knowledge of invariant testing to a point where you feel comfortable writing invariant tests to find bugs in a production system. 

The bootcamp is roughly inspired by the content covered by [Alex The Entrprenerd](https://x.com/GalloDaSballo) in the first three parts of the livestreamed version [here](https://getrecon.xyz/bootcamp).

Over the four parts of the bootcamp we'll cover the following:
- How to scaffold an invariant testing suite using the Recon extension.
- How to create a simplified system deployment for your invariant testing suite.
- How to achieve full coverage over the contracts of interest in your invariant suite.
- How to implement properties to test with Foundry, Echidna, Medusa, Halmos and Kontrol.
- How to debug broken properties.
- How to use Echidna's optimization mode to increase the impact of broken properties.

The following is a breakdown of each lesson for easier navigation:
1. [Part 1](./bootcamp_part_1.md) - scaffolding, setup and coverage
2. [Part 2](./bootcamp_part_2.md) - achieving full coverage and multidimensional testing 
3. [Part 3](./bootcamp_part_3.md) - writing, breaking and debugging properties
4. [Part 4](./bootcamp_part_4.md) - using optimization mode to increase the severity of broken properties


Note that each part is cumulative, building off of the topics and code from the previous section so if it's your first time here it might be best to work through them in order. 

Below we cover some useful topics that can be helpful for beginners using fuzzing for invariant testing with the Chimera Framework for the first time. If you're already familiar with the Chimera Framework, skip ahead to the first section [here](./bootcamp_part_1.md). 

## What are invariants? 

**Invariants** are defined as statements about a system that should _always_ hold true. 

**Properties** allow us to define invariants by outlining the behaviors that we expect in our system. In the context of testing we can say properties are logical statements about the system that we test after state-changing operations are made via a call to one of the target function [handlers](../using_recon/building_handlers.md#what-are-handlers). We can therefore specify properties of a system that should always hold true to define our invariants. 

We can use an ERC20 token as an example and define one property and one invariant for it:
- Property: a user’s balance should increase only after calls to the `transfer` and `mint` functions
- Invariant: the sum of user balances should never be greater than the `totalSupply`

We prefer to use the term properties throughout this bootcamp because it covers invariants as well as properties, since invariants are a subset of properties but properties are not a subset of invariants. So when we say invariant testing, we are really referring to using properties to test standalone properties as well as invariants.

## What is fuzzing?

At Recon our preferred testing method is stateful fuzzing so it's what we'll use for our examples throughout the bootcamp.

Stateful fuzzing allows us to manipulate the state of deployed contracts in a test environment by chaining randomized calls to [handler functions](../using_recon/building_handlers.md#what-are-handlers) into sequences. With the ability to manipulate the contract's state in all possible ways that a user might, we can then test an assertion that we make about the state of the system at any given point in time where the assertion is the property being tested. 

Stateless fuzzing, in contrast, only calls an individual test function with random inputs and therefore limits the possible states that can be explored before making an assertion.

For our use case of stateful fuzzing for invariant testing you just need to understand that the fuzzer **makes a randomized series of calls with random inputs which allows us to test an assertion**. 

> For a more complete introduction to how fuzzing works see the [Echidna documentation](https://secure-contracts.com/program-analysis/echidna/introduction/fuzzing-introduction.html) 

## What is the Chimera framework?

Now with a general understanding of how fuzzing works, we can look at how the [Chimera Framework](../oss/chimera.md) works. 

The Chimera Framework was created because previously, if you wanted to write tests for [Foundry](https://getfoundry.sh/introduction/overview/), [Echidna](https://github.com/crytic/echidna), [Medusa](https://github.com/crytic/medusa), [Halmos](https://github.com/a16z/halmos) or [Kontrol](https://github.com/runtimeverification/kontrol), you'd need to use a different format for each. This meant you'd either have to maintain multiple test suites for each of these tools or find a way to stitch your test suite together so they all work. 

The Chimera Framework solves for running all these tools by giving you a scaffolding so you can just drop in your tests, written with the most familiar format provided by Foundry, and they automatically work with all of the above-mentioned tools. 

When you use the [Recon extension](../free_recon_tools/recon_extension.md) or the [Builder](../using_recon/building_handlers.md) to scaffold your invariant testing suite, everything will be created with the Chimera framework already in place, so all you need to do is create a working setup and define properties to start testing.

## The four phases of invariant testing

Invariant testing is unique in that it's a particularly labor-intensive form of testing when you consider all the necessary aspects like scaffolding, setup, debugging, writing properties, etc. This means there are more decisions to be made, which can ultimately lead to fatigue and building a subpar suite if not carefully considered. 

Below we've outlined the primary steps we've identified from multiple invariant testing engagements, which should give you a step-by-step process to follow when building a suite to reduce decision-making fatigue and allow you to do a better job. We'll follow these steps throughout each part of the bootcamp.

### Phase 1: Setup phase
In this phase, your only goal should be to deploy the contracts in a meaningful state so that you can successfully run the fuzzer.

### Phase 2: Coverage
The coverage phase is about achieving line coverage over the contracts of interest that you're testing. This is key because without it, you can define any number of properties but they'll be worthless because you won't be meaningfully testing them without actually reaching all possible states in your target system. 

### Phase 3: Write properties
In this phase, you define properties using your understanding of the system in English, then translate them into implementations in Solidity.

### Phase 4: Iterate
The final phase is iteration, where you reflect on the properties and setup you've written and determine if there are further properties to be written or improvements to the setup to be made that can improve state exploration. 

## The philosophy of testing

The key benefit of invariant testing is not necessarily the tests themselves but rather the ability that they give you to think about and test edge cases and your understanding of the system. 

If you can learn to think in invariants even while only manually reviewing contracts, this can potentially lead you to exploit paths that may not have been considered. With an invariant suite in place you can then test these using tools that simulate how a user would interact with the system and have a greater likelihood of proving they either hold or don't. 

The Chimera framework and the phases outlined above are our attempt to minimize the required low-value thinking related to setting up the test suite to streamline the process and get you through achieving coverage and breaking properties as fast as possible.
