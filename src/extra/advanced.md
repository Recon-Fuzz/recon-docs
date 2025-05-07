# Advanced Fuzzing Tips

This is a compilation of best practices that the Recon team has developed while using the [Chimera framework](src/tutorial/chimera_framework.md).

## Target Functions

For each contract you want to fuzz (your target contract), select the state-changing functions (target functions) you want to include in your fuzzing suite. Wrap the function in a handler which passes in the input to the function call and allows the fuzzer to test random values. 

```solidity
// contract to target
contract Counter {
       uint256 public number;

       function increment() public {
              number++;
       }
}

abstract contract TargetFunctions {
       // function handler that targets our contract of interest
       function counter_increment() public asActor {
              counter.increment();
       }
}
```

The easiest way to do this is with our [Invariants Builder](../free_recon_tools/builder.md) tool or with the [Recon Extension](../free_recon_tools/recon_extension.md) directly in your code editor.

By using the `asActor` or `asAdmin` modifiers in combination with an [Actor Manager](../oss/setup_helpers.md#actor-manager) ensures efficient fuzzing by not wasting tests that should be executed only by an admin getting executed by a non-admin actor. [These modifiers](https://github.com/Recon-Fuzz/create-chimera-app/blob/97036ad908633de6e59d576765a1b08b9e1ba6ff/test/recon/Setup.sol#L39-L47) prank the call to the target contract as the given actor, ensuring that the call is made with the actor as the `msg.sender`.

```solidity
// contract to target
contract Yield {
       address admin;
       uint256 yield;

       modifier onlyAdmin() {
              require(msg.sender == admin);
       }

       function resetYield(address _newAdmin) public onlyAdmin {
              yield = 0;
       }
}

abstract contract TargetFunctions {
       // calling this as an actor would waste fuzz calls because it would always revert so we use the asAdmin modifier
       function yield_resetYield() public asAdmin {
              yield.resetYield();
       }
}
```

### Clamping Target Functions

Clamping reduces the search space for the fuzzer, making it more likely that you'll explore interesting states in your system. 

Clamped handlers should be a subset of all target functions by calling the unclamped handlers with the clamped inputs. 
This ensures that the fuzzer doesn't become overbiased, preventing it from exploring potentially interesting states, and also ensures checks for inlined properties which are implemented in the unclamped handlers are always performed. 

```solidity

contract Counter {
    uint256 public number = 1;

    function setNumber(uint256 newNumber) public {
        if (newNumber != 0) {
            number = newNumber;
        }
    }
}

abstract contract TargetFunctions {
       function counter_setNumber(uint256 newNumber) public asActor {
              // unclamped handler explores the entire search space; allows the input to be 0
              counter.setNumber(newNumber);

              // inlined property check in the handler always gets executed
              if (newNumber != 0) {
                     t(counter.number == newNumber, "number != newNumber");
              }
       }

       function counter_setNumber_clamped(uint256 newNumber) public asActor {
              // clamping prevents the newNumber passed into setNumber from ever being 0
              newNumber = between(newNumber, 1, type(uint256).max);
              // clamped handler calls the unclamped handler
              counter_setNumber(newNumber);
       }
}
```

### Disabling Target Functions

Certain state-changing functions in your target contract may not actually explore interesting state transitions and therefore waste calls made by the fuzzer which is why our [ABI to invariants](../oss/abi_to_invariants.md) tool only scrapes functions from the targeted contract ABI that are non-view/pure. Other functions (generally admin privileged ones) introduce so many false positives into properties being tested (usually via things like contract upgrades or token sweeping functions) that it's better to ignore them. 
Doing so is perfectly okay even though it will reduce overall coverage of the targeted contracts. 

To make sure it's understood by others looking at the test suite that you purposefully meant to ignore a function we tend to prefer commenting out the handler or including a `alwaysRevert` modifier that causes the handler to revert every time it's called by the fuzzer.

## Setup
This section covers a few rules we've come to follow in our engagements regarding setting up invariant testing suites. 

1. Create your own test setup
2. Keep the story clean
2. State exploration and coverage
3. Programmatic deployment
4. Implicit clamping

### Create Your Own Test Setup
If you're working on a codebase which you didn't originally develop, it's tempting to use the Foundry test setup that the developers used for their unit tests, however this can lead to introducing any of the biases present in the existing setup into the invariant testing suite. 

We've found that it's best to create the simplest setup possible starting from scratch, where you only deploy the necessary contracts of interest and periphery contracts. 

Periphery contracts can also often be mocked (see [this section](../free_recon_tools/recon_extension.md#auto-mocking) on how to automatically generate mocks using the Recon Extension) if their behavior is irrelevant to the contracts of interest. 
This further reduces complexity, making the suite more easily understood by collaborators and making it more likely you'll get full line coverage over the contracts of interest more quickly.

### Keep The Story Clean 

We call the "story" the view of the state changes made by a given call sequence in a tester. By maintaining only one state-changing operation per target function handler, it makes it much simpler to understand what's happening within a call sequence when a tool generates a reproducer that breaks a property that you've defined. 

If you include multiple state-changing operations within a single handler it adds additional mental overhead when trying to debug a breaking call sequence because you not only need to identify which handler is the source of the issue, but the individual operation within the handler as well. 

Take the following example of handlers defined for an ERC4626 vault:
```solidity
       // having multiple state-changing operations in one handler makes it difficult to understand what's happening in the story
       function vault_deposit_and_redeem(uint256 assets) public asActor {
              uint256 sharesReceived = vault.deposit(assets);

              vault.redeem(sharesReceived);
       }

       // having separate target function handlers makes it easier to understand the logical flow that lead to a broken property in a reproducer call sequence
       function vault_deposit(uint256 assets) public asActor {
              uint256 sharesReceived = vault.deposit(assets);
       }

       function vault_redeem(uint256 assets) public asActor {
              uint256 sharesReceived = vault.deposit(assets);

              vault.redeem(sharesReceived);
       }
```
Although this is a simplified example we can see that maintaining separate handlers for each state-changing function makes our story much simpler to read. 

If you need to perform multiple state-changing operations to test a given property, consider making the function stateless as discussed in the [inlined fuzz properties](#inlined-fuzz-properties) section

### State Exploration and Coverage

The most important aspect of invariant testing is what you actually test, and what you actually test is implied by the target functions you define in your test suite setup.

Some contracts, like oracles, may be too complex to fully model (e.g. having to reach a quorom of 3 signers to update the price) because they would add overhead in terms of function handlers that require specific clamping and test suite setup. 

In these cases, mocking is preferred because it simplifies the process for the fuzzer to change return values (price in the case of the oracle example) or allow more straightforward interactions to be made by your targeted contracts (without requiring things like input validation on the mocked contract's side). 

Mocking is a destructive operation because it causes a loss of information, but the simplification it provides leads fuzzing and formal verification tools to explore possible system states much faster.

Adding additional handlers for things like token donations (transfering/minting tokens directly to one of your targeted contracts) can allow you to explore interesting states that otherwise wouldn't be possible if you only had handlers for your contracts of interest. 

### Programmatic Deployment

Most developers tend to write static deployments for their test suites where specific contract are deployed with some default values. 

However, this can lead to missing a vast amount of possible system states, some of which would be considered admin mistakes (because they're related to deployment configurations), others which are valid system configurations that are never tested with fixed deployment parameters.

This is why we now prefer using programmatic deployments because they allow us to use the randomness of the fuzzer to introduce randomness into the system configuration that's being tested against. Although programmatic deployments make running a suite slower (because the fuzzer needs to find a valid deployment configuration before achieving meaningful line coverage), they turn simple suites into multi-dimensional ones.

This is best understood with an example of a system designed to accept multiple tokens. With a static deployment you may end up testing tokens with 6 and 18 decimals (the two most common extremes). However, with a programmatic deployment, you can test many token configurations (say all tokens with 6-24 decimals) to ensure that your system works with all of them. 

We've standardized these ideas around programmatic deployments in our [Manager](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/AssetManager.sol) contracts. 

Programmatic deployment consists of adding 4 general function types:
- A `deploy` handler, which will deploy a new version of the target (e.g a token via [`_newAsset`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L45-L50) in the `AssetManager`)
- A `switchTo` handler, to change the current target being used (e.g the [`_switchAsset`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L74-L77) function in the `AssetManager`)
- A `getCurrent` internal function, to know which is the current active target (e.g the [`_getAsset`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L29-L35) function in the `AssetManager`)
- A `getAll` internal function, to retrieve all deployments (e.g the [`_getAssets`](https://github.com/Recon-Fuzz/setup-helpers/blob/9120629af5b6e8f22c78d596b1e1b00aac47bc5b/src/AssetManager.sol#L38-L40) function in the `AssetManager`)

Using the pattern of managers can help you add multi-dimensionality to your test setup and make tracking deployed components simpler. 

### Implicit Clamping

Based on your deployments, configuration, and the target functions you expose, a subset of all possible system states will be reachable. This leads to what we call _implicit clamping_ as the states not reachable by your test suite setup will obviously not be tested and therefore have a similar effect as if they were excluded via clamping. 

Mapping out what behavior is and isn't possible given your suite setup can therefore be helpful for understanding the limitations of your suite.

With these limitations outlined, you can write properties that define what behaviors _should_ and _shouldn't_ be possible given your setup.
Checking these properties with fuzzing or formal verification won't necessarily prove they're always true, simply that they're true for the setup you've created.

This tends to be the source of bugs that are missed with fuzzing, as ultimately you can only detect what you test and if your system isn't configured so that it can reach a certain state in which there's a bug, you won't ever be able to detect it.

## Ghost Variables

Ghost variables are a supporting tool that allow you to track system state over time. These can then be used in properties to check if the state has evolved as expected.

In the [Chimera Framework](../writing_invariant_tests/chimera_framework.md#beforeafter) we've concretized our prefered method of tracking ghost variables using a `BeforeAfter` contract which exposes an `updateGhosts` modifier that allows you to cache the system state before and after a call to a given target function.

As a rule of thumb it's best to avoid computation in your updates to the ghost variables as it ends up adding addtional operations that need to be performed for each call executed by the fuzzer, slowing down fuzzing efficiency.

> Do NOT put any assertions in your ghost variables and avoid any operation or call that may cause a revert. These cause all operations in the call sequence created by the fuzzer to be undone, leaving the fuzzer with a blindspot because it will be unable to reach certain valid states.

Overcomplicating ghost variables has the unfortunate side effect of making the coverage report look promising as it will show certain lines fully covered but in reality might be applying implicit clamping by causing reverts that prevent edge cases for certain properties being explored since an update that reverts before the property is checked will not generate a reproducer call sequence.

```solidity
contract Counter {
    uint256 public number = 1;

    function setNumber(uint256 newNumber) public {
        if (newNumber != 0) {
            number = newNumber;
        }
    }
}

abstract contract TargetFunctions {
       // updateGhosts updates the ghost variables before and after the call to the target function
       function counter_setNumber1(uint256 newNumber) public updateGhosts asActor {
              counter.setNumber(newNumber);
       }
}

abstract contract BeforeAfter is Setup {
    struct Vars {
       uint256 counter_difference;
       uint256 counter_number;
    }

    Vars internal _before;
    Vars internal _after;

    modifier updateGhosts {
       __before();
       _;
       __after();
    }

    function __before() internal {
       // this line would revert for any value where the number before < the new number
       _before.counter_difference = _before.counter_number - counter.number();
    }

    function __after() internal {
       _after.counter_difference = _before.counter_number - counter.number();
    }
}
```
In the above example we can see that the `__before()` function would revert for any values where the `newNumber` passed into `setNumber` is greater than the value stored in `_before.counter_number`. This would still allow the coverage report to show the function as covered however because for all `newNumber` values less than or equal to `_before.counter_number` the update would succeed. This means that fundamentally we'd be limiting the search space of the fuzzer, preventing it from exploring any call sequences where `newNumber` is greater than the value stored in `_before.counter_number` and potentially missing bugs because of it.

### Grouping Function Types

A simple pattern for grouping function types using ghost variables so they can easily be used as a precondition to a global property check is to group operations by their effects.

For example, you may have multiple deposit/mint operations that have the effect of "adding" and others of "removing".

You can group these effects using an enum type as follows:

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

modifier updateGhosts() {
       currentOperation = OpType.GENERIC;
       __before();
       _;
       __after();
}
```

And add the `updateGhostsWithType` modifier only to handlers which perform one of the operations of interest. All other handlers using the standard `updateGhosts` modifier will default to the `GENERIC` operation type so that you don't have to refactor any existing modifiers. 

Now with the ability to elegantly track the current operation you can easily use the operation type to write a global property for it like so:

```solidity
contract Counter {
       uint256 public number = 1;

       function increment() public {
              number++;
       }

       function decrement() public {
              number--;
       }
}

abstract contract TargetFunctions {
       // we set the respective operation type on our target function handlers
       function counter_increment() public updateGhostsWithType(OpType.INCREASE) asActor {
              counter.setNumber(newNumber);
       }

       function counter_increment() public updateGhostsWithType(OpType.DECREASE) asActor {
              counter.setNumber(newNumber);
       }
}

abstract contract BeforeAfter is Setup {
       enum OpType {
              INCREASE,
              DECREASE
       }

       struct Vars {
              uint256 counter_number;
       }

       Vars internal _before;
       Vars internal _after;

       modifier updateGhosts {
              __before();
              _;
              __after();
       }

       modifier updateGhostsWithType(OpType op) {
              currentOperation = op;
              __before();
              _;
              __after();
       }

       function __before() internal {
              _before.counter_number = counter.number();
       }

       function __after() internal {
              _after.counter_number = counter.number();
       }
}

abstract contract Properties is BeforeAfter, Asserts {
       function propert_number_decreases() public {
              // we can use the operation type as a precondition to a check in a global property
              if(currentOperation == OpType.DECREASE)
                     gte(_before.counter_number, _after.counter_number, "number does not decrease");
              }
       }
}
```


## Inlined Fuzz Properties

Inlined properties allow you to make an assertion about the system state immediately after a given state-changing target function call:

```solidity
contract Counter {
    uint256 public number = 1;

    function setNumber(uint256 newNumber) public {
       if (newNumber != 0) {
           number = newNumber;
       }
    }
}

abstract contract TargetFunctions
{
    function counter_setNumber(uint256 newNumber) public updateGhosts asActor {
       try counter.setNumber(newNumber) {
              // if the call to the target contract was successful, we make an assertion about the expected system state after
              if (newNumber != 0) {
                     t(counter.number() == newNumber, "number != newNumber");
              }
       }
    }
}
```

Repeating the same inlined property in multiple places should be avoided whenever possible.

Implementing the same inlined property in multiple places is essentially asking the fuzzer to break the property, not change the state (as an assertion failure prevents the call to the handler from completing), then to break the same property in a different way via another handler while already knowing that the property breaks. This is a waste of computational resources as you're asking the fuzzer to prove a fact that you already know instead of asking it to prove a new fact for which you're not sure if there's a proof (in the sense of a broken property, not a mathematical proof) or not.  

If you find yourself implementing the same inline property multiple times, you should refactor them to only be assessed in one handler or checked as a global property using ghost variables. 

If you can only implement a property as an inlined test but don't want multiple state changes to be maintained as it would make the story difficult to read, you can make your handler stateless using a `stateless` modifier. 

```solidity
modifier stateless() {
       _;
       // the revert is only made after the handler function execution completes
       revert("stateless")
}
```

This causes the handler to revert only at the end of execution, meaning any coverage exploration will be maintained and any assertion failures will happen before the revert.

## Exploring Rounding Errors

Fuzzing is a particularly useful technique for finding precision loss related issues, as highlighted by [@DevDacian](https://x.com/DevDacian) in [this](https://dacian.me/exploiting-precision-loss-via-fuzz-testing) blog post.

Simply put the approach for finding such issues is as follows. For any place where there is a division operation which you believe may lead to potential loss of precision:
- Start by using and exact check in a property assertion to check if the return value of a variable/function is as expected.
- Run the fuzzer and allow it to find a case where the return value is not what's expected via a falsified assertion.
- Create an [Echidna optimization test](https://secure-contracts.com/program-analysis/echidna/advanced/optimization_mode.html?highlight=optimization#optimizing-with-echidna) to increase the difference with the expected value. 

The results of the optimization run will allow you to determine the severity of any potential precision loss and how it may be used as part of an exploit path. 

