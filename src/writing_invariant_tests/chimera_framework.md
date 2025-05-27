# Chimera Framework

The Chimera framework lets you run invariant tests with Echidna and Medusa that can be easily debugged using Foundry. 

The framework is made up of the following files:
- `Setup.sol`
- `TargetFunctions.sol`
- `Properties.sol`
- `CryticToFoundry.sol`
- `BeforeAfter.sol`
- `CryticTester.sol`

When you build your handlers using Recon these files get automatically generated and populated for you. To use the framework in your project, you just need to download these files that get generated for you and add the [Chimera dependency](https://github.com/Recon-Fuzz/chimera) to your project: 

```bash
forge install Recon-Fuzz/chimera
```

## The Contracts 

We'll now look at the role each of the above contracts serve in building an extensible and maintainable fuzzing suite. We'll be looking at examples using the [create-chimera-app](https://github.com/Recon-Fuzz/create-chimera-app/tree/main) template project. 

### `Setup`

This contract is used to deploy and initialize the state of your target contracts. It's called by the fuzzer before any of the target functions are called. 

Any contracts you want to track in your fuzzing suite should live here.

In our `create-chimera-app` template project, the `Setup` contract is used to deploy the `Counter` contract:

```solidity
abstract contract Setup is BaseSetup {
    Counter counter;

    function setup() internal virtual override {
        counter = new Counter();
    }
}
```

### `TargetFunctions`

This is perhaps the most important file in your fuzzing suite, it defines the target [function handlers](../using_recon/building_handlers.md#what-are-handlers) that will be called by the fuzzer to manipulate the state of your target contracts. 

**Note: These are the _only_ functions that will be called by the fuzzer**. 

Because these functions have the aim of changing the state of the target contract, they usually only include non-view and non-pure functions. 

Target functions make calls to the target contracts deployed in the `Setup` contract. The handler that wraps the target function allows you to add clamping (reducing the possible fuzzed input values) before the call to the target contract and properties (assertions about the state of the target contract) after the call to the target contract. 

In our `create-chimera-app` template project, the `TargetFunctions` contract is used to define the `increment` and `setNumber` functions:

```solidity
abstract contract TargetFunctions is
    BaseTargetFunctions,
    Properties
{
    function counter_increment() public {
        counter.increment();
    }

    function counter_setNumber1(uint256 newNumber) public {
        // clamping can be added here before the call to the target contract
        // ex: newNumber = newNumber % 100;

        // example assertion test replicating testFuzz_SetNumber
        try counter.setNumber(newNumber) {
            if (newNumber != 0) {
                t(counter.number() == newNumber, "number != newNumber");
            }
        } catch {
            t(false, "setNumber reverts");
        }
    }

    function counter_setNumber2(uint256 newNumber) public {
        // same example assertion test as counter_setNumber1 using ghost variables
        __before();

        counter.setNumber(newNumber);

        __after();

        if (newNumber != 0) {
            t(_after.counter_number == newNumber, "number != newNumber");
        }
    }
}
```

### `Properties`

This contract is used to define the properties that will be checked after the target functions are called. 

At Recon our preference is to define these as Echidna/Medusa assertion properties but they can also be defined as [boolean properties](https://secure-contracts.com/program-analysis/echidna/basic/testing-modes.html#boolean-properties).

In our `create-chimera-app` template project, the `Properties` contract is used to define a property that states that the number can never be 0:

```solidity
abstract contract Properties is BeforeAfter, Asserts {
    // example property test
    function invariant_number_never_zero() public {
        t(counter.number() != 0, "number is 0");
    }
}
```

### `CryticToFoundry`

This contract is used to debug broken properties by converting the breaking call sequence from Echidna/Medusa into a Foundry unit test. When running jobs on Recon this is done automatically for all broken properties using the fuzzer logs. 

If you are running the fuzzers locally you can use the [Echidna](https://getrecon.xyz/tools/echidna) and [Medusa](https://getrecon.xyz/tools/medusa) tools on Recon to convert the breaking call sequence from the logs into a Foundry unit test. 

This contract is also useful for debugging issues related to the `setup` function and allows testing individual handlers in isolation to verify if they're working as expected for specific inputs.

In our `create-chimera-app` template project, the `CryticToFoundry` contract doesn't include any reproducer tests because all the properties pass. 

The `test_crytic` function demonstrates the template for adding a reproducer test:

```solidity
contract CryticToFoundry is Test, TargetFunctions, FoundryAsserts {
    function setUp() public {
        setup();

        targetContract(address(counter));
    }

    function test_crytic() public {
        // TODO: add failing property tests here for debugging
    }
}
```

### `BeforeAfter`

This contract is used to store the state of the target contract before and after the target functions are called in a `Vars` struct. 

These variables can be used in property definitions to check if function calls have modified the state of the target contract in an unexpected way.

In our `create-chimera-app` template project, the `BeforeAfter` contract is used to track the `counter_number` variable:

```solidity
// ghost variables for tracking state variable values before and after function calls
abstract contract BeforeAfter is Setup {
    struct Vars {
        uint256 counter_number;
    }

    Vars internal _before;
    Vars internal _after;

    function __before() internal {
        _before.counter_number = counter.number();
    }

    function __after() internal {
        _after.counter_number = counter.number();
    }
}
```

### `CryticTester`

This is the entrypoint for the fuzzer into the suite. All target functions will be called on an instance of this contract since it inherits from the `TargetFunctions` contract.

In our `create-chimera-app` template project, the `CryticTester` contract is used to call the `counter_increment` and `counter_setNumber1` functions:

```solidity
// echidna . --contract CryticTester --config echidna.yaml
// medusa fuzz
contract CryticTester is TargetFunctions, CryticAsserts {
    constructor() payable {
        setup();
    }
}
```

## Assertions 

When using assertions from Chimera in your properties, they use a different interface than the standard assertions from foundry's `forge-std`.

The following assertions are available in Chimera's `Asserts` contract:

```solidity
abstract contract Asserts {
    // greater than
    function gt(uint256 a, uint256 b, string memory reason) internal virtual;

    // greater than or equal to
    function gte(uint256 a, uint256 b, string memory reason) internal virtual;

    // less than
    function lt(uint256 a, uint256 b, string memory reason) internal virtual;

    // less than or equal to
    function lte(uint256 a, uint256 b, string memory reason) internal virtual;

    // equal to
    function eq(uint256 a, uint256 b, string memory reason) internal virtual;

    // true
    function t(bool b, string memory reason) internal virtual;

    // between uint256
    function between(uint256 value, uint256 low, uint256 high) internal virtual returns (uint256);

    // between int256
    function between(int256 value, int256 low, int256 high) internal virtual returns (int256);

    // precondition
    function precondition(bool p) internal virtual;
}
```