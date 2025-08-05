# Part 3 - Writing and Breaking Properties

## Introduction and Goals

In this section we'll get to the most valuable part of invariant testing: writing properties.

## Additional Points On Chimera Architecture

In part 1 and 2 we primarily looked at targets defined in the `MorphoTargets` contract but when we scaffold with the Recon extension you'll notice that we also get the `AdminTargets`, `DoomsdayTargets` and `ManagersTargets` generated automatically. We'll look at these more in depth below but before doing so here's a brief overview of each:

- `AdminTargets` - target functions that should only be called by a system admin (uses the `asAdmin` modifier to call as our admin actor)
- `DoomsdayTargets` - special tests with multiple state changing operations in which we add inlined assertions to test specific scenarios
- `ManagersTargets` - target functions that allow us to interact with any managers used in our system (`ActorManager` and `AssetManager` are added by default)

**TODO: determine if worth adding the context on before/after tracking if it's relevant, if not can just point users to book section**

In terms of ghost variables we're not going to look at them too much today but the current state of the art at least from my perspective is to track the current message.sig or to give an operation a specific type and that's going to allow you to specify constraints that only apply to specific before after scenarios. If you check some of our open source work such as the bsm for badger you'll see that we've used this technique which makes for very elegant properties.

## The Three Types of Properties

In terms of properties it's easy to get caught-up in the subtleties of the different types, but for this section we'll just stick with three general ideas for properties that will get you very far. We'll then see how these can lead you to uncovering a critical bug.

> If you do want to dive deeper into the subtleties of properties see [this](../writing_invariant_tests/implementing_properties.md) section.

### 1. Global Properties

The first broad category covers global properties which are tied to the global state of the system. This can be anything from the current state of the system or the value of some variable in the system.

Generally a good global property that can be defined in many systems is a solvency property. In this type of property we effectively ask the the token what the sum of its balances is and then we'll ask the system contract what it's internal balance is. Anytime the internal balance is higher than the actual balance (sum of token balances), we can therefore say that the system is insolvent.

So anytime you're thinking about these global interesting macro states, you want to think about either these one-by-one checks like balance versus internal balance, or perhaps an aggregated check like as the sum of all user balances versus sum of all internal balances.

### 2. State Changing Properties

State changing properties allow us to verify how a certain state changes. 

For example, we would verify that if we increase a balance on a vault, then our balance of the share token is increased by the correct amount. Similarly, we can check that if we try to withdraw we would want to get back the same amount. You might be surpised how many times these types of simple checks have lead to uncovering edge cases in private audits. 

### 3. Inline Fuzz Test (Avoid)

Inlined fuzz tests usually tends to be not particularly interesting in terms of finding edge cases as they often test behavior in a similar manner to stateless fuzz tests or unit tests. 

Because these are low value properties they should be avoided for higher value properties. Any time you end up writing inlined fuzz tests you should instead try to rewrite it as an inductive property where if you can prove that a single transition is valid you can then implicitly prove that the set of all transitions is valid. This increases the value of an inlined test because it allows us to prove more than just a single property and instead we can know about the set of all possible states.

An example was our engagement with Centrifuge in which we realized that since there were already global variables that track values of interest, we didn't need to add additional trackers to our test suite which we update inside our handlers. We can instead perform a global before/after check for calls by a given handler to confirm that the state variables change as expected.

**TODO: expand on the above or add a visual example because this one is hard to understand**

## Dealing With Complex Tests

If however you need to implement a more complex test that can't be implemented as a global test and requires state changing calls that would don't use the raw value passed in by the fuzzer, you can use the `stateless` modifier which reverts all state changes after the function call:

```javascript
    modifier stateless() {
        _;
        revert("stateless");
    }
```

This ensures that the actual state exploration done by the fuzzer is handled only by the clean target functions which call one state changing function at a time and have descriptive names. This approach keeps what we call the "story" clean when a property breaks because having each individual handler responsible for one change of state makes it easier to determine what's going on when looking at the reproducer unit test.

