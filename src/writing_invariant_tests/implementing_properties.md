# Implementing Properties 
Implementing properties is the most important part of invariant testing, here we'll look at the [different types](#property-types) of properties that you can define and [how these can be implemented](#inlined-vs-global-properties) (inlined or global) along with the different techniques that you can use to [implement your properties](#example) as code using an ERC4626 vault as an example.

## What are properties? 
**Properties** allow us to define behaviors that we expect in our system. In the context of testing we can say that properties are logical statements about the system that we test after state-changing operations are made via a call to one of the target function [handlers](../using_recon/building_handlers.md#what-are-handlers). 

We can use the term **invariants** to specify properties of a system that should always hold true, meaning after **any** state-changing operation. 

We can use an ERC20 token as an example and define one property and one invariant for it:
- Property: a user’s balance should increase only after calls to the `transfer` and `mint` functions
- Invariant: the sum of user balances should never be greater than the `totalSupply`

> We prefer to use the term properties throughout this book because it covers invariants as well properties since invariants are a subset of properties but properties are not a subset of invariants.

## Property types
In [this presentation](https://github.com/Certora/Tutorials/blob/master/06.Lesson_ThinkingProperties/Categorizing_Properties.pdf), Certora lays out the five fundamental types of properties we’re interested in when writing invariants.

Namely these types of properties are:
- Valid States - checking that the system only stays in one of the expected states
- State Transitions - checking transitions between valid/invalid states
- Variable Transitions - checking that variables only change to/from certain expected values
- High-Level Properties - checking broad system behavior
- Unit Tests - checking specific behavior within functions

For more info on understanding these different types of properties, see [this post](https://getrecon.substack.com/i/150729898/the-four-types-of-properties). 

## Inlined vs global properties
After having implemented many suites ourselves, we realized that methods to implement properties fall into major categories: inlined and global. 

We call properties defined inside a function handler **inlined**, like the following from the [Create Chimera App](../oss/create_chimera_app.md) template:
```solidity
    function counter_setNumber2(uint256 newNumber) public asActor {
        // same example assertion test as counter_setNumber1 using ghost variables
        __before();
        counter.setNumber(newNumber);
        __after();


        if (newNumber != 0) {
            t(_after.counter_number == newNumber, "number != newNumber");
        }
    }
```

Because these properties are defined within the handlers themselves, they are only checked after the call to the target handler. This means that by definition they aren't required to hold for other function calls.

We call properties defined as standalone public functions in the [Properties](../writing_invariant_tests/chimera_framework.md#properties) contract that read some state or ghost variable **global**; the following example is also taken from the Create Chimera App template:
```solidity
    function invariant_number_never_zero() public {
        gt(counter.number(), 0, "number is zero");
    }
```

Because global properties are publicly exposed functions, they can be called by the fuzzer after any call to one of the state-changing handlers (just like how boolean properties normally work). This lets us check that a property holds for any function call, so we can use it to implement our system's invariants. 

## Testing mode 
Echidna and Medusa, the two primary fuzzers that we use, allow defining properties using [assertions](https://secure-contracts.com/program-analysis/echidna/basic/testing-modes.html?highlight=assertion#assertions) as well as [boolean properties](https://secure-contracts.com/program-analysis/echidna/basic/testing-modes.html?highlight=boolean%20property#boolean-properties). 

The same global property in the example above could be rewritten as an Echidna boolean property like so:
```solidity
    function echidna_number_never_zero() public returns (bool) {
        return counter.number() == 0;
    }
```
Any property that can be written as a boolean property however can also be writen using an assertion, simplifying the test writing process and allowing us to run only one job with Echidna in assertion mode rather than one job in assertion and one in property mode, because Echidna doesn't support using two testing modes at the same time.

--- 

## Example
We'll be using the scaffolding setup on [this](https://github.com/Recon-Fuzz/vaults-fuzzing-example/tree/book-example) simplified ERC4626 vault repo on the `book/example` branch.

> In the scaffolded setup linked to above, the handlers each explicitly clamp any addresses that receive shares using the `_getActor()` function from the [`ActorManager`](../oss/setup_helpers.md). This allows us to ensure that only actors that we've added to the [Setup](https://github.com/Recon-Fuzz/vaults-fuzzing-example/blob/dbbb0ad89af28944392eca1776ab4faeb8eeb5ff/test/recon/Setup.sol#L37) receive share tokens and makes it easier to check properties on them. 

### Vault Properties 
We'll be looking at how we can implement the following properties on an ERC4626 vault. 

1. The `totalSupply` of the vault's shares must be greater than or equal to the shares accounted to each user.
2. The `deposit` function should never revert for a depositor that has sufficient balance and approvals.
3. The price per share shouldn't increase on removals.  

#### 1. `totalSupply` check
Looking at the property definition, we can see that it doesn't specify any operation that we should check the property after, so we can define this as a global property in the `Properties` contract. 

Since this property only requires that we know the value of state variables after a given operation, we can just read these state values directly from the contract and make an assertion: 

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

We use the less-than-or-equal-to (`lte`) assertion in this case because we only care that the vault doesn't round up against the protocol. If it rounds in favor of the protocol, causing the sum of user balances to be less than the `totalSupply`, we can consider this acceptable because it still means the vault is solvent and users don't have more shares than expected.

#### 2. Vault `deposit` never fails
This property is explicitly stating that the check should only be made for the `deposit` function. This means we can implement this property as an inlined property inside the `vault_deposit` function.  

```solidity
    /// @dev Property: The `deposit` function should never revert for a depositor that has sufficient balance and approvals
    function vault_deposit(uint256 assets) public updateGhosts asActor {  
        try vault.deposit(assets, _getActor()) {
            // success
        } catch (bytes memory reason) {
            bool expectedError = 
                checkError(reason, "InsufficientBalance(address,uint256,uint256)") || 
                checkError(reason, "InsufficientAllowance(address,address,uint256,uint256)");
            
            // precondition: we only care about reverts for things other than insufficient balance or allowance
            if (!expectedError) {
                t(false, "deposit should not revert");
            }
        }
    }
```

We use the [`checkError`](https://github.com/Recon-Fuzz/setup-helpers/blob/e932f89bde035b4193f33699ae75a91f6246d635/src/Utils.sol#L11-L28) helper function from the Recon setup-helpers repo, which allows us to check the revert message from the call to make sure it's not reverting for the expected reasons of insufficient balance or allowance. 

#### 3. Price per share increase
This property is more open-ended, but we can conclude from the definition that the price per share shouldn't change for operations that remove assets from the vault. 

Since we have two target functions that remove assets from the vault (`withdraw`/`redeem`), we can check this as a global property that excludes operations that don't remove assets from the vault. This simplifies the implementation so we don't implement the same property in the `vault_withdraw` and `vault_redeem` handler.

To allow us to track the operation of interest, we add the `updateGhostsWithOpType` modifier to the `vault_redeem` and `vault_withdraw` handlers:

```solidity
    function vault_redeem(uint256 shares) public updateGhostsWithOpType(OpType.REMOVE) asActor {
        vault.redeem(shares, _getActor(), _getActor());
    }

    function vault_withdraw(uint256 assets) public updateGhostsWithOpType(OpType.REMOVE) asActor {
        vault.withdraw(assets, _getActor(), _getActor());
    }
```

We then define the following update in the `BeforeAfter` contract, which allows us to track the price per share before and after any operation using the `updateGhostsWithOpType`/`updateGhosts` modifiers:

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

### Running the fuzzer
Now with the properties implemented, all that's left to do is run the fuzzer to determine if any of the properties break.

Since we used the [Create Chimera App](../oss/create_chimera_app.md) template when scaffolding the above example, we can run Echidna locally using: 

```bash
echidna . --contract CryticTester --config echidna.yaml
```

and Medusa using:
```bash
medusa fuzz
```

to run the job using the Recon cloud runner see the [Running Jobs](../using_recon/running_jobs.md) page.



