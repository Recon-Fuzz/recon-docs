# Advanced Fuzzing Tips

This is a compilation of best practices that the Recon team has developed while using the [Chimera framework](src/tutorial/chimera_framework.md).

## Target Functions

For each contract you want to fuzz, select the state-changing functions (target functions) you want to include in your fuzzing suite. Wrap the function in a handler which passes in the input to the function call and allows the fuzzer to test random values. 

**TODO: add snippet of contract function and handler that wraps the function**

The easiest way to do this is with our [Invariants Builder](../free_recon_tools/builder.md) tool or with the [Recon Extension](../free_recon_tools/recon_extension.md) directly in your code editor.

By using the `asActor` or `asAdmin` modifiers in combination with an [Actor Manager](../oss/setup_helpers.md#actor-manager) with the target handler you can ensure efficient fuzzing by not wasting tests that should be executed only by an admin getting execute by a non-admin actor. These modifiers prank the call to the target contract as the given actor, ensuring that the call is made with the actor as the `msg.sender`

**TODO: add example of privileged function that should only be called by an admin and explain why it wouldn't get called if using asActor**

### Clamping Target Functions

Clamping reduces the search space for the fuzzer, making it more likely that you'll explore interesting states in your system. 

Clamped handlers should be a subset of all target functions by calling the unclamped handlers with the reduced input space. 
This ensures that the fuzzer doesn't become overbiased and is prevented from exploring potentially interesting states and also ensures checks for inlined properties which are implemented in the unclamped handlers are always performed. 

**TODO: snippet of clamped and unclamped handler with inline property check**

### Disabling Target Functions

Certain state-changing function in your target contract may not actually explore interesting state or introduce so many false positives into properties being tested that it's better to ignore them. 
Doing so is perfectly okay even though it will reduce overall coverage of the targeted contracts. 

To make sure it's understood by others looking at the test suite that you purposefully meant to ignore a function we tend to prefer commenting out the handler or including a `alwaysRevert` modifier that causes the handler to revert every time it's called by the fuzzer.

**TODO: snippet of function that doesn't add interesting exploration like updateContract**

## Setup
This section covers a few rules we've come to follow in our engagements regarding setting up invariant testing suites. 

1. Create your own test setup
2. Estimating interactions and coverage
3. Define programmatic deployments
4. Figure out "implicit" clamping and base your properties on this

### Create Your Own Test Setup
If you're working on a codebase which you didn't originally develop, it's tempting to use the Foundry test setup that they've used for their unit tests, however this can lead to introducing any of the biases present in the existing setup into the invariant testing suite. 

We've found that it's best to create the simplest setup possible, where you only deploy the necessary contracts of interest and periphery contracts. 

Periphery contracts can also often be mocked (see [this section](../free_recon_tools/recon_extension.md#auto-mocking) on how to automatically generate mocks using the Recon Extension) if their behavior is irrelevant to the contracts of interest. 
This further reduces complexity, making the suite more easily understood by collaborators and making it more likely you will get full line coverage over the contracts of interest more quickly.

### State Exploration and Coverage

The most important aspect of invariant testing is what you actually test, and what you actually test is implied by the target functions you define in your test suite setup.

Some contracts, like oracles, may be too complex to fully model (e.g. having to reach 3 signers quorum and updating) because they would add overhead in terms of function handlers that require specific clamping and test suite setup. 

In these cases, mocking is preferred because it simplifies the process for the fuzzer to change return values (price in the case of the oracle example) or allow more straightforward interactions to be made by your targeted contracts (without requiring things like input validation on the mocked contract's side). 

Mocking is a destructive operation because it causes a loss of information, but the simplification it provides leads fuzzing and formal verification tools to explore possible system states much faster.

Adding additional handlers for things like token donations (transfering/minting tokens directly to one of your targeted contracts) can allow you to explore interesting states that otherwise wouldn't be possible if you only had handlers for your contracts of interest. 

### Programmatic Deployment

Most developers tend to write static deployments for their test suites where specific contract are deployed with some default values. 

However, this can lead to missing a vast amount of possible system states, some of which would be considered admin mistakes (because they're related to deployment configurations), others which could be considered meaningful because they're valid system configurations.

This is why we've tended to prefer using programmatic deployments because they allow us to use the randomness of the fuzzer to introduce randomness into the system configuration that's tested against. Although programmatic deployments make running a suite slower (because the fuzzer needs to find a valid deployment configuration before achieving meaningful coverage), they turn simple suites into multi-dimensional ones.

This is best understood with an example of a system made to accept multiple tokens. With a programmatic deployment, instead of testing an individual ERC20 token configuration (say with the standard 18 decimals), you can test many token configurations (say all tokens with 6-24 decimals) to ensure that your system works with all of them. 

We've standardized these ideas around programmatic deployments in our [Manager](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/AssetManager.sol) contracts. 

Programmatic deployment consists of adding 4 general function types:
- A `deploy` handler, which will deploy a new version of the target (e.g a token via [`_newAsset`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L45-L50) in the `AssetManager`)
- A `switchTo` handler, to change the current target being used (e.g the [`_switchAsset`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L74-L77) function in the `AssetManager`)
- A `getCurrent` internal function, to know which is the current active target (e.g the [`_getAsset`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L29-L35) function in the `AssetManager`)
- A `getAll` internal function, to retrieve all deployments (e.g the [`_getAssets`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L38-L40) function in the `AssetManager`)

Using the pattern of managers can help you add multi-dimensionality to your test setup and make tracking deployed components simpler. 

### Dealing with Implicit Clamping

Based on your deployments, configuration, and the target functions you expose some states will be possible and others won't be. This leads to what we call _implicit clamping_ as the states not allowed by your test suite setup will obviously not be tested. 

This makes it necessary therefore to map out what behavior is and isn't possible given your suite setup.

Based on this you can write properties that define what behaviors _should_ and _shouldn't_ be possible given your setup.
Checking these properties with fuzzing or formal verification won't necessarily prove they're always true, simply that they're true for the setup you've created.

You should document all possible states along with the properties to make it easier for yourself and collaborators to understand what's actually being tested.

This tends to be why people miss bugs with fuzzing, as ultimately you can only detect what you test and if your system is not configured so that it can reach a certain case, you won't ever be able to test against it.

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

