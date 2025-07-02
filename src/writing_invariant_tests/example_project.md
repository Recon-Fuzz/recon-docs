
# Introduction

In this section, we'll use the [Create Chimera App](../oss/create_chimera_app.md) template to create a simple contract and run invariant tests on it.

## Getting started

Clone the [create-chimera-app-no-boilerplate](https://github.com/Recon-Fuzz/create-chimera-app-no-boilerplate) repo.

Or 

Use `forge init --template https://github.com/Recon-Fuzz/create-chimera-app-no-boilerplate`

## Writing the contract

First, in the `src/` directory we'll create a simple `Points` contract that allows users to make a deposit and earn points proportional to the amount of time that they've deposited for, where longer deposits equal more points:

```solidity

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {MockERC20} from "@recon/MockERC20.sol";

contract Points {
    mapping (address => uint256) depositAmount;
    mapping (address => uint256) depositTime;

    MockERC20 public token;

    constructor(address _token) {
        token = MockERC20(_token);
    }

    function deposit(uint256 amt) external {
        depositAmount[msg.sender] += amt;
        depositTime[msg.sender] = block.timestamp;

        token.transferFrom(msg.sender, address(this), amt);
    }

    function power() external view returns (uint256) {
        return depositAmount[msg.sender] * (block.timestamp - depositTime[msg.sender]);
    }
}
    
```

## Adding to `Setup`

Now with a contract that we can test, we just have to deploy it in the `Setup` contract:

```solidity
abstract contract Setup is BaseSetup, ActorManager, AssetManager, Utils {
    Points points;

    /// === Setup === ///
    function setup() internal virtual override {
        _newAsset(18); // deploys an 18 decimal token

        // Deploy Points contract
        points = new Points(_getAsset()); // uses the asset deployed above and managed by the AssetManager

        // Mints the deployed asset to all actors and sets max allowances for the points contract
        address[] memory approvalArray = new address[](1);
        approvalArray[0] = address(points);
        _finalizeAssetDeployment(_getActors(), approvalArray, type(uint88).max);
    }

    /// === MODIFIERS === ///
    modifier asAdmin {
        vm.prank(address(this));
        _;
    }

    modifier asActor {
        vm.prank(address(_getActor()));
        _;
    }
}
```

The [AssetManager](../oss/setup_helpers.md#assetmanager) allows us to add assets that we can use in our deployed contract with simplified fetching of the currently set asset using `_getAsset()`. We then use the `_finalizeAssetDeployment` utility function provided by the `AssetManager` to approve the deployed asset for all actors (tracked in the [ActorManager](../oss/setup_helpers.md#actormanager)) to the `Points` contract.

## Running the fuzzer

We can now run the fuzzer with no state exploration since we haven't added [handler](../using_recon/building_handlers.md#what-are-handlers) functions.

Before we run the fuzzer however we'll use Foundry to check that the project compiles correctly because it provides faster feedback for.

Running `forge build` we see that it compiles successfully, meaning the deployment in the `Setup` contract is working.

We can now run the [Medusa](https://github.com/crytic/medusa) fuzzer using `medusa fuzz`, which gives us the following output:

```bash
medusa fuzz
⇾ Reading the configuration file at: /temp/example-recon/medusa.json
⇾ Compiling targets with crytic-compile
⇾ Running command:
crytic-compile . --export-format solc --foundry-compile-all
⇾ Finished compiling targets in 5s
⇾ No Slither cached results found at slither_results.json
⇾ Running Slither:
slither . --ignore-compile --print echidna --json -
⇾ Finished running Slither in 7s
⇾ Initializing corpus
⇾ Setting up test chain
⇾ Finished setting up test chain
⇾ Fuzzing with 16 workers
⇾ [NOT STARTED] Assertion Test: CryticTester.switch_asset(uint256)
⇾ [NOT STARTED] Assertion Test: CryticTester.add_new_asset(uint8)
⇾ fuzz: elapsed: 0s, calls: 0 (0/sec), seq/s: 0, branches hit: 289, corpus: 0, failures: 0/0, gas/s: 0
⇾ [NOT STARTED] Assertion Test: CryticTester.asset_approve(address,uint128)
⇾ [NOT STARTED] Assertion Test: CryticTester.asset_mint(address,uint128)
⇾ [NOT STARTED] Assertion Test: CryticTester.switchActor(uint256)
⇾ fuzz: elapsed: 3s, calls: 70172 (23389/sec), seq/s: 230, branches hit: 481, corpus: 126, failures: 0/692, gas/s: 8560148887
⇾ fuzz: elapsed: 6s, calls: 141341 (236
```

You can now stop medusa with `CTRL + C`.

At this point, we expect almost no lines to be covered (indicated by the `corpus` value in the console logs). We can note that because the `corpus` value is nonzero, something is being covered, in our case this is the only exposed functions in the [`ManagerTargets`](../oss/setup_helpers.md) which provide handlers for the functions in the `AssetManager` and `ActorManager`.

We can now open the coverage report located at `/medusa/coverage/coverage_report.html` to confirm that none of the lines in the `Points` contract are actually being covered.

In our coverage report a line highlighted in green means the line was hit, a line highlighted in red means the line was not hit.

**TODO: update this image** 
![Medusa Coverage](../images/sample_project/medusa_coverage.png)

Let's rectify the lack of coverage in our `Points` contract by adding target function handlers.

## Building target functions

Foundry produces an `/out` folder any time you compile your project which contains the ABI of the `Points` contract.

We'll use this in conjunction with our [Invariants builder](../free_recon_tools/builder.md) to quickly generate target function handlers for our `TargetFunctions` contract using the following steps:
1. Open `out/Points.sol/Points.json`
2. Copy the entire contents
3. Navigate to the <a href="https://getrecon.xyz/tools/sandbox" target="_blank" rel="noopener noreferrer">Invariants Builder</a>
4. Paste the ABI
5. Rename the contract to `points` replacing the text in the "Your_contract" form field

This generates a `TargetFunctions` contract for `Points`. In our case we'll first just add the handler created for the `deposit` function:

![Target Function For Points](../images/sample_project/points_targets.png)

For this case you can just copy the `points_deposit` handler into your `TargetFunctions.sol` contract. When working on a larger project however you can use the _Download All Files_ button to add these directly into your project.

Make sure to add the `updateGhosts` and `asActor` modifiers to the `points_deposit` function if they are not present:
- `updateGhosts` - will update all ghost variables before and after the call to the function
- `asActor` - will ensure that the call is made by the currently active actor (returned by `_getActor()`)

Your `TargetFunctions` contract should now look like:

```solidity
abstract contract TargetFunctions is
    AdminTargets,
    DoomsdayTargets,
    ManagersTargets
{
    function points_deposit(uint256 amt) public updateGhosts asActor {
        points.deposit(amt);
    }
}
```

We can now run Medusa again to see how our newly added target function has changed our coverage. The coverage report is effectively our eyes into what the fuzzer is doing.

**TODO: update this image**
![Better Coverage](../images/sample_project/medusa_better_coverage.png)

We now see that the `deposit` function is fully covered, but the `power` function is not since we haven't added a handler for it. Since the power function is non-state-changing (indicated by the `view` decorator) we'll leave it without a handler for now as it won't affect our ability to test properties.

We can now start defining properties to see if there are any edge cases in our `Points` contract that we may not have expected.

## Checking for overflow

Reverts are not detected by default by Medusa and Echidna, so to explicitly test for this we can use a try catch in our `DoomsdayTargets` contract (this contract is meant for us to define things that should never happen in the system):

```solidity
...

abstract contract DoomsdayTargets is
    BaseTargetFunctions,
    Properties
{
    /// Makes a handler have no side effects
    /// The fuzzer will call this and because it reverts it will be removed from call sequences during shrinking
    modifier stateless() {
        _;
        revert("stateless");
    }

    function doomsday_deposit_revert(uint256 amt) public stateless asActor {
        try points.deposit(amt) {
            // success
        } catch (bytes memory err) {
            expectedError = checkError(err, Panic.arithmeticPanic); // catches the specific revert we're interested in
            t(!expectedError, "should never revert due to under/overflow");
        }
    }
}
```
> we use the `checkError` function from the [Utils](../oss/setup_helpers.md#utils) contract to allow us to check for a particular rever message

The handler `doomsday_deposit_revert` is what we call a doomsday test, a property that should never fail as a failure indicates the system breaking in some way.

We use the `stateless` modifier so that state changes made by this function call aren't preserved because they make the same changes as the `points_deposit` function. Not having two handlers that make the same state changes makes it easier to debug when we have a broken call sequence because we can easily tell what the `points_deposit` function does but it's not as clear from the name what the `doomsday_deposit_revert` does. This ensures that the `doomsday_deposit_revert` only gets executed as a test in a call sequence for specific behavior that should never happen. 

This pattern is very useful if you want to perform extremely specific tests that would make your code more complex.

If we now run `medusa fuzz` we should get a broken property!

## Debugging broken properties

The Chimera Framework is extremely opinionated, because we believe that reading Medusa and Echdina traces is a very slow and difficult way to debug broken properties.

That's why all of our templates come with the ability to reproduce broken properties as unit tests in Foundry.

So instead of debugging our broken property from the Medusa logs directly, we'll use Foundry:
1. Copy the Medusa output logs in your terminal
2. Go to the [Medusa Log Scraper](https://getrecon.xyz/tools/medusa) tool
3. Paste the logs
4. A reproducer unit test will be created for the broken property automatically
5. Click the dropdown arrow to show the unit test
6. Disable the `vm.prank` cheatcode by clicking the button (as we're overriding Medusa's behavior)
7. Click on the clipboard icon to copy the reproducer 

![Medusa Repro](../images/sample_project/medusa_repro.png)

8. Go to `CryticToFoundry.sol` 
9. Paste the reproducer unit test
10. Run it with Foundry using the `forge test --match-test test_doomsday_deposit_revert_0 -vvv` command in the comment above it

```solidity
// forge test --match-contract CryticToFoundry -vv
contract CryticToFoundry is Test, TargetFunctions, FoundryAsserts {
    function setUp() public {
        setup();
    }

    // forge test --match-test test_doomsday_deposit_revert_0 -vvv 
    function test_doomsday_deposit_revert_0() public {
        vm.roll(20125);
        vm.warp(424303);
        points_deposit(47847039802010376432191764575089043774271359955637698993445805766260571833418);
        
        vm.roll(51974);
        vm.warp(542538);
        doomsday_deposit_revert(71706648638691613974674094072029978422499381042277843030097252733530259068757);
    }
}
```

We now have a Foundry reproducer! This makes it much easier to debug because we can quickly test just the call sequence that causes the property to break and add logging statements wherever needed.

## Testing for monotonicity

We can say that the `Points` contract's `power` should be monotonically increasing since there's no way to withdraw.

Let's prove this with a global property and ghost variables.

To keep things simple, let's we'll just test this property on the current actor (handled by the [`ActorManager`](../oss/setup_helpers.md#actormanager)).

Next go to the `BeforeAfter` contract and add a way to fetch the `power` for the deposited user before and after each call to the target function:

```solidity
abstract contract BeforeAfter is Setup {
    struct Vars {
        uint256 power;
    }

    Vars internal _before;
    Vars internal _after;

    modifier updateGhosts {
        __before();
        _;
        __after();
    }

    function __before() internal {
        _before.power = points.power(_getActor());
    }

    function __after() internal {
        _after.power = points.power(_getActor());
    }
}
```

From this, we can specify the property in `Properties` contract:

```solidity
abstract contract Properties is BeforeAfter, Asserts {
    function property_powerIsMonotonic() public {
        gte(_after.power, _before.power, "property_powerIsMonotonic");
    }
}
```

We don't expect this property to break, but you should still run the fuzzer to check. And interestingly, the fuzzer breaks the property.

I'll leave it to you as an exercise to figure out why!