Adding the `stateless` modifier on the `DoomsdayTargets` allows testing for specific cases which would make multiple state changes or modify the input received in some way, such as withdrawing an entire user's `maxWithdraw` amount from a vault and determining if this sets the user's `maxWithdraw` to 0 after: 

```javascript
    function doomsday_maxWithdraw() public stateless {
        uint256 maxWithdrawBefore = vault.maxWithdraw(_getActor);

        vault.withdraw(amountToWithdraw, _getActor(), _getActor());

        uint256 maxWithdrawAfter = vault.maxWithdraw(_getActor);
        eq(maxWithdrawAfter, 0, "maxWithdraw after withdrawing all is nonzero");
    }
```

If our assertion fails we'll get a reproducer in which the function is the last one called, however if it doesn't the fuzzer will revert the state changes and the function that will be used for exploring withdrawals will be the primary withdrawal function.

## Practical Exercise: `RewardsManager`

**TODO: update the repo link to be one in Recon and without the intial scaffolding**
For our example we'll be looking at the `RewardsManager`, built by [Alex The Entreprenerd](https://x.com/GalloDaSballo) which you can find in [this repo](https://github.com/GalloDaSballo/RewardsManager-Invariants).

We'll use the Recon extension to add a Chimera scaffolding to the project like we did in part 1, then focus on how we can get full coverage and define meaningful properties to test. After scaffolding the `RewardsManager` we should have the following targets: 

```javascript
abstract contract RewardsManagerTargets is
    BaseTargetFunctions,
    Properties
{

    function rewardsManager_accrueUser(uint256 epochId, address vault, address user) public asActor {
        rewardsManager.accrueUser(epochId, vault, user);
    }

    function rewardsManager_accrueVault(uint256 epochId, address vault) public asActor {
        rewardsManager.accrueVault(epochId, vault);
    }

    function rewardsManager_addBulkRewards(uint256 epochStart, uint256 epochEnd, address vault, address token, uint256[] memory amounts) public asActor {
        rewardsManager.addBulkRewards(epochStart, epochEnd, vault, token, amounts);
    }

    function rewardsManager_addBulkRewardsLinearly(uint256 epochStart, uint256 epochEnd, address vault, address token, uint256 total) public asActor {
        rewardsManager.addBulkRewardsLinearly(epochStart, epochEnd, vault, token, total);
    }

    function rewardsManager_addReward(uint256 epochId, address vault, address token, uint256 amount) public asActor {
        rewardsManager.addReward(epochId, vault, token, amount);
    }

    function rewardsManager_claimBulkTokensOverMultipleEpochs(
        uint256 epochStart, 
        uint256 epochEnd, 
        address vault, 
        address[] memory tokens, 
        address user
    ) public asActor {
        rewardsManager.claimBulkTokensOverMultipleEpochs(epochStart, epochEnd, vault, tokens, user);
    }

    function rewardsManager_claimReward(uint256 epochId, address vault, address token, address user) public asActor {
        rewardsManager.claimReward(epochId, vault, token, user);
    }

    function rewardsManager_claimRewardEmitting(uint256 epochId, address vault, address token, address user) public asActor {
        rewardsManager.claimRewardEmitting(epochId, vault, token, user);
    }

    function rewardsManager_claimRewardReferenceEmitting(uint256 epochId, address vault, address token, address user) public asActor {
        rewardsManager.claimRewardReferenceEmitting(epochId, vault, token, user);
    }

    function rewardsManager_claimRewards(
        uint256[] memory epochsToClaim, 
        address[] memory vaults, 
        address[] memory tokens, 
        address[] memory users
    ) public asActor {
        rewardsManager.claimRewards(epochsToClaim, vaults, tokens, users);
    }

    function rewardsManager_notifyTransfer(address from, address to, uint256 amount) public asActor {
        rewardsManager.notifyTransfer(from, to, amount);
    }

    function rewardsManager_reap(RewardsManager.OptimizedClaimParams memory params) public asActor {
        rewardsManager.reap(params);
    }

    function rewardsManager_tear(RewardsManager.OptimizedClaimParams memory params) public asActor {
        rewardsManager.tear(params);
    }
}
```

