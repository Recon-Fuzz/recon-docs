# <a href="https://github.com/Recon-Fuzz/setup-helpers" target="_blank" rel="noopener noreferrer">Setup Helpers</a>

These contracts were created with the intention of speeding up the setup process for an invariant testing suite.

For an example implementation of these contracts in use see the [create-chimera-app](https://github.com/Recon-Fuzz/create-chimera-app) repo. 

## [ActorManager](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/ActorManager.sol)
The `ActorManager` contract serves as the source of truth for actors that are being used in the fuzzing suite setup. 

The primary functions of interest when setting up a suite are:
- `_addActor` - allows adding a new address as an actor that can be tracked
- `_switchActor` - this should be exposed in a target function that can be called by the fuzzer to randomly switch between actors

To use the actors stored in the ActorManager, add the `asActor` modifier on all of your target function handlers which pranks as the currently set actor. 

For privileged functions you can use the `asAdmin` modifier which calls the target functions as the tester contract (`address(this)`). The tester contract is typically set as the default admin address by convention. 

## [AssetManager](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/AssetManager.sol)

The `AssetManager` allows tracking all assets being used in the fuzz suite setup. 
Similar to the `ActorManager` this serves as the source of truth for all assets used in the test suite and therefore no target function should be called that may transfer an asset not tracked in the `AssetManager`. 

The primary functions of interest when setting up a suite are: 
- `_newAsset` - deploys an instance of the `MockERC20 `contract and adds it to tracking so it can be accessed as needed
- `_getAsset` - used to clamp values used for tokens in calls to target functions
- `_finalizeAssetDeployment` - a utility for minting tokens added via `_newAsset` to all actors that have been setup and approving it to all contracts in the the system that may need to call `transferFrom` on it

## [Utils](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/Utils.sol)
Provides utilities for invariant testing
- `checkError` - allows checking if a revert reason from a function call is equivalent to the reason passed in as the `expected` argument

The `checkError` function can take multiple string input types that may be thrown in the case of a function revert. 
- **error string** - the string in revert due to a require statement (ex: `"a does not equal b"` in `require(a == b, "a does not equal b")`)
- **custom error** - custom errors defined in a contract's interface (ex: `error CustomError()`, `error CustomErrorWithArgs(uint256 val)`); note that when passing in custom errors with arguments the argument name should be excluded (ex: `"CustomErrorWithArgs(uint256)"`)
- **panic reverts** - panic reverts for any of the reasons defined in the Solidity compiler [here](https://docs.soliditylang.org/en/latest/control-structures.html#panic-via-assert-and-error-via-require)

```javascript
    function counter_setNumber(uint256 newNumber) public updateGhosts asActor {
        try counter.setNumber(newNumber) {
            // passes
        } catch (bytes memory err) {
            bool expectedError;
            // checks for custom errors and panics
            expectedError = 
                checkError(err, "abc") || // error string from require statement
                checkError(err, "CustomError()") || // custom error
                checkError(err, Panic.arithmeticPanic); // compiler panic errors
            t(expectedError, "unexpected error");
        }
    }
```

## [Panic](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/Panic.sol)
A library that provides named variables corresponding to compiler panic messages. Used to more easily access these messages when using the `checkError` utility.

```javascript
library Panic {
    // compiler panics
    string constant assertionPanic = "Panic(1)";
    string constant arithmeticPanic = "Panic(17)";
    string constant divisionPanic = "Panic(18)";
    string constant enumPanic = "Panic(33)";
    string constant arrayPanic = "Panic(34)";
    string constant emptyArrayPanic = "Panic(49)";
    string constant outOfBoundsPanic = "Panic(50)";
    string constant memoryPanic = "Panic(65)";
    string constant functionPanic = "Panic(81)";
}
```

## [MockERC20](https://github.com/Recon-Fuzz/setup-helpers/blob/main/src/MockERC20.sol)
A minimal `MockERC20` contract that lets you mock any standard ERC20 tokens that will be interacting with the system without requiring external dependencies. 



