# Optimizing Broken Properties

Echidna's [optimization mode](https://secure-contracts.com/program-analysis/echidna/advanced/optimization_mode.html?highlight=optim#optimizing-with-echidna) is a powerful tool for understanding the maximum possible impact of a vulnerability discovered by a broken property. 

Optimization mode often allows you to determine if the impact of a vulnerability can be greater than what's shown by the originally broken property or if it's minimal because it isn't increased by the optimization test.

> As of the time of writing, optimization mode is only available in Echidna, not Medusa

## What is optimization mode?
Optimization mode allows you to define a test function that starts with a special prefix (we tend to set this to `optimize_`), takes no arguments and returns an `int256` value:

```javascript
    function optimize_price_per_share_difference() public view returns (int256) {
        return maxPriceDifference;
    }
```

In the above example the `maxPriceDifference` value would be set by one of our target function handlers and the Echidna would call all other function handlers as well in an attempt to maximize the value returned by `optimize_price_per_share_difference`.

--- 

## Example
We'll now look at an example of how we can use optimization mode to increase the severity of a finding discovered by a broken property using [this ERC4626 vault](https://github.com/Recon-Fuzz/vaults-fuzzing-example/tree/optimization-example) as an example.  

### Defining the property
First, because this is an ERC4626 vault without the possibility of accumulating yield or taking losses we can define a standard property that states: **a user should not be able to change the price per share when adding or removing**. 

This check ensures that a malicious user cannot perform actions that would make it favorable for them to perform arbitrage operations or allow them to steal funds from other users by giving themselves a more favorable exchange rate. 

> We specify **when adding or removing** in the property because these are the only operations that change the balance of underlying assets and shares in the vault so these are the ones that would affect the share price.

Given that an ERC4626 vault has user operations that don't exclusively add or remove shares and assets from the vault, we can use the `OpType` `enum` in the `updateGhostsWithOpType` modifier in our target handlers to only check the property after a call to one of our [target functions](https://github.com/Recon-Fuzz/vaults-fuzzing-example/blob/f576f1e69f197c18cf1889282e8e0a5f14f970cc/test/recon/targets/VaultTargets.sol#L20-L34) of interest: 

```javascript
    function vault_deposit(uint256 assets) public updateGhostsWithOpType(OpType.ADD) asActor {        
        vault.deposit(assets, _getActor());
    }

    function vault_mint(uint256 shares) public updateGhostsWithOpType(OpType.ADD) asActor {
        vault.mint(shares, _getActor());
    }

    function vault_redeem(uint256 shares) public updateGhostsWithOpType(OpType.REMOVE) asActor {
        vault.redeem(shares, _getActor(), _getActor());
    }

    function vault_withdraw(uint256 assets) public updateGhostsWithOpType(OpType.REMOVE) asActor {
        vault.withdraw(assets, _getActor(), _getActor());
    }
```

