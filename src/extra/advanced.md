# Introduction

These are a few notes at the bleeding edge of using the Chimera framework.

Many of these are being used in our engagements, but we have yet to fully formalize them.

## Target Functions

For each contract, for each function, grab each input, and have the fuzzer generate said input.

Prank the current actor (if necessary)

Call the contract and function with the parameters.

### Clamping Target Functions

Clamped handlers must be a subset of all target functions.

They reduce the amount of inputs and add conditionality to call the unclamped handlers.

### Disabling Target Functions

It's completely fine to disable a target function.

As of now we either delete or comment on it, or you could add a `alwaysRevert` modifier that just reverts

### Conditional Disabling

You can set conditional disabling by creating a `bool constant FEATURE_ENABLED = bool(false)`

You can then go into the specific handlers and prefix the external call with:
```solidity
function handler(inputs...) public {
    require(FEATURE_ENABLED, "Feature Enabled");
}
```

This will allow you to use Dynamic Replacement to toggle the value on the run setup and effectively test both variants of the suite, without creating massive complications.

## Setup

A few rules we use in our engagements

- Estimating Interactions and Coverage
- Define programmatic deployments
- Figure out "implicit" clamping and base your properties on this

### Don't blindly trust the dev

At the beginning of an engagement, "the code is perfect"

Mostly because the developer understands the code better than you

Similarly, the tests and their setup may look great, but over time you may find out that's not the case.

It's always best to set the simplest setup possible, introducing complexity only as necessary.

Additionally, some methods of deployment or configurations may create issues with the fuzzer

Generally speaking, you're always better off starting from scratch, and only if you realize you're basically redoing the same thing, then use the Developer setup.

### Estimating Interactions and Coverage

The most important aspect of Invariant Testing is what you test.

This is implied by the relation between the Contracts and the Target Functions.

Some contracts, for example, an oracle, may be too complex to fully model (e.g. having to reach 3 signers quorum and updating)

In those cases, mocking is preferred.

Mocking is a destructive operation, it causes a loss of information.

But it's also a simplification of the real system, leading the tools to be a lot faster.

Overall you should be mindful of how the State is explored.

Based on these decisions you should decide if you want to lean into them or not.

e.g. donation tests only make sense if you track all token balances

Your handles can influence who receives donations.

Based on this your property will be very different.

### Programmatic Deployment

Most developers tend to write a "straightforward" deployment.

A specific contract, with some defaults, etc.

This can lead to missing a vast amount of possible states, some of which would be considered admin mistakes, others which would be considered meaningful.

Whenever you find yourself in such a scenario you should consider using a Programmatic Deployment.

Programmatic Deployments by definition make the fuzzer a lot slower, however, they turn simple suites into multi-dimensional ones.

This is because instead of testing "a token", you can test "many tokens"

We have pretty much standardized the usage of Programmatic Deployments through our work done with [Managers](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/AssetManager.sol)

Roughly speaking programmatic deployment consists of adding 4 functions:
- A `deployed` handler, which will deploy a new version of the target
- A `switchTo` handler, to change the current target being used (which allows writing simpler tests while having multi-dimensionality)
- A `getCurrent` internal function, to know which is the current active target (typically implied by a storage value)
- A `getAll` internal function, to retrieve all deployments, which can be used to make all properties "scale" in a multi-dimensional way

We're pretty confident in this pattern and believe you should be rolling your own Managers whenever you need to add multi-dimensionality

The day Solidity adds generics, we will have a more expressive way to handle them.

### Dealing with Implicit Clamping

Based on your deployments, config, and target functions some states will be possible and others won't be

This is a fairly under-discussed issue with all forms of testing and formal verification.

You can only test states that are feasible given your setup.

A contract fuzzer has a statistical likelihood of hitting all states.

A symbolic fuzzer should guarantee that they will hit those states, however, it may never terminate.

Anyhow, you should map out what behavior is possible and what's not possible.

Based on this you will be able to write properties.

These properties won't be necessarily "true", they will be true for the system you set

This tends to be why people miss bugs with fuzzing, as ultimately you can only detect what you test.

It's very important you keep a mental map of all possible states, and document them as well as the properties you're writing.

This implicit clamping can create a lot of false positives once a suite is changed to have different implicit clamping.

For this reason, you should document all properties and note what they assume.


## Ghost Variables

Ghost Variables are just a supporting tool to track state over time.

In general, you should add calls to your state variables only as necessary

Generally, avoid computation in them as you're asking the fuzzer to perform a bunch of operations you may not need in most loops of the fuzzer

Most importantly: Do NOT put any assertions in your ghost variables.

Similarly, avoid reverts at all costs.

A revert causes all operations to be undone, leaving the fuzzer with a blindspot.

Overcomplicating GhostVariables is a common mistake beginners make, this has the nasty side effect of making the coverage report look all green but can make testing for certain properties impossible since a revert will end execution.

### Grouping Function types

A good, first-principle-based pattern is the idea of grouping operations by their effects.

For example, you may have a bunch of deposit/mint operations that "add" and others that "remove"

For these, you can write an elegant:

```solidity

enum OpType {
    GENERIC,
    ADD,
    REMOVE
}

    modifier updateGhostsWithType(OpType op) {
 currentOperation = op;
        __before();
 _;
        __after();
 }
```

Which allows you to track what's the current operation

This will allow you to write very elegant properties.

## Inlined Fuzz Properties

Avoid repeating the same property in multiple places.

This massively de-optimizes the tool and is semantically a waste.

You're asking the fuzzer to break the property once and then to "not change the state" to break it in other places.

Repeated inline properties should be refactored to only be assessed once, either as inlined properties or as Ghost Variable Properties.

Whenever you're making a mess with inlined tests and ghost variables, consider making your handler `stateless`

A `stateless` handler will revert at the end.

Because of how to revert and assertions are handled this still counts for the coverage and still triggers assertion failures

## Exploring Rounding Errors

Give me a division line and a fuzz run long enough and I'll give you a crit.

- Start by using exact checks
- Change to Optimization
- Improve work and explore further