Since the `RewardsManager` has no constructor arguments we can see that the project immediately compiles, letting us move onto the next step:

```bash
forge build
[⠊] Compiling...
[⠑] Compiling 56 files with Solc 0.8.24
[⠘] Solc 0.8.24 finished in 702.49ms
Compiler run successful!
```

## About the `RewardsManager` Contract

The `RewardsManager`, as the name implies, is meant to handle the accumulation and distribution of reward tokens for depositors into a system. Since token rewards are often used as an incentive for providing liquidity to protocols in which the liquidity is provided via vaults, this contract is meant to integrate with a vault via a notification system which is triggered by user actions in the vault.

The key function in the notification system is `notifyTransfer`:

```javascript
    function notifyTransfer(address from, address to, uint256 amount) external {
        require(from != to, "Cannot transfer to yourself");
        // NOTE: Anybody can call this because it's indexed by msg.sender
        // Vault is msg.sender, and msg.sender cost 1 less gas

        if (from == address(0)) {
            _handleDeposit(msg.sender, to, amount);
        } else if (to == address(0)) {
            _handleWithdrawal(msg.sender, from, amount);
        } else {
            _handleTransfer(msg.sender, from, to, amount);
        }

        emit Transfer(msg.sender, from, to, amount);
    }
```

which allows accruing rewards to a given user based on the action taken.

Looking at the `_handleDeposit` function more closely: 

```javascript
    function _handleDeposit(address vault, address to, uint256 amount) internal {
        uint256 cachedCurrentEpoch = currentEpoch();
        accrueUser(cachedCurrentEpoch, vault, to);
        // We have to accrue vault as totalSupply is gonna change
        accrueVault(cachedCurrentEpoch, vault);

        unchecked {
            // Add deposit data for user
            shares[cachedCurrentEpoch][vault][to] += amount;
        }
        // Add total shares for epoch // Remove unchecked per QSP-5
        totalSupply[cachedCurrentEpoch][vault] += amount;

    }
```

we can see that it accrues points to the user and the vault based on the time since the last accrual. It then increases the shares which determine a user's percentage of the total rewards that will be distributed as well as the total shares.

## Initial Property Outline

From the above function we can define our first property as "the `totalSupply` is the sum of user balances: 

```md
totalSupply == SUM(shares[vault][users])
```

> Note: because we're indexing by epoch, there's a possibility for this to break

## Setting Up Actors and Assets

Now to get started with improving our test setup we'll need to add actors and token deployments to the `setup` function:

```javascript
    function setup() internal virtual override {
        rewardsManager = new RewardsManager();

        // Add 3 additional actors (default actor is address(this))
        _addActor(address(0x411c3));
        _addActor(address(0xb0b));
        _addActor(address(0xc0ff3));

        // Deploy MockERC20 assets
        _newAsset(18);
        _newAsset(8);
        _newAsset(6);
    }
```

Note that in our use of the `ActorManager`, the default actor we use is `address(this)` which also serves as the "admin" actor which we use to call privileged functions via the `asAdmin` modifier.

We'll then use the CodeLense to change the modifier on the `rewardsManager_addBulkRewards`, `rewardsManager_addBulkRewardsLinearly`, `rewardsManager_addReward` and `rewardsManager_notifyTransfer` functions so they get called by the admin actors. We can then add these to the `AdminTargets` contract to clarify that these will only be expected to be called by the admin: 

