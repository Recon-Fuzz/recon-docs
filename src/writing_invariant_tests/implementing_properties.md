# Implementing Properties 

Implementing properties is part skill and part art, we'll look at the different kinds of properties that can be defined (inlined or global) and the different techniques that you can use to implement your properties as code using an ERC4626 vault as an example.

## What are properties? 


## Inlined vs Global Properties
NOTE: we favor only using assertion mode in our properties, this has led us to the two types of properties below

Before we get into how we can implement properties it's important to understand the different types, at Recon after implementing many suites ourselves we realized that these fall into major categories: inlined and global. 

We call properties defined inside a function [handler](../using_recon/building_handlers.md#what-are-handlers) **inlined**:
- TODO: example of inlined property

Because these properties are defined within the handlers themselves they are only checked after the call to the target handler, this means that by definition they aren't required to hold for other function calls.

We call properties defined in the [Properties](../writing_invariant_tests/chimera_framework.md#properties) contract **global**:
- TODO: example of global property

Because global properties are publicly exposed functions they can be called by the fuzzer after any call to one of the state-changing handlers (just like how [boolean properties](https://secure-contracts.com/program-analysis/echidna/basic/testing-modes.html?highlight=boolean%20property#boolean-properties) normally work). This lets us check that a property holds for any function call. 

## Setup
We'll be using the scaffolding setup on [this](https://github.com/Recon-Fuzz/vaults-fuzzing-example/tree/book-example) simplified ERC4626 vault repo on the `book/example` branch.

## Vault Properties 
Now with the two major types defined we'll look at how these can be implemented for the following properties on an ERC4626 vault. 

1. The `totalSupply` of the vault's shares must be greater than or equal to the shares accounted to each user.
2. The `deposit` function should never revert for a depositor that has sufficient balance and approvals.
3. The price per share shouldn't increase on removals. 

### A Note on Clamping
TODO: add info about how clamping actors in the handlers makes these checks much easier to define 

### 1. `totalSupply` check
Looking at the property definition we can see that it doesn't specify any operation that we should check the property after so we can define this as a global property in the `Properties` contract. 

Since this property only requires that we know the value of state variables after a given operation we can just read these state values directly from the contract and make an assertion: 

```solidity
/// @dev Property: The `totalSupply` of the vault's shares must be greater than or equal to the shares accounted to each user
    function property_total_supply_solvency() public {
        uint256 totalSupply = vault.totalSupply();
        // the only depositors in the system will be the actors that we added in the setup
        address[] memory users = _getActors();

        uint256 sumUserShares;
        for (uint256 i = 0; i < users.length; i++) {
            sumUserShares += vault.balanceOf(users[i]);
        }

        lte(sumUserShares, totalSupply, "sumUserShares must be <= to totalSupply");
    }
```

> Using the `/// @dev Property` NatSpec tag makes clear to any collaborators what the property checks without them having to reason through the property themselves

We use the less-than-or-equal-to (`lte`) assertion in this case because we only care that the vault doesn't round up against the protocol. If it rounds in favor of the protocol, causing the sum of user balances to be less than the `totalSupply` we can consider this acceptable because it still means the vault is solvent and users don't have more shares than expected.

## 2. Vault deposit never fails
This property is explicitly stating that the check should only be made for the `deposit` function, this means we can implement this property as an inlined property inside the `vault_deposit` function.  

```solidity
    /// @dev Property: The `deposit` function should never revert for a depositor that has sufficient balance and approvals
    function vault_deposit(uint256 assets) public updateGhosts asActor {  
        try vault.deposit(assets, _getActor()) {
        } catch (bytes memory reason) {
            bool expectedError = 
                checkError(reason, "InsufficientBalance(address,uint256,uint256)") || 
                checkError(reason, "InsufficientAllowance(address,address,uint256,uint256)");
            // precondition: we only care about reverts for things other than insufficient balance or allowance
            if (!expectedError) {
                revert("deposit should not revert");
            }
        }
    }
```

We use the [`checkError`](https://github.com/Recon-Fuzz/setup-helpers/blob/e932f89bde035b4193f33699ae75a91f6246d635/src/Utils.sol#L11-L28) helper function from the Recon setup-helpers repo, which allows us to check the revert message from the call, to make sure it's not reverting for the expected reasons of insufficient balance or allowance. 

## 3. Price per share increase
This property is more open ended but we can conclude from the definition that the price per share shouldn't change for operations that remove assets from the vault. Since we have two target functions that remove assets from the vault (`withdraw`/`redeem`), we can check this as a global property that excludes operations that don't remove assets from the vault. This simplifies the implementation so we don't implement the same property in the `vault_withdraw` and `vault_redeem` handler.

To allow us to track the operation of interest we add the `updateGhostsWithModidier` modifier to the `vault_redeem` and `vault_withdraw` handlers:

```solidity
    function vault_redeem(uint256 shares) public updateGhostsWithOpType(OpType.REMOVE) asActor {
        vault.redeem(shares, _getActor(), _getActor());
    }

    function vault_withdraw(uint256 assets) public updateGhostsWithOpType(OpType.REMOVE) asActor {
        vault.withdraw(assets, _getActor(), _getActor());
    }
```

We then define the following update in the `BeforeAfter` contract which allows us to track the price per share before and after any operation using the `updateGhostsWithOpType`/`updateGhosts` modifiers:

```solidity
    function __before() internal {
        _before.pricePerShare = vault.previewMint(10**vault.decimals());
    }

    function __after() internal {
        _after.pricePerShare = vault.previewMint(10**vault.decimals());
    }
```

We can then define a global property that checks that removal operations do not change the price per share: 

```solidity
    function property_price_per_share_change() public {
        if (currentOperation == OpType.REMOVE) {
            eq(_after.pricePerShare, _before.pricePerShare, "pricePerShare must not change after a remove operation");
        }
    }
```


