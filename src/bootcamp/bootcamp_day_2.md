# Multidimensional Invariant Tests

## Introduction and Goals

In [part 1](./bootcamp/bootcamp_day_1.md) we looked at how to create the setup and get high coverage, we're now going to look at how to achieve line coverage of the missing lines from part 1.

> You can follow along using the repo with the scaffolding created in part 1 [here](https://github.com/Recon-Fuzz/morpho-blue/tree/day-1).

In part 2 our goals are going to be to reach 100% line coverage on the Morpho repo and looking at ways to make our test suite capable of testing more possible setup configurations.

## How to Evaluate Coverage Reports

From part 1 our `MorphoTargets` contract should have two clamped handlers (`morpho_supply_clamped` and `morpho_supplyCollateral_clamped`) and the remaining functions should be unclamped. 

After having run Medusa with these functions implemented we should now see an increase in the coverage shown in our report. Medusa can then save these to the corpus which it can reuse for future runs, increasing its efficiency by not causing it to explore paths that are uninteresting. 

As we mentioned in part 1, the coverage report simply shows us which lines were successfully reached by highlighting them in green and shows which lines weren't reached by highlighting them in red:

**TODO: insert snapshot of latest coverage report**

Our approach for fixing coverage using the report will therefore consist of tracing lines that are green until we find a red line. The red line will then be an indicator of where the fuzzer was reverting. Once we find where a line is reverting we can then follow the steps outlined in part 1 where we create a unit test in the `CryticToFoundry` contract to determine why a line may always be reverting and introduce clamping or changes to the setup to allow us to reach the given line.

## Coverage Analysis - Initial Results

After having run Medusa for 10-15 minutes after adding the final changes from part 1 we can see that the coverage report shows coverage on the `Morpho` contract of 77%:

![Coverage Percentage](../images/bootcamp/covg_percentage.png)

It's important to note that although we mentioned above that our goal is to reach 100% coverage, this doesn't mean we'll try to blindly reach 100% coverage over all of a contract's lines because there are almost always certain functions whose behavior won't be of interest in an invariant testing scenario, like the `extSloads` function from the latest run:

![ExtSload Missing Covg](../images/bootcamp/ext_sload_missing_covg.png)

Since this is a view function which doesn't change state we can safely say that covering it is unnecessary for our case. 

> You should always use your knowledge of the system to make a judgement call about which functions in the system you can safely ignore coverage on. The functions that you choose to include should be those that test meaningful interactions including public/external functions, as well as the internal functions they call in their control flow.

In our case for `Morpho` we can say that for us to have 100% coverage we need to have covered the meaningful interactions a user could have with the contract which include borrowing, liquidating, etc..

When we look at coverage over the `liquidate` function, we can see that it appears to be reverting at the line that checks if the position is healthy: 

**TODO: add image of missing coverage in liquidate**
![Liquidate Missing Coverage]()

Meaning we need to investigate this with a Foundry unit test to understand what's causing it to always revert. 

We can also see that the `repay` function similarly has only red lines after line 288, indicating that something may be causing it to always underflow: 

**TODO: add image of missing coverage in repay**
![Repay Underflow Coverage]() 

However, note that the return value isn't highlighted at all, potentially indicating that there might also be an issue with the coverage displaying mechanism, so our approach to debugging this will be different, using a canary property instead.

## Debugging With Canaries

We'll start with debugging the `repay` function using a canary because it's relatively simpler. To do so we can create a simple boolean variable `hasRepaid` which we add to our `Setup` contract and set in our `morpho_repay` handler function:

```javascript
abstract contract MorphoTargets is
    BaseTargetFunctions,
    Properties
{
    function morpho_repay(uint256 assets, uint256 shares, address onBehalf, bytes memory data) public asActor {
        morpho.repay(marketParams, assets, shares, onBehalf, data);
        hasRepaid = true;
    }
}
```

This will therefore only set `hasRepaid` to true if the call to `Morpho::repay` completes successfully.

Then we can define a simple canary property in our `Properties` contract:

```javascript
abstract contract Properties is BeforeAfter, Asserts {

    function canary_hasRepaid() public returns (bool) {
        t(!hasRepaid, "hasRepaid");
    }
    
}
```

this uses the `t` (true) assertion wrapper from the [`Asserts`](./writing_invariant_tests/chimera_framework.md) contract to let us know if the call to `morpho.repay` successfully completes by forcing an assertion failure if `hasRepaid = true` (remember that only assertion failures are picked up by Echidna and Medusa). 

This function will randomly be called by the the fuzzer in the same way that the handler functions in `TargetFunctions` are called, allowing it to check if repay is called successfully after any of the state changing target function calls.

> Note: While you're implementing the canary above you can run the fuzzer in the background to confirm that we're not simply missing coverage because of a lack of sufficient tests. It's always beneficial to have the fuzzer running in the background because it'll build up a corpus that will make subsequent runs more efficient. 

As a general naming convention for functions in our suites, we use an underscore as a prefix to define what the function does, such as `canary_`, `invariant_`, `property_` or target contracts (`morpho_` in our case) then use camel case for the function name itself. 

> See [this section](../writing_invariant_tests/implementing_properties.md#testing-mode) to better understand why we prefer to express properties using assertions rather than as boolean properties.

We can now run Medusa in the background to determine if we're actually reaching coverage over the `repay` function using the canary we've implemented while implementing our Foundry test to investigate the coverage issue with the `liquidate` function. 

## Investigating Liquidation Handler with Foundry

Now we'll use Foundry to investigate why the `liquidate` function isn't being fully covered. We can do this by expanding upon the `test_crytic` function we used in part 1 to run sanity tests with.

To test if we can liquidate a user we'll just expand the existing test by setting the price to a very low value that should make the user liquidatable: 

```javascript
    function test_crytic() public {
        morpho_supply_clamped(1e18);
        morpho_supplyCollateral_clamped(1e18);

        oracle_setPrice(1e30);

        morpho_borrow(1e6, 0, _getActor(), _getActor());

        oracle_setPrice(0);

        // Note: we liquidate ourselves and pass in the amount of assets borrowed as the seizedAssets and 0 for the repaidShares for simplicity
        morpho_liquidate(_getActor(), 1e6, 0, "");
    }
```

After running the test we get the following output:

```bash
    ├─ [22995] Morpho::liquidate(MarketParams({ loanToken: 0xc7183455a4C133Ae270771860664b6B7ec320bB1, collateralToken: 0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9, oracle: 0xF62849F9A0B5Bf2913b396098F7c7019b51A820a, irm: 0x2e234DAe75C793f67A35089C9d99245E1C58470b, lltv: 800000000000000000 [8e17] }), CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 1000000 [1e6], 0, 0x)
    │   ├─ [330] Morpho::_accrueInterest(<unknown>, <unknown>)
    │   │   └─ ← 
    │   ├─ [266] OracleMock::price() [staticcall]
    │   │   └─ ← [Return] 0
    │   ├─ [2585] Morpho::_isHealthy(<unknown>, <unknown>, 0x1B4D54357a97De46Aae0FBDfD649dD8190EF99Eb, 128)
    │   │   ├─ [356] SharesMathLib::toAssetsUp(1000000000000 [1e12], 1000000 [1e6], 1000000000000 [1e12])
    │   │   │   └─ ← 1000000 [1e6]
    │   │   ├─ [0] console::log("isHealthy", false) [staticcall]
    │   │   │   └─ ← [Stop]
    │   │   ├─ [0] console::log("collateralPrice", 0) [staticcall]
    │   │   │   └─ ← [Stop]
    │   │   └─ ← false
    │   ├─ [353] SharesMathLib::toSharesUp(1000000000000 [1e12], 1000000 [1e6], 0)
    │   │   └─ ← 0
    │   ├─ [356] SharesMathLib::toAssetsUp(1000000000000 [1e12], 1000000 [1e6], 0)
    │   │   └─ ← 0
    │   ├─ [198] UtilsLib::toUint128(0)
    │   │   └─ ← 0
    │   ├─ [198] UtilsLib::toUint128(0)
    │   │   └─ ← 0
    │   ├─ [198] UtilsLib::toUint128(1000000 [1e6])
    │   │   └─ ← 1000000 [1e6]
    │   ├─ [199] UtilsLib::toUint128(1000000 [1e6])
    │   │   └─ ← 1000000 [1e6]
    │   ├─ emit Liquidate(id: 0x5914fb876807b8cd7b8bc0c11b4d54357a97de46aae0fbdfd649dd8190ef99eb, caller: CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], borrower: CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], repaidAssets: 0, repaidShares: 0, seizedAssets: 1000000 [1e6], badDebtAssets: 0, badDebtShares: 0)
```

which indicates that we were able to successfully liquidate the user. This means that the fuzzer is theoretically able to achieve coverage over the entire `liquidate` function, it just hasn't yet because it hasn't found the right call sequence that allows it to pass the health check which verifies if a position is liquidatable which we saw from the coverage report above.

## Tool Sophistication Limitations

After having run Medusa with the canary property created for the `morpho_repay` function we can see that it also doesn't break the property, meaning that the repay function is never fully covered:

```bash
⇾ [PASSED] Assertion Test: CryticTester.add_new_asset(uint8)
⇾ [PASSED] Assertion Test: CryticTester.asset_approve(address,uint128)
⇾ [PASSED] Assertion Test: CryticTester.asset_mint(address,uint128)
⇾ [PASSED] Assertion Test: CryticTester.canary_hasRepaid() /// @audit this should have failed
⇾ [PASSED] Assertion Test: CryticTester.morpho_accrueInterest()
⇾ [PASSED] Assertion Test: CryticTester.morpho_borrow(uint256,uint256,address,address)
⇾ [PASSED] Assertion Test: CryticTester.morpho_createMarket()
⇾ [PASSED] Assertion Test: CryticTester.morpho_enableIrm(address)
⇾ [PASSED] Assertion Test: CryticTester.morpho_enableLltv(uint256)
⇾ [PASSED] Assertion Test: CryticTester.morpho_flashLoan(address,uint256,bytes)
⇾ [PASSED] Assertion Test: CryticTester.morpho_liquidate(address,uint256,uint256,bytes)
⇾ [PASSED] Assertion Test: CryticTester.morpho_repay(uint256,uint256,address,bytes)
⇾ [PASSED] Assertion Test: CryticTester.morpho_setAuthorization(address,bool)
⇾ [PASSED] Assertion Test: CryticTester.morpho_setAuthorizationWithSig((address,address,bool,uint256,uint256),(uint8,bytes32,bytes32))
⇾ [PASSED] Assertion Test: CryticTester.morpho_setFee(uint256)
⇾ [PASSED] Assertion Test: CryticTester.morpho_setFeeRecipient(address)
⇾ [PASSED] Assertion Test: CryticTester.morpho_setOwner(address)
⇾ [PASSED] Assertion Test: CryticTester.morpho_supply(uint256,uint256,address,bytes)
⇾ [PASSED] Assertion Test: CryticTester.morpho_supply_clamped(uint256)
⇾ [PASSED] Assertion Test: CryticTester.morpho_supplyCollateral(uint256,address,bytes)
⇾ [PASSED] Assertion Test: CryticTester.morpho_supplyCollateral_clamped(uint256)
⇾ [PASSED] Assertion Test: CryticTester.morpho_withdraw(uint256,uint256,address,address)
⇾ [PASSED] Assertion Test: CryticTester.morpho_withdrawCollateral(uint256,address,address)
⇾ [PASSED] Assertion Test: CryticTester.oracle_setPrice(uint256)
⇾ [PASSED] Assertion Test: CryticTester.switch_asset(uint256)
⇾ [PASSED] Assertion Test: CryticTester.switchActor(uint256)
⇾ Test summary: 26 test(s) passed, 0 test(s) failed
⇾ html report(s) saved to: medusa/coverage/coverage_report.html
⇾ lcov report(s) saved to: medusa/coverage/lcov.info
```

We can then similarly test this with our sanity test to see if the fuzzer can ever theoretically reach this state: 

```javascript
    function test_crytic() public {
        morpho_supply_clamped(1e18);
        morpho_supplyCollateral_clamped(1e18);

        oracle_setPrice(1e30);

        morpho_borrow(1e6, 0, _getActor(), _getActor());

        morpho_repay(1e6, 0, _getActor(), "");
    }
```

When we run the above test we see that this also passes: 

```bash
[PASS] test_crytic() (gas: 261997)
Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 7.43ms (1.18ms CPU time)

Ran 1 test suite in 149.79ms (7.43ms CPU time): 1 tests passed, 0 failed, 0 skipped (1 total tests)
```

Fundamentally the issue we're experiencing is because the fuzzer is fairly unsophisticated in its approach to finding the needed paths to reach the lines we're interested in so it often requires a significant amount of run time to achieve what to a human may be trivial to solve.

At this point we have two options since we know that these two functions can theoretically be covered with our current setup: we can either let the fuzzer run for an extended period of time and hope that it's long enough to reach these lines, or we can create clamped handlers which increase the likelihood that the fuzzer will cover these functions, we'll do the latter.

## Creating Clamped Handlers

As noted above it could simply be the case that for Medusa to reach full coverage on these functions takes an extended period of time (12-24 or more hours of continuously running). But often if you're just trying to get to full coverage and don't want to have to worry about having a corpus that needs to be delicately preserved in order to ensure you're always effectively testing, introducing clamped handlers can be a simple way to speed up the time to reaching full coverage while ensuring the test suite still explores all possible states.

We can create simple clamped handlers for `liquidate` and `repay` using the same approach from part 1:

```javascript
abstract contract MorphoTargets is
    BaseTargetFunctions,
    Properties
{
    function morpho_liquidate_clamped(uint256 seizedAssets, bytes memory data) public {
        morpho_liquidate(_getActor(), seizedAssets, 0, data);
    }

    function morpho_repay_clamped(uint256 assets) public {
        morpho_repay(assets, 0, _getActor(), hex"");
    }
}
```

this again ensures that the **clamped handler always calls the unclamped handler**, simplifying things when we add tracking variables to our unclamped handler and also still allowing the unclamped handler to explore states not reachable by the clamped handler. 

The utility `_getActor()` function lets us pass its return value directly to our clamped handler to restrict it to be called for actors in the set managed by `ActorManager`. Calls for addresses other than these are not interesting to us because they wouldn't have been able to successfully deposit into the system since only the actors in the `ActorManager` are minted tokens in our setup.

> Note: Clamping using the `_getActor()` function above in the call to `morpho_liquidate` would only result in self liquidations because the `asActor` modifier on the `morpho_liquidate` function would be called by the same actor. To allow liquidations by a different actor than the one being liquidated you could simply pass an entropy value to the clamped handler and us it to grab an actor from the array returned by `_getActors()`.

## Echidna Results and Workflow

After having run the suite a few times before creating this demo we found a few lines of `Morpho` that are particularly difficult to reach even after applying the clamping above and so would typically require a long duration run to ensure they get covered. 

More specifically, the following line in `Morpho` is difficult to reach because it requires a liquidation to occur on a user with 0 collateral value: 

```javascript
    function liquidate( ... ) external returns (uint256, uint256) {
        ... 

        /// @audit requires liquidating a position whose collateral is exactly 0
        if (position[id][borrower].collateral == 0) {
            badDebtShares = position[id][borrower].borrowShares;
            badDebtAssets = UtilsLib.min(
                market[id].totalBorrowAssets,
                badDebtShares.toAssetsUp(market[id].totalBorrowAssets, market[id].totalBorrowShares)
            );

            market[id].totalBorrowAssets -= badDebtAssets.toUint128();
            market[id].totalSupplyAssets -= badDebtAssets.toUint128();
            market[id].totalBorrowShares -= badDebtShares.toUint128();
            position[id][borrower].borrowShares = 0;
        }

        ...
    }
```

If we now add an additional canary to the `morpho_liquidate` function and run the fuzzer (Echidna this time to make sure it's not dependent on the existing Medusa corpus) we can see that pretty quickly both of our canaries break due to the clamping we added above:

**TODO: add breaking echidna call sequence**

Then with the breaking call sequence in hand we can stop the fuzzer (_cancel_ button in the Recon extension or `crtl + c` using the CLI) which will allow Echidna to take the very large call sequence and reduce it to the minimum calls required to break the property using shrinking:

**TODO: add logs of shrunken call sequence**

And once again if we've run Echidna using the Recon extension it will automatically generate Foundry reproducer unit tests for the breaking call sequences which get added to the `CryticToFoundry` contract.

**TODO: add images of shrunken repro unit tests**

Since these reproducers are for canary properties they just show us that using our clamped handlers the fuzzer has been able to find a call sequence that allows it to successfully call `repay` and `liquidate`.

## Remaining Coverage Issues

Now that we've confirmed that we have coverage over the two functions of interest that weren't previously getting covered, we can check the coverage report to see what remains uncovered: 

**TODO: insert screenshot of missed lines by echidna even after clamping**

This shows that even though we're getting coverage in the sense that we successfully call the function, we aren't getting full branch coverage for all the possible paths that can be taken within the function calls themselves as mentioned in the above section because certain lines are difficult for the fuzzer to reach with its standard approach. 

This means we can either add additional clamped handlers that increase the likelihood that we reach these branches or we can let the suite run for 24+ hours and there will be a higher likelihood that we reach coverage over these branches. 

We'll take the approach of adding additional clamped handlers in this case because the issue blocking coverage is relatively straightforward but when working with a more complex project it may make sense to just run a long duration job using something like the [Recon Cloud Runner](../using_recon/running_jobs.md).

## Creating Additional Clamped Handlers

We'll now add a clamped handler for liquidating shares (as we were previously only liquidating with assets):

```javascript
abstract contract MorphoTargets is
    BaseTargetFunctions,
    Properties
{
    ...

    function morpho_liquidate_assets(uint256 seizedAssets, bytes memory data) public {
        morpho_liquidate(_getActor(), seizedAssets, 0, data);
    }

    function morpho_liquidate_shares(uint256 shares, bytes memory data) public {
        morpho_liquidate(_getActor(), 0, seizedShares, data);
    }
}
```

Next we can create a shortcut handler which will peform more specific actions to liquidate an entire position:

```javascript
   function morpho_shortcut_liquidate_full() public {
        (, uint256 borrowedShares, ) = morpho.position(MarketParamsLib.id(marketParams), _getActor());
        morpho_liquidate(_getActor(), 0, borrowedShares, hex"");
    }
```

this makes it more likely that we will be able to reach a state where the user's collateral value will be 0, reaching the branch highlighted above.

We can then run Echidna again with a much higher likelihood of reaching the previously uncovered lines.

**TODO: add screenshot of echidna output after adding this**

## Dynamic Market Creation

With full coverage achieved over the functions of interest in our target contract we can now further analyze our existing setup and see where we could improve it. 

We can note that our statically deployed market which we previously added in the `setup` function only allowed us to test one market configuration which may prevent the fuzzer from finding interesting cases related to different market configurations: 

```javascript
abstract contract Setup is BaseSetup, ActorManager, AssetManager, Utils {
    ...
    
    /// === Setup === ///
    function setup() internal virtual override {
        ...

        address[] memory assets = _getAssets();
        marketParams = MarketParams({
            loanToken: assets[1],
            collateralToken: assets[0],
            oracle: address(oracle),
            irm: address(irm),
            lltv: 8e17
        });
        morpho.createMarket(marketParams);
    }
}
```

We can replace this with a dynamic function which takes fuzzed values and allows us to test the system with more possible configurations, adding a new dimensionality to our test suite. We'll add the following function to our `TargetFunctions` contract to allow us to do this:

```javascript
    function morpho_createMarket_clamped(uint8 index, uint256 lltv) public {
        address loanToken = _getAssets()[index % _getAssets().length];
        address collateralToken = _getAsset();

        marketParams = MarketParams({
            loanToken: loanToken,
            collateralToken: collateralToken,
            oracle: address(oracle),
            irm: address(irm),
            lltv: lltv
        });

        morpho_createMarket(marketParams);
    }
```

which just requires that we modify the original `morpho_createMarket` target function to receive a `_marketParams` argument:

```javascript
    function morpho_createMarket(MarketParams memory _marketParams) public asActor {
        morpho.createMarket(_marketParams);
    }
```

This allows us to introduce even more possible market configurations than just those using the tokens we deployed in the `Setup` because the fuzzer will also be able to call the `add_new_asset` function via the `ManagersTargets`:

```javascript
    function add_new_asset(uint8 decimals) public returns (address) {
        address newAsset = _newAsset(decimals);
        return newAsset;
    }
```

which deploys an additional asset with a random number of decimals. This can be particularly useful for testing low or high decimal precision tokens which can often reveal edge cases related to how they're handled in math operations. 

## Conclusion and Next Steps

We've looked at how we can scaffold a contract and get to 100% _meaningful_ coverage using Chimera and use the randomness of the fuzzer to test additional configuration parameters not possible with only a static setup. 

In part 3 we'll look at how we can further use Chimera for its most powerful ability to write and break properties with different tools.

If you'd like to see more examples of how to scaffold projects with Chimera checkout the following podcasts:
- [Fuzzing MicroStable with Echidna](https://www.youtube.com/watch?v=WYqyZG8itb0) | Alex & Shafu on Invariant Testing
- [Using Recon Pro to test invariants in the cloud](https://www.youtube.com/watch?v=cUAgLUra3Zw) | Alex & Austin Griffith

For some real-world examples checkout the following repos from Recon engagements:
- [eBTC BSM](https://github.com/ebtc-protocol/ebtc-bsm/tree/main/test/recon-core)
- [Nerite](https://github.com/Recon-Fuzz/nerite/tree/invariant-testing/contracts/test/recon)
- [Liquity Governance V2](https://github.com/liquity/V2-gov/tree/main/test/recon)

If you have any questions feel free to reach out to the Recon team in help channel of [our discord](https://discord.gg/aCZrCBZdFd). 