```javascript
abstract contract AdminTargets is
    BaseTargetFunctions,
    Properties
{
    function rewardsManager_addBulkRewards(uint256 epochStart, uint256 epochEnd, address vault, address token, uint256[] memory amounts) public asAdmin {
        rewardsManager.addBulkRewards(epochStart, epochEnd, vault, token, amounts);
    }

    function rewardsManager_addBulkRewardsLinearly(uint256 epochStart, uint256 epochEnd, address vault, address token, uint256 total) public asAdmin {
        rewardsManager.addBulkRewardsLinearly(epochStart, epochEnd, vault, token, total);
    }

    function rewardsManager_addReward(uint256 epochId, address vault, address token, uint256 amount) public asAdmin {
        rewardsManager.addReward(epochId, vault, token, amount);
    }

    function rewardsManager_notifyTransfer(address from, address to, uint256 amount) public asAdmin {
        rewardsManager.notifyTransfer(from, to, amount);
    }
}
```

This then leaves our `RewardsManagerTargets` cleaner with all the ways to accrue in the `rewardsManager_accrueUser` and `rewardsManager_accrueVault` functions and the remaining functions allow claiming.

## Creating Clamped Handlers

From looking at our target functions we see there are 3 primary values that we'll need to clamp if we don't want the fuzzer to spend an inordinate amount of time exploring states that are irrelevant: 


```javascript
abstract contract RewardsManagerTargets is
    BaseTargetFunctions,
    Properties
{
    ...

    function rewardsManager_accrueUser(uint256 epochId, address vault, address user) public asActor {
        rewardsManager.accrueUser(epochId, vault, user);
    }
    
    ...

    function rewardsManager_claimRewardEmitting(uint256 epochId, address vault, address token, address user) public asActor {
        rewardsManager.claimRewardEmitting(epochId, vault, token, user);
    }

    ...
}
```

the primary values we'll need to clamp are: `address vault`, `address token` and `address user`. For the `vault` we'll use `address(this)`, the token is given by `_getAsset()` and the user by `_getActor()`.

We'll start off by only clamping the `claimReward` function because it should get us to a decent spot after our first run of the fuzzer: 

```javascript
abstract contract RewardsManagerTargets is
    BaseTargetFunctions,
    Properties
{
    function rewardsManager_claimReward_clamped(uint256 epochId) public asActor {
        rewardsManager_claimReward(epochId, address(this), _getAsset(), _getActor());
    }
}
```

We can then run Echidna in `exploration` mode to see how far the fuzzer gets: 

![Echidna Exploration Mode](../images/bootcamp/echidna_expl_mode.png)

## Writing the First Properties

Now with the fuzzer running in the background to explore state we'll take advantage of this down time to start implementing our first properties. 

In addition to the solvency property we outlined above we can also define a property that states that: "the sum of rewards are less than or equal to the reward token balance of the `RewardsManager`". 

Often it's good to write out properties as pseudo-code first because it allows us to understand which values we can read from state and which we'll need to add additional tracking for. In our case we need to know the sum of rewards of a user, which we can get from the **TODO: `rewardsInfo` looks like it's unused so probably changed later down below in actual implementation**. We can then write the following pseudocode to describe what we need our property to do:

```md
For each epoch, sum all rewards for `address(this)` (our placeholder for the vault)

Using the sum of the above, assert that `total <= token.balanceOf(rewardsManager)`
```

## Implementing the Total Supply Solvency Property

We can now implement the first property in the `Properties` contract: 

```javascript
    function property_totalSupplySolvency() public {
        // fetch the current epoch up to which rewards have been accumulated
        uint256 currentEpoch = rewardsManager.currentEpoch();
        uint256 epoch;

        while(epoch < currentEpoch) {
            uint256 sharesAtEpoch;

            // sum over all users
            for (uint256 i = 0; i < _getActors().length; i++) {
                uint256 shares = rewardsManager.shares(epoch, address(this), _getActors()[i]);
                sharesAtEpoch += shares;
            }

            // check that sum of user shares for an epoch is the same as the totalSupply for that epoch
            eq(sharesAtEpoch, rewardsManager.totalSupply(epoch, address(this)), "Sum of user shares should equal total supply");

            epoch++;
        }

    }
```