We can then add updates to the price per share in the [`BeforeAfter` contract](https://github.com/Recon-Fuzz/vaults-fuzzing-example/blob/e0178d9bf5cf9e24d27a64438acc64be67cff93f/test/recon/BeforeAfter.sol#L38-L44) like so: 

```javascript
    function __before() internal {
        _before.pricePerShare = vault.convertToShares(10**underlyingAsset.decimals());
    }

    function __after() internal {
        _after.pricePerShare = vault.convertToShares(10**underlyingAsset.decimals());
    }
```

The above checks how many shares would be received for a deposit of 1 unit of the underlying asset using the `underlyingAsset`'s decimal precision, giving us an implicit price per share. 

Finally, we can implement our property as: 

```javascript
    function property_user_cannot_change_price_per_share() public {
        if(currentOpType == OpType.ADD || currentOpType == OpType.REMOVE) {
            eq(_before.pricePerShare, _after.pricePerShare, "price per share should not change with user operations");
        }
    }
```

which simply checks that the `pricePerShare` stays the same after any of the user operations that add or remove tokens to the system (`mint`, `deposit`, `withdraw` and `redeem`). 

> For more details on how to implement properties using the above `OpType` enum see [this section](../writing_invariant_tests/implementing_properties.md#3-price-per-share-increase).

### Breaking the property 
After a brief run of Echidna, the property is broken with less than 5000 tests run: 

```bash
property_user_cannot_change_price_per_share(): failed!💥  
  Call sequence:
    CryticTester.vault_mint(3)
    CryticTester.property_user_cannot_change_price_per_share()

Traces: 
emit Log(«price per share should not change with user operations») 
```

This indicates that something in the `ERC4626Vault::mint` function is allowing the user to manipulate the price per share.

However, after running the unit test that we generate with the [Echidna log scraper](https://getrecon.xyz/tools/echidna) tool we can see that the `pricePerShare` only changes by 1 wei: 

```bash
[FAIL: price per share should not change with user operations: 1000000000000000000 != 999999999999999999] test_property_user_cannot_change_price_per_share_0() (gas: 182423)
Logs:
  price per share difference 1
```

Given that any price manipulation by an attacker would allow them to perform arbitrage on the vault, we know this is already a vulnerability, but we can now create an optimization test to determine if the maximum price change is limited to this 1 wei value or if it can be made greater, potentially allowing an attacker to steal funds from other users as well. 

### Creating the optimization tests
Since we want to optimize the difference between the price per share, we can define two separate variables in our `Setup` contract for tracking this, one which tracks increases to the price per share and one that tracks decreases to it: 

```javascript
    int256 maxPriceDifferenceIncrease;
    int256 maxPriceDifferenceDecrease;
```

We can then define two separate optimization tests to optimize each of these values, because if we were to only define one, we'd be losing information on other potential issue paths as the call sequence given at the end of the fuzzing run will only give us one maximized value. So if the price increase is greater than the price decrease, we'd only be able to analyze issues where it increases instead of decreases.

So we define the following two optimization tests for the difference in price before and after a call to one of our handlers of interest in our `Properties` contract: 

```javascript
    function optimize_user_increases_price_per_share() public returns (int256) {
        if(currentOpType == OpType.ADD || currentOpType == OpType.REMOVE) {
            if(_before.pricePerShare < _after.pricePerShare) {
                maxPriceDifferenceIncrease = int256(_after.pricePerShare) - int256(_before.pricePerShare);
                return maxPriceDifferenceIncrease;
            }
        }
    }

    function optimize_user_decreases_price_per_share() public returns (int256) {
        if(currentOpType == OpType.ADD || currentOpType == OpType.REMOVE) {
            if(_before.pricePerShare > _after.pricePerShare) {
                maxPriceDifferenceDecrease = int256(_before.pricePerShare) - int256(_after.pricePerShare);
                return maxPriceDifferenceDecrease;
            }
        }
    }
```

which will set each of the respective `maxPriceDifference` variables accordingly.

> Note that the tests above are optimizing the _difference_ in price so they will allow us to confirm if we are able to change the price by more than the 1 wei which we know is possible from the initial property break. 

### Running the optimization tests
We can then run the tests using optimization mode by either modifying the `testMode` parameter in the `echidna.yaml` config file or by passing the `--test-mode optimization` flag to the command we use to run Echidna. For our case we'll use the latter: 

```bash
echidna . --contract CryticTester --config echidna.yaml --test-mode optimization --test-limit 100000
```

Note that we also increased the `testLimit` so that we can give the fuzzer plenty of chances to find a call sequence that optimizes the value. This is key in allowing you to generate a truly optimized value, in production codebases we tend to run optimization mode for 100,000,000-500,000,000 tests but theoretically for a test suite with many handlers and state variables that influence the value you're trying to optimize, the longer you run the tests for, the higher the possibility of finding an optimized value. 

Typically when we've found a value that's sufficient to prove an increase in the severity of the vulnerability, by demonstrating that the value can be made greater than a small initial value in the original property break we'll stop the optimization run. 

Conversely, if the optimization run shows no increase after a few million tests it typically means it was incorrectly specified or there is in fact no way to increase the value further. 

> Note: stopping an Echidna optimization run early doesn't allow the call sequence that increased the value to be properly shrunk as of the time of writing (see this [issue](https://github.com/crytic/echidna/issues/839)). If you've already found a sufficiently optimized value and don't want to wait until the run completes, you can stop the run and start a new run with a shorter `testLimit` and reuse the corpus from the previous run to force Echidna to shrink the reproducer in the corpus.

After running the fuzzer for 100,000 runs for the above defined tests we get the following outputs in the console: 

```bash
optimize_user_decreases_price_per_share: max value: 1000000000000000000

  Call sequence:
    CryticTester.asset_mint(0x2e234dae75c793f67a35089c9d99245e1c58470b,1005800180287214122)
    CryticTester.vault_deposit(1)

...

optimize_user_increases_price_per_share: max value: 250000000000000000

  Call sequence:
    CryticTester.vault_deposit(2)
    CryticTester.vault_deposit(1)
    CryticTester.vault_deposit(1)
    CryticTester.vault_withdraw(2)
```

from which we can see that an attacker can therefore not only decrease the price per share as our original property break implied, but they can also increase the price using a completely different call sequence. This is why it's key to define separate optimization tests for increases and decreases for whatever value your initial property breaks. 

### Investigating the issue
We can use the above call sequences with our Echidna log scraper tool to generate unit tests that allow us to debug the root cause of the issues by adding the following tests to our `CryticToFoundry` contract: 

```javascript
    // forge test --match-test test_optimize_user_decreases_price_per_share_0 -vvv 
    function test_optimize_user_decreases_price_per_share_0() public {
        // Max value: 1000000000000000000;
        asset_mint(0x2e234DAe75C793f67A35089C9d99245E1C58470b,1005800180287214122);
        vault_deposit(1);
    }

    // forge test --match-test test_optimize_user_increases_price_per_share_1 -vvv 
    function test_optimize_user_increases_price_per_share_1() public {
        // Max value: 250000000000000000;
        vault_deposit(2);
        vault_deposit(1);
        vault_deposit(1);
        vault_withdraw(2);
    }
```

#### Decreasing price
For the `test_optimize_user_decreases_price_per_share_0` test, we see that the `asset_mint` is making a donation. We don't know which of the deployed contracts in the setup is deployed at `0x2e234DAe75C793f67A35089C9d99245E1C58470b` but we can make an educated guess that it's the vault contract because if the test allows us to manipulate the share price it must be affecting the ratio of shares to assets in the vault. 

Logging the value of the deployed vault in the test we can confirm this: 

```bash
Logs:
  vault 0x2e234DAe75C793f67A35089C9d99245E1C58470b
```

So essentially this test is telling us that: "if I donate a large amount then make a deposit I can decrease the price per share".

Investigating further we can see that the `ERC4626Vault::deposit` function calls `ERC4626Vault::previewDeposit` which calls `ERC4626Vault::convertToShares`:

```javascript
contract ERC4626Vault is MockERC20 {
    ...

    function deposit(uint256 assets, address receiver) public virtual returns (uint256) {
        uint256 shares = previewDeposit(assets);
        _deposit(msg.sender, receiver, assets, shares);
        return shares;
    }

    ...

    function previewDeposit(uint256 assets) public view virtual returns (uint256) {
        return convertToShares(assets);
    }

    ... 

    function convertToShares(uint256 assets) public view virtual returns (uint256) {
        uint256 supply = totalSupply;
        if (supply == 0) return assets;
        
        // VULNERABILITY: Precision Loss Inflation Attack
        // This creates a subtle inflation vulnerability through precision loss manipulation
        // The attack works by exploiting division-before-multiplication in specific scenarios
        
        uint256 totalAssets_ = totalAssets();
        
        // Step 1: Calculate share percentage first (division before multiplication)
        uint256 sharePercentage = assets * 1e18 / totalAssets_;  // Get percentage with 18 decimals
        
        // Step 2: Apply percentage to total supply
        uint256 shares = sharePercentage * supply / 1e18;
        
        // The vulnerability: When totalAssets_ >> assets, sharePercentage rounds down to 0
        // This allows attackers to:
        // 1. Deposit large amount to inflate totalAssets
        // 2. Make small deposits from other accounts that get 0 shares due to rounding
        // 3. Withdraw their initial deposit plus the "donated" assets from failed deposits
        
        return shares;
    }

}
```

which identifies the bug that was planted. 

If we expand the existing test, we can prove the observation in the comments that the first depositor's donation can drive the depositor's received shares for small deposits down to 0:

```javascript
    function test_optimize_user_decreases_price_per_share_0() public {
        // Max value: 1000000000000000000;
        asset_mint(0x2e234DAe75C793f67A35089C9d99245E1C58470b,1005800180287214122);
        vault_deposit(1);

        // switch to the other actor and deposit a small amount
        switchActor(1);
        vault_deposit(1e18);
        console2.log("balance of actor 2 after deposit", vault.balanceOf(_getActor()));
    }
```

```bash
Logs:
  balance of actor 2 after deposit 0
```

this allows the attacker to steal shares of the other depositor(s) on withdrawal. 

#### Increasing price
For the `test_optimize_user_increases_price_per_share_1` we can see that multiple small deposits followed by a withdrawal of a small amount allows the user to manipulate the price upward. 

The root cause of this issue is the same but can you identify why it increases the price instead of decreasing it? What would the impact of being able to manipulate the price in this way?

## Continue learning
To see how the Recon team used optimization mode in a real world project to escalate the severity of a vulnerability to critical during an audit of the Beraborrow codebase, check out [this article](https://getrecon.substack.com/p/the-dark-side-of-the-lp).