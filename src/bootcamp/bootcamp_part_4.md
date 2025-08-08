# Part 4 - Liquity Governance Case Study

In part 4 we'll see how everything we've covered up to this point in the bootcamp was used to find a real-world vulnerability in Liquity's governance system in an engagement performed by [Alex The Entreprenerd](https://x.com/GalloDaSballo). We'll also see how to use Echidna's optimization mode to increase the severity of a vulnerability. 

This issue was found in [this commit](https://github.com/liquity/V2-gov/tree/29471b270b365b655d4ddc74226322376e2ffe60) of the Liquity V2 codebase which was under review which you can clone if you'd like to follow along and reproduce the test results locally as it already contains all the scaffolding and property implementations.

> For the recorded stream of this part of the bootcamp see [here](https://x.com/i/broadcasts/1dRKZYvXNgvxB) starting at 49:40.

## Background on Liquity Governance V2

The Liquity V2 Governance system is a modular initiative-based governance mechanism where users stake LQTY tokens to earn voting power that accrues linearly over time, where the longer the user is staked, the greater their voting power. Users then allocate this voting power to fund various "initiatives" (any smart contract implementing IInitiative interface) that compete for a share of protocol revenues (25% of Liquity's income) distributed weekly through 7-day epochs. 

### Calculate average timestamp

A key aspect of accruing voting power to a user is the mechanism that was chosen to determine the amount of time which a user had their LQTY allocated. In this case this was handled by the `_calculateAverageTimestamp` function:

```javascript
    function _calculateAverageTimestamp(
        uint120 _prevOuterAverageTimestamp,
        uint120 _newInnerAverageTimestamp,
        uint88 _prevLQTYBalance,
        uint88 _newLQTYBalance
    ) internal view returns (uint120) {
        if (_newLQTYBalance == 0) return 0;

        uint120 currentTime = uint120(uint32(block.timestamp)) * uint120(TIMESTAMP_PRECISION);

        uint120 prevOuterAverageAge = _averageAge(currentTime, _prevOuterAverageTimestamp);
        uint120 newInnerAverageAge = _averageAge(currentTime, _newInnerAverageTimestamp);

        uint208 newOuterAverageAge;
        if (_prevLQTYBalance <= _newLQTYBalance) {
            uint88 deltaLQTY = _newLQTYBalance - _prevLQTYBalance;
            uint208 prevVotes = uint208(_prevLQTYBalance) * uint208(prevOuterAverageAge);
            uint208 newVotes = uint208(deltaLQTY) * uint208(newInnerAverageAge);
            uint208 votes = prevVotes + newVotes;
            // @audit truncation happens here
            newOuterAverageAge = votes / _newLQTYBalance;
        } else {
            uint88 deltaLQTY = _prevLQTYBalance - _newLQTYBalance;
            uint208 prevVotes = uint208(_prevLQTYBalance) * uint208(prevOuterAverageAge);
            uint208 newVotes = uint208(deltaLQTY) * uint208(newInnerAverageAge);
            uint208 votes = (prevVotes >= newVotes) ? prevVotes - newVotes : 0;
            // @audit truncation happens here
            newOuterAverageAge = votes / _newLQTYBalance;
        }

        if (newOuterAverageAge > currentTime) return 0;
        return uint120(currentTime - newOuterAverageAge);
    }
```

The intention of all this added complexity was to prevent flashloans from manipulating voting power by using the average amount of time for which a user was deposited to calculate voting power. In the case of a flashloan since the user has to deposit and withdraw within the same transaction their average deposited time would be 0 resulting in the `lqtyToVotes` calculation, used to calculate voting power, also returning 0: 

```javascript
    function lqtyToVotes(uint88 _lqtyAmount, uint120 _currentTimestamp, uint120 _averageTimestamp)
        public
        pure
        returns (uint208)
    {
        return uint208(_lqtyAmount) * uint208(_averageAge(_currentTimestamp, _averageTimestamp));
    }
```

The key thing to note for our case is that the `newOuterAverageAge` calculation is subject to truncation because of the division operation that it performs. This had been highlighted in a previous review and it had been thought that the maximum value lost to truncation would be 1 second, since the `newOuterAverageAge` represents time in seconds and the truncation would essentially act as a rounding down, eliminating the trailing digit. Since the maximum lost value was 1 second, the impact of this finding was judged as low severity because it would only minimally affect voting power by undervaluing the time for which users were deposited. 

More specifically, if we look at the `_allocateLQTY` function, which makes the call to `_calculateAverageTimestamp` and actually handles user vote allocation using the `LQTY` token, we see the following: 

```javascript
    function _allocateLQTY(
        address[] memory _initiatives,
        int88[] memory _deltaLQTYVotes,
        int88[] memory _deltaLQTYVetos
    ) internal {
        ...

            // update the average staking timestamp for the initiative based on the user's average staking timestamp
            initiativeState.averageStakingTimestampVoteLQTY = _calculateAverageTimestamp(
                initiativeState.averageStakingTimestampVoteLQTY,
                userState.averageStakingTimestamp, 
                initiativeState.voteLQTY,
                add(initiativeState.voteLQTY, deltaLQTYVotes) // @audit modifies LQTY allocation for user
            );
            initiativeState.averageStakingTimestampVetoLQTY = _calculateAverageTimestamp(
                initiativeState.averageStakingTimestampVetoLQTY,
                userState.averageStakingTimestamp, 
                initiativeState.vetoLQTY,
                add(initiativeState.vetoLQTY, deltaLQTYVetos) // @audit modifies LQTY allocation for user 
            );
    }  
```

So the user's LQTY allocation directly impacts the `averageStakingTimestamp` and the votes associated with each user. 

In the case where `_prevLQTYBalance > _newLQTYBalance`, indicating a user was decreasing their allocation:

```javascript
    function _calculateAverageTimestamp(
        uint120 _prevOuterAverageTimestamp,
        uint120 _newInnerAverageTimestamp,
        uint88 _prevLQTYBalance,
        uint88 _newLQTYBalance
    ) internal view returns (uint120) {
        ...

        uint208 newOuterAverageAge;
        if (_prevLQTYBalance <= _newLQTYBalance) {
            ...
        } else {
            uint88 deltaLQTY = _prevLQTYBalance - _newLQTYBalance;
            uint208 prevVotes = uint208(_prevLQTYBalance) * uint208(prevOuterAverageAge);
            uint208 newVotes = uint208(deltaLQTY) * uint208(newInnerAverageAge);
            uint208 votes = (prevVotes >= newVotes) ? prevVotes - newVotes : 0;
            // @audit truncation up to 1 second occurs here
            newOuterAverageAge = votes / _newLQTYBalance;
        }

        if (newOuterAverageAge > currentTime) return 0;
        return uint120(currentTime - newOuterAverageAge);
    }
```

and with the recognition of the 1 second truncation, an attacker could grief an initiative by removing an amount of allocated LQTY, which would cause their `newOuterAverageAge` to decrease by less than it should. As a result the attacker maintains more voting power than they should, subsequently diluting the voting power of other voters. 

## The property that revealed the truth

To fully explore this and determine whether the maximum severity of the issue was in fact only minimal griefing with a max difference of 1 second, the following property was implemented: 

```javascript
    function property_sum_of_initatives_matches_total_votes_strict() public {
        // Sum up all initiatives
        // Compare to total votes
        (uint256 allocatedLQTYSum, uint256 totalCountedLQTY, uint256 votedPowerSum, uint256 govPower) = _getInitiativeStateAndGlobalState();

        eq(allocatedLQTYSum, totalCountedLQTY, "LQTY Sum of Initiative State matches Global State at all times");
        eq(votedPowerSum, govPower, "Voting Power Sum of Initiative State matches Global State at all times");
    }
```

which simply checked that the sum of allocated LQTY for all initiatives is equivalent to the total allocated LQTY in the system and that the sum of voting power for all initiatives is equivalent to the total voting power in the system.

The following helper function was used to help with this comparison: 

```javascript
    function _getInitiativeStateAndGlobalState() internal returns (uint256, uint256, uint256, uint256) {
        (
            uint88 totalCountedLQTY,
            uint120 global_countedVoteLQTYAverageTimestamp 
        ) = governance.globalState();

        // Global Acc
        // Initiative Acc
        uint256 allocatedLQTYSum;
        uint256 votedPowerSum;
        for (uint256 i; i < deployedInitiatives.length; i++) {
            (
                uint88 voteLQTY,
                uint88 vetoLQTY,
                uint120 averageStakingTimestampVoteLQTY,
                uint120 averageStakingTimestampVetoLQTY,

            ) = governance.initiativeStates(deployedInitiatives[i]);

            // Conditional, only if not DISABLED
            (Governance.InitiativeStatus status,,) = governance.getInitiativeState(deployedInitiatives[i]);
            // Conditionally add based on state
            if (status != Governance.InitiativeStatus.DISABLED) {
                allocatedLQTYSum += voteLQTY;
                // Sum via projection
                votedPowerSum += governance.lqtyToVotes(voteLQTY, uint120(block.timestamp) * uint120(governance.TIMESTAMP_PRECISION()), averageStakingTimestampVoteLQTY);
            }

        }

        uint256 govPower = governance.lqtyToVotes(totalCountedLQTY, uint120(block.timestamp) * uint120(governance.TIMESTAMP_PRECISION()), global_countedVoteLQTYAverageTimestamp);

        return (allocatedLQTYSum, totalCountedLQTY, votedPowerSum, govPower);
    }
```

by performing the operation to sum the amount of allocated LQTY and voting power for all initiatives. This also provides the global state by fetching it directly from the `governance` contract. 

## Escalating from low to critical severity

After running the fuzzer on the property, it was found to break, which led to two possible paths for what to do next: identify exactly why the property breaks (this was already known so not necessarily beneficial in escalating the severity), or introduce a tolerance by which the strict equality in the two values being compared could differ. 

Given that the `_calculateAverageTimestamp` function was expected to have a maximum of 1 second variation, the approach of allowing a tolerance in a separate property was used to determine whether the variation was ever greater than this: 

```javascript
    function property_sum_of_initatives_matches_total_votes_bounded() public {
        // Sum up all initiatives
        // Compare to total votes
        (uint256 allocatedLQTYSum, uint256 totalCountedLQTY, uint256 votedPowerSum, uint256 govPower) = _getInitiativeStateAndGlobalState();

        t(
            allocatedLQTYSum == totalCountedLQTY || (
                allocatedLQTYSum >= totalCountedLQTY - TOLERANCE &&
                allocatedLQTYSum <= totalCountedLQTY + TOLERANCE
            ),
        "Sum of Initiative LQTY And State matches within absolute tolerance");

        t(
            votedPowerSum == govPower || (
                votedPowerSum >= govPower - TOLERANCE &&
                votedPowerSum <= govPower + TOLERANCE
            ),
        "Sum of Initiative LQTY And State matches within absolute tolerance");
    }
```

where `TOLERANCE` is the voting power for 1 second, given by `LQTY * 1 Second` where LQTY is a value in with 18 decimal precision:

```javascript
    uint256 constant TOLERANCE = 1e19;
```

which meant that our `TOLERANCE` value would allow up to 10 seconds of lost allocated time in the average calculation, anything beyond this would again break the property. We use 10 seconds in this case because if we used 1 second as the tolerance the fuzzer would most likely break the property for values less than 10, still making this only a griefing issue, however if it breaks for more than 10 seconds we know we have something more interesting worth exploring further.  

Surely enough, after running the fuzzer again with this tolerance added, it once again broke the property, indicating that the initial classification as a low severity issue that would only be restricted to a 1 second difference was incorrect and now this would require further investigation to understand the maximum possible impact. To find the maximum possible impact we could then create a test using Echidna's [optimization mode](https://secure-contracts.com/program-analysis/echidna/advanced/optimization_mode.html?highlight=optimization#optimizing-with-echidna). 

## Using optimization mode

Converting properties into an optimization mode test is usually just a matter of slight refactoring to the existing property to instead return some value rather than make an assertion: 

```javascript 
    function optimize_property_sum_of_initatives_matches_total_votes_insolvency() public returns (int256) {
        int256 max = 0;

        (, , uint256 votedPowerSum, uint256 govPower) = _getInitiativeStateAndGlobalState();

        if(votedPowerSum > govPower) {
            max = int256(votedPowerSum) - int256(govPower);
        }

        return max;
    }
```

where we can see that we just return the maximum value as the difference of `int256(votedPowerSum) - int256(govPower)` if `votedPowerSum > govPower`. Echidna will then use all the existing target function handlers to manipulate state in an attempt to optimize the value returned by this function.  

> For more on how to define optimization properties, checkout [this page](../writing_invariant_tests/optimizing_broken_properties.md).

This test could then be run using the `echidna . --contract CryticTester --config echidna.yaml --format text --test-limit 10000000 --test-mode optimization` command or by selecting `optimization` mode in the Recon cockpit.

## The revelation and impact

After running the fuzzer for 100 million tests, we get the following unit test generated from the reproducer:

```javascript
// forge test --match-test test_optimize_property_sum_of_initatives_matches_total_votes_insolvency_0 -vvv 
function test_optimize_property_sum_of_initatives_matches_total_votes_insolvency_0() public {

    // Max value: 4152241824275924884020518;

    vm.prank(0x0000000000000000000000000000000000010000);
    property_sum_of_lqty_global_user_matches();

    vm.warp(block.timestamp + 4174);

    vm.roll(block.number + 788);

    vm.roll(block.number + 57);
    vm.warp(block.timestamp + 76299);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_withdrawLQTY_shouldRevertWhenClamped(15861774047245688283806176);

    vm.roll(block.number + 4288);
    vm.warp(block.timestamp + 419743);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_depositLQTY_2(2532881971795689134446062);

    vm.roll(block.number + 38154);
    vm.warp(block.timestamp + 307412);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_allocateLQTY_clamped_single_initiative_2nd_user(27,211955987,0);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertsecondsWithinEpoch();

    vm.warp(block.timestamp + 113902);

    vm.roll(block.number + 4968);

    vm.roll(block.number + 8343);
    vm.warp(block.timestamp + 83004);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_claimForInitiative(68);

    vm.prank(0x0000000000000000000000000000000000010000);
    check_realized_claiming_solvency();

    vm.roll(block.number + 2771);
    vm.warp(block.timestamp + 444463);
    vm.prank(0x0000000000000000000000000000000000010000);
    check_claim_soundness();

    vm.warp(block.timestamp + 643725);

    vm.roll(block.number + 17439);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertsnapshotVotesForInitiative(108);

    vm.roll(block.number + 21622);
    vm.warp(block.timestamp + 114917);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_depositLQTY(999999999999999999998);

    vm.roll(block.number + 1746);
    vm.warp(block.timestamp + 21);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_depositLQTY(12);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertepochStart(250);

    vm.roll(block.number + 49125);
    vm.warp(block.timestamp + 190642);
    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertSnapshotAndState(2);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertsecondsWithinEpoch();

    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertsecondsWithinEpoch();

    vm.roll(block.number + 18395);
    vm.warp(block.timestamp + 339084);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_allocateLQTY_clamped_single_initiative(81,797871,0);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_initiative_ts_matches_user_when_non_zero();

    vm.warp(block.timestamp + 468186);

    vm.roll(block.number + 16926);

    vm.prank(0x0000000000000000000000000000000000010000);
    helper_deployInitiative();

    vm.prank(0x0000000000000000000000000000000000010000);
    property_BI05();

    vm.prank(0x0000000000000000000000000000000000010000);
    property_sum_of_user_voting_weights_strict();

    vm.roll(block.number + 60054);
    vm.warp(block.timestamp + 431471);
    vm.prank(0x0000000000000000000000000000000000010000);
    property_sum_of_user_voting_weights_strict();

    vm.warp(block.timestamp + 135332);

    vm.roll(block.number + 38421);

    vm.roll(block.number + 7278);
    vm.warp(block.timestamp + 455887);
    vm.prank(0x0000000000000000000000000000000000010000);
    property_allocations_are_never_dangerously_high();

    vm.roll(block.number + 54718);
    vm.warp(block.timestamp + 58);
    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldNeverRevertsecondsWithinEpoch();

    vm.prank(0x0000000000000000000000000000000000010000);
    governance_snapshotVotesForInitiative(0xE8E23e97Fa135823143d6b9Cba9c699040D51F70);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_shouldGetTotalVotesAndState();

    vm.prank(0x0000000000000000000000000000000000010000);
    initiative_depositBribe(20,94877931099225030012957476263093446259,62786,38);

    vm.prank(0x0000000000000000000000000000000000010000);
    governance_withdrawLQTY_shouldRevertWhenClamped(72666608067123387567523936);

    vm.roll(block.number + 17603);
    vm.warp(block.timestamp + 437837);
    vm.prank(0x0000000000000000000000000000000000010000);
    helper_deployInitiative();

    vm.roll(block.number + 6457);
    vm.warp(block.timestamp + 349998);
    vm.prank(0x0000000000000000000000000000000000010000);
    property_allocations_are_never_dangerously_high();

    vm.roll(block.number + 49513);
    vm.warp(block.timestamp + 266623);
    vm.prank(0x0000000000000000000000000000000000010000);
    helper_accrueBold(29274205);

    vm.prank(0x0000000000000000000000000000000000010000);
    governance_registerInitiative(62);

    vm.prank(0x0000000000000000000000000000000000010000);
    governance_claimForInitiative(81);

    vm.prank(0x0000000000000000000000000000000000030000);
    property_shouldNeverRevertepochStart(128);

    vm.roll(block.number + 7303);
    vm.warp(block.timestamp + 255335);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_claimForInitiativeDoesntRevert(15);

    vm.prank(0x0000000000000000000000000000000000010000);
    initiative_depositBribe(216454974247908041355937489573535140507,24499346771823261073415684795094302253,10984,12);

    vm.prank(0x0000000000000000000000000000000000010000);
    governance_allocateLQTY_clamped_single_initiative(74,5077,0);

    vm.prank(0x0000000000000000000000000000000000010000);
    property_GV01();

    vm.warp(block.timestamp + 427178);

    vm.roll(block.number + 4947);

    vm.roll(block.number + 43433);
    vm.warp(block.timestamp + 59769);
    vm.prank(0x0000000000000000000000000000000000010000);
    governance_withdrawLQTY_shouldRevertWhenClamped(48);

 }
```

indicating that the initial insolvency was a severe underestimate, allowing a possible inflation in voting power of `4152241824275924884020518 / 1e18 = 4,152,241`. When translated into the dollar equivalent of LQTY, **this results in millions of dollars worth of possible inflation in voting power**. 

It's worth noting that if we let Echidna run for even longer, we would see that it subsequently inflates the voting power even further as was done in the engagement, which demonstrated an inflation in the range of hundreds of millions of dollars. 

The dilemma of when to stop a test run is a common one when using optimization mode as it can often find continuously larger and larger values the longer you allow the fuzzer to run. Typically however there is a point of diminishing returns where the value is sufficiently maximized to prove a given severity. In this case, for example, maximizing any further wouldn't increase the severity as the value above already demonstrates a critical severity issue. 

> For more info about how to generate a shrunken reproducer with optimization mode see [this section](../writing_invariant_tests/optimizing_broken_properties.md)

So what was originally thought to just be a precision loss of 1 second really turned out to be one second for all stake for each initiative, meaning that this value is very large once you have a large amount of voting power and many seconds have passed. This could then be applied to every initiative, inflating voting power even further. 

## Conclusion

Fundamentally, a global property breaking should be a cause for pause, which you should use to reflect and consider further how the system works. Then you can determine the severity of the broken property using the three steps shown above: an exact check, an exact check with bounds, and optimization mode. 

More generally, if you can't use an exact check to check your property and have to use greater than or less than instead, you can refactor the implementation into an optimization mode test to determine what the maximum possible difference is.

## Next steps

This concludes the Recon bootcamp. You should now be ready to take everything you've learned here and apply it to real-world projects to find bugs with invariant testing. 

To learn more about techniques for implementing properties, check out [this section](../writing_invariant_tests/implementing_properties.md). For more on how to use optimization mode to determine the maximum severity of a broken property, check out [this section](../writing_invariant_tests/optimizing_broken_properties.md). 

For some real-world examples of how we used Chimera to set up invariant testing suites for some of our customers, check out the following repos from Recon engagements:
- [eBTC BSM](https://github.com/ebtc-protocol/ebtc-bsm/tree/main/test/recon-core)
- [Nerite](https://github.com/Recon-Fuzz/nerite/tree/invariant-testing/contracts/test/recon)
- [Liquity Governance V2](https://github.com/liquity/V2-gov/tree/main/test/recon)

If you have any questions or feel that we've missed a topic to help you get started with invariant testing, please reach out to the Recon team in the help channel of [our Discord](https://discord.gg/aCZrCBZdFd). 