We can see that in the above that since the `RewardsManager` contract has checkpoints the `totalSupply` for each epoch and also tracks user shares for each epoch, we don't need to add any additional tracking and can just read the values directly from state to make an assertion on them. 

This is the ideal scenario since we don't need to add any additional tracking to our handlers to allow us to know the value of system variables. Given that there are often many different ways to implement properties you should always opt for the simplest approach of reading directly from the contract's state whenever possible as it minimizes potential breaking changes if the underlying codebase changes, but as we will see this isn't always possible. 

We'll now stop the fuzzer that we've been running in the background to see what coverage looks like then start a new run with our implemented property to see if it breaks. This is a good habit to get into because implementing multiple properties without running the fuzzer could result in many false positives that all need to be debugged separately which ultimately slows down your development cycle. 

## Coverage Analysis

From the coverage report we can see that all the major functions of interest: `notifyTransfer`, `_handleDeposit`, `_handleWithdrawal`, `_handleTransfer` and `accrueVault` are fully covered. 

We can also see however that the `claimReward` function is only being partially covered:

![Claim Reward Coverage](../images/bootcamp/claim_reward_partial_covg.png)

specifically, users never accumulate any points so they never have anything to claim. 

So we can then use this additional information to improve our `rewardsManager_claimReward_clamped` function further:

```javascript
    function rewardsManager_claimReward_clamped(uint256 epochId) public asActor {
        uint256 maxEpoch = rewardsManager.currentEpoch();
        epochId = epochId % (maxEpoch + 1);
        
        rewardsManager_claimReward(epochId, address(this), _getAsset(), _getActor());
    }
```

which ensures that we only claim rewards for an `epochId` that has already passed.

We can then start a new run of the fuzzer to determine if this has improved coverage and also whether the property we implemented breaks or not.  

## Property Refinement Process

Very shortly after we start running the fuzzer we see that it breaks the property so we can stop the fuzzer and have a reproducer unit test automatically generated for us if we're using the Recon extension or use the [Recon log scraper tool](../free_recon_tools/echidna_scraper.md) to do so: 

```javascript
    function test_property_totalSupplySolvency_0() public {
        vm.warp(block.timestamp + 157880);
        vm.roll(block.number + 1);
        rewardsManager_notifyTransfer(0x0000000000000000000000000000000000000000,0x00000000000000000000000000000000DeaDBeef,1);

        vm.warp(block.timestamp + 446939);
        vm.roll(block.number + 1);
        property_totalSupplySolvency();
    }
```

which after we run gives us the following output in our console which is still relatively difficult to debug and find the source of the broken property with:

```bash
Ran 1 test for test/recon/CryticToFoundry.sol:CryticToFoundry
[FAIL: Sum of user shares should equal total supply: 0 != 1] test_property_totalSupplySolvency_0() (gas: 187289)
Traces:
  [187289] CryticToFoundry::test_property_totalSupplySolvency_0()
    ├─ [0] VM::warp(157881 [1.578e5])
    │   └─ ← [Return]
    ├─ [0] VM::roll(2)
    │   └─ ← [Return]
    ├─ [0] VM::prank(CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496])
    │   └─ ← [Return]
    ├─ [97543] RewardsManager::notifyTransfer(0x0000000000000000000000000000000000000000, 0x00000000000000000000000000000000DeaDBeef, 1)
    │   ├─ emit Transfer(vault: CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], from: 0x0000000000000000000000000000000000000000, to: 0x00000000000000000000000000000000DeaDBeef, amount: 1)
    │   └─ ← [Stop]
    ├─ [0] VM::warp(604820 [6.048e5])
    │   └─ ← [Return]
    ├─ [0] VM::roll(3)
    │   └─ ← [Return]
    ├─ [414] RewardsManager::currentEpoch() [staticcall]
    │   └─ ← [Return] 2
    ├─ [3355] RewardsManager::shares(0, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496]) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3355] RewardsManager::shares(0, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 0x00000000000000000000000000000000000411c3) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3355] RewardsManager::shares(0, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 0x0000000000000000000000000000000000000B0b) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3355] RewardsManager::shares(0, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 0x00000000000000000000000000000000000c0fF3) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3102] RewardsManager::totalSupply(0, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496]) [staticcall]
    │   └─ ← [Return] 0
    ├─ [0] VM::assertEq(0, 0, "Sum of user shares should equal total supply") [staticcall]
    │   └─ ← [Return]
    ├─ [3355] RewardsManager::shares(1, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496]) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3355] RewardsManager::shares(1, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 0x00000000000000000000000000000000000411c3) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3355] RewardsManager::shares(1, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 0x0000000000000000000000000000000000000B0b) [staticcall]
    │   └─ ← [Return] 0
    ├─ [3355] RewardsManager::shares(1, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496], 0x00000000000000000000000000000000000c0fF3) [staticcall]
    │   └─ ← [Return] 0
    ├─ [1102] RewardsManager::totalSupply(1, CryticToFoundry: [0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496]) [staticcall]
    │   └─ ← [Return] 1
    ├─ [0] VM::assertEq(0, 1, "Sum of user shares should equal total supply") [staticcall]
    │   └─ ← [Revert] Sum of user shares should equal total supply: 0 != 1
    └─ ← [Revert] Sum of user shares should equal total supply: 0 != 1

Suite result: FAILED. 0 passed; 1 failed; 0 skipped; finished in 1.41ms (547.08µs CPU time)

Ran 1 test suite in 98.61ms (1.41ms CPU time): 0 tests passed, 1 failed, 0 skipped (1 total tests)

Failing tests:
Encountered 1 failing test in test/recon/CryticToFoundry.sol:CryticToFoundry
[FAIL: Sum of user shares should equal total supply: 0 != 1] test_property_totalSupplySolvency_0() (gas: 187289)
```

So instead, a simple way that we like to use more easily debug broken properties is by pasting the body of the property into the test itself which allows us to use `console.log()` to see the values at each step of the property execution: 

```javascript 
    function test_property_totalSupplySolvency_0() public {
        rewardsManager_notifyTransfer(0x0000000000000000000000000000000000000000,0x00000000000000000000000000000000DeaDBeef,1);

        // property_totalSupplySolvency();
        uint256 currentEpoch = rewardsManager.currentEpoch();
        uint256 epoch;

        while(epoch < currentEpoch) {
            uint256 sharesAtEpoch;

            // sum over all users
            for (uint256 i = 0; i < _getActors().length; i++) {
                uint256 shares = rewardsManager.shares(epoch, address(this), _getActors()[i]);
                sharesAtEpoch += shares;
            } 

            // check if solvency is met
            eq(sharesAtEpoch, rewardsManager.totalSupply(epoch, address(this)), "Sum of user shares should equal total supply");

            epoch++;
        }
    }
```

But in this case we can see that the only call that was made in the sequence was to `rewardsManager_notifyTransfer`, which indicates that this is most likely a false positive which we can confirm by checking the handler function implementation in `AdminTargets`: 

```
abstract contract AdminTargets is
    BaseTargetFunctions,
    Properties
{
    ...

    function rewardsManager_notifyTransfer(address from, address to, uint256 amount) public asAdmin {
        rewardsManager.notifyTransfer(from, to, amount);
    }
}
```

from which it becomes clear that the `notifyTransfer` function can be called for any `to` address which results in handling an increase in shares accounted to a user because the `rewardsManager_notifyTransfer` is called as an admin which is the same address that we're using as the vault in our case so this allows it to incorrectly create transfer notifications that aren't actually valid. 

As a quick workaround for this we can simply clamp the `to` address to the currently set actor like so: 

```javascript
    function rewardsManager_notifyTransfer(address from, uint256 amount) public asAdmin {
        rewardsManager.notifyTransfer(from, _getActor(), amount);
    }
```

we can then run Echidna again to confirm that this resolved our broken property as expected. After which we see that it still fails with the following reproducer:

```javascript
    function test_property_totalSupplySolvency_1() public {
        rewardsManager_notifyTransfer(0x0000000000000000000000000000000000000000,1);

        vm.warp(block.timestamp + 701427);
        vm.roll(block.number + 1);
        rewardsManager_notifyTransfer(0x00000000000000000000000000000000DeaDBeef,0);

        vm.warp(block.timestamp + 512482);
        vm.roll(block.number + 1);
        property_totalSupplySolvency();
    }
``` 

So this seems like it might be a real broken property, indicating that we've found a real bug. From our experience, typically when you're in a flow of writing properties and quickly checking that they're not false positives, following a lead on a broken property like this can be a bit of a distraction which prevents you from implementing more properties and leads to a side-quest of determining the root cause. Ultimately the goal of implementing properties is to test our understanding of the system so we can say that if the property breaks and we don't know why, our understanding of the system is most likely incorrect so we need to reevaluate the property implementation to understand why it still breaks. 

We can see however that if we call `RewardsManager::accrueVault` before checking the property however that the test then passes: 

```javascript
    function test_property_totalSupplySolvency_1() public {
        rewardsManager_notifyTransfer(0x0000000000000000000000000000000000000000,1);

        vm.warp(block.timestamp + 701427);
        vm.roll(block.number + 1);
        rewardsManager_notifyTransfer(0x00000000000000000000000000000000DeaDBeef,0);

        rewardsManager_accrueVault(rewardsManager.currentEpoch(), address(this));

        vm.warp(block.timestamp + 512482);
        vm.roll(block.number + 1);
        property_totalSupplySolvency();
    }  
```

```bash
[PASS] test_property_totalSupplySolvency_1() (gas: 391567)
Suite result: ok. 1 passed; 0 failed; 0 skipped; finished in 7.33ms (2.83ms CPU time)
```

this is because the `accrueVault` function sets a new value for the `totalSupply` if the `_getTotalSupplyAtEpoch` function determines that it hasn't updated since the last epoch: 

```javascript
  function accrueVault(uint256 epochId, address vault) public {
        require(epochId <= currentEpoch(), "Cannot see the future");

        (uint256 supply, bool shouldUpdate) = _getTotalSupplyAtEpoch(epochId, vault);

        if(shouldUpdate) {
            // Because we didn't return early, to make it cheaper for future lookbacks, let's store the lastKnownBalance
            totalSupply[epochId][vault] = supply;
        }

        ...
  }
```

We can see that this happens in our test because due to our actor setup, the `notifyTransfer` function calls `_handleTransfer`: 

```javascript
    function notifyTransfer(address from, address to, uint256 amount) external {
        require(from != to, "Cannot transfer to yourself");
        // NOTE: Anybody can call this because it's indexed by msg.sender
        // Vault is msg.sender, and msg.sender cost 1 less gas

        if (from == address(0)) {
            _handleDeposit(msg.sender, to, amount);
        } else if (to == address(0)) {
            _handleWithdrawal(msg.sender, from, amount);
        } else {
            _handleTransfer(msg.sender, from, to, amount);
        }

        emit Transfer(msg.sender, from, to, amount);
    }
```

with the `to` address set to the current actor which in our case is `address(this)`, and because `address(this)` is also our vault contract this causes unexpected behavior in our test. 

Essentially, we're notifying a transfer from the `from` address to the `address(this)` actor which normally would behave as expected because `msg.sender` would never be expected to be the same as the `from` or `to` addresses because the vault wouldn't have functionality to make a transfer to itself. 

We can see from the `handleTransfer` function that this subsequently doesn't call `accrueVault` so the vault's `totalSupply` remains unchanged because it's processing this as a transfer rather than a deposit which would subsequently increase the `totalSupply`:

```javascript
    function _handleTransfer(address vault, address from, address to, uint256 amount) internal {
        uint256 cachedCurrentEpoch = currentEpoch();
        // Accrue points for from, so they get rewards
        accrueUser(cachedCurrentEpoch, vault, from);
        // Accrue points for to, so they don't get too many rewards
        accrueUser(cachedCurrentEpoch, vault, to);

        ...
    }
```

So our property has highlighted an issue in our test setup that shows that we should actually clamp the `from` and `to` addresses to be one of the actors other than `address(this)`:

```javascript
    function rewardsManager_notifyTransfer(uint256 fromEntropy, uint256 toEntropy, uint256 amount) public asAdmin {
        uint256 actorsLength = _getActors().length;

        // prevent selecting the default actor
        address from;
        address to;
        from = fromEntropy == 0 ? address(0) : _getActors()[fromEntropy % actorsLength];
        to = toEntropy == 0 ? address(0) : _getActors()[toEntropy % actorsLength];

        rewardsManager.notifyTransfer(from, to, amount);
    }
```

which if we now test with the `test_property_totalSupplySolvency_1` reproducer passes: 

```javascript
    function test_property_totalSupplySolvency_1() public {
        rewardsManager_notifyTransfer(0, 2, 1);

        vm.warp(block.timestamp + 701427);
        vm.roll(block.number + 1);
        rewardsManager_notifyTransfer(0, 2,0);

        vm.warp(block.timestamp + 512482);
        vm.roll(block.number + 1);
        property_totalSupplySolvency();
    }  
```

This highlights a common issue that can arise during invariant testing where a property might break for an unknown reason and it appears to be a real break but upon further investigation it's due to a test suite misconfiguration. Since this issue was relatively simple to identify we fixed it before moving onto writing our next property but typically resolving these types of issues mid-flow of writing properties can be rather time consuming and distracting so it's usually best to leave them broken then go back to resolving them in a separate debugging pass once you've implemented your remaining properties and have removed other false positives. 

This is mostly a workflow preference but we've found it beneficial in our engagements because it allows for more distinct phases that still allow forward progress without getting stuck on an issue that might take hours to debug and like above simply be due to a misconfiguration.

**TODO: investigate root cause of this, seems like it's because the admin address is the same as the vault**

## Finding Potential Bugs

If we run the fuzzer again with our revised clamped handler we can then see that the property still breaks with the following reproducer:


```javascript
    function test_property_totalSupplySolvency_2() public {
        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 187957);
        rewardsManager_notifyTransfer(0,31919817873906484457616520816862118877645938270498273013141438,968185310588699677123274589116025179452188333707124755504);

        vm.warp(block.timestamp + 184313);
        vm.roll(block.number + 1);

        vm.roll(block.number + 1);
        vm.warp(block.timestamp + 450265);
        rewardsManager_notifyTransfer(2558326731337984441436338030936748012728969342862375220894783296876970426,14430921241106930414750317741839630256727976664000902492174384068,1183034652271781882787167034077441631572159888849485);

        vm.warp(block.timestamp + 387182);
        vm.roll(block.number + 1);
        property_totalSupplySolvency();
    }
```

So this seems to indicate that there's a real bug that we didn't identify in the actual `RewardsManager` contract. Finding the source of the actual bug is left as an exercise to the reader, but we hope this example demonstrates the common feedback loop you'd follow when debugging properties until you can identify the true source.

**TODO: add the implementation of the second property**