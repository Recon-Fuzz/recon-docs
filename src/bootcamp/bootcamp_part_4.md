# Part 4 - Liquity Governance Case Study

We'll now see how everything we've covered up to this point in the bootcamp was used to find a real-world vulnerability in Liquity's governance system in an engagement performed by [Alex The Entreprenerd](https://x.com/GalloDaSballo).

> For the recorded stream of this part of the bootcamp see [here](https://x.com/i/broadcasts/1dRKZYvXNgvxB) starting at 49:40.

This issue was found in [this commit](https://github.com/liquity/V2-gov/tree/29471b270b365b655d4ddc74226322376e2ffe60) of the Liquity V2 codebase which was under review.

## Background: Calculate Average Timestamp

Before diving into the property we need to see the initial finding that inspired further targeted fuzz testing. This will help us better understand how we can use the tools that fuzzing provides us to escalate the severity of a vulnerability. 

In our case this begins with the `_calculateAverageTimestamp` function:

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

The intention of this calculation was to make flashloans unable to manipulate voting power by using the average amount of time for which a user was deposited to calculate voting power. In the case of a flashloan since the user has to deposit and withdraw within the same transaction their voting power would be 0 and for any normal deposits their voting power would increase as a function of the amount of time deposited. 

The key thing to note for our case is that the `newOuterAverageAge` calculation is subject to truncation because of the division operation that it performs. This had been highlighted in a previous review and it had been thought that the maximum value lost to truncation would be 1 second, since the `newOuterAverageAge` represents time in seconds and the truncation would essentially act as a rounding down, eliminating the trailing digit. Since the maximum lost value was 1 second, the impact of this finding was judged as low severity because it would only minimally affect voting power. 

If we look at the `_allocateLQTY` function, which makes the call to `_calculateAverageTimestamp` and actually handles user vote allocation using the `LQTY` token, we see the following: 

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

and with the recognition of the 1 second truncation, it would be possible for an attacker to grief an initiative by removing some of the allocated LQTY, which would cause the `newOuterAverageAge` to decrease by less than it should. As a result, since the average is less than expected, it would cause other voters to lose voting power. 

## The Property That Revealed the Truth

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

## Escalating from Low to Critical Severity

After running the fuzzer on the property, it was then found to break, which led to two possible paths for what to do next: identify exactly why the property breaks (this was already known so not necessarily beneficial in escalating the severity), or introduce a tolerance by which the strict equality in the two values being compared could differ. 

Given that the `_calculateAverageTimestamp` function was expected to have at least a 1 second variation, the approach of allowing a tolerance in a separate property was used to determine whether the variation was ever greater than this: 

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

where 

```javascript
    uint256 constant TOLERANCE = 1e19; // NOTE: 1e18 is 1 second due to upscaling
```

**TODO: how can tolerance be seconds if other value is voting power**

which meant that we allowed a 10 second tolerance bounding, so anything beyond this would again break the property. And sure enough, after running the fuzzer again, it once again broke the property, indicating that the initial classification as a low severity issue that would only be restricted to a 1 second difference was incorrect and now this would need further investigation to understand the root cause. 

Knowing that the property broke and the initial severity classification was incorrect, however, meant that we could also create a test using Echidna's [optimization mode](https://secure-contracts.com/program-analysis/echidna/advanced/optimization_mode.html?highlight=optimization#optimizing-with-echidna), which would allow us to determine the maximum possible impact. 

## Using Optimization Mode

Converting properties into an optimization mode test is usually just a matter of slight refactoring to the existing property: 

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

where we can see that we just return a maximum value as the difference of `int256(votedPowerSum) - int256(govPower)` if `votedPowerSum > govPower`. Echidna will then use all the existing target function handlers to manipulate state in an attempt to optimize the value returned by this function.  

> For more on how to define optimization properties, checkout [this page](../writing_invariant_tests/optimizing_broken_properties.md).

This test could then be run using the `echidna . --contract CryticTester --config echidna.yaml --format text --test-limit 10000000 --test-mode optimization` command or by selecting `optimization` mode in the Recon cockpit.

## The Revelation and Impact

After running the fuzzer for 100 million tests, we get the following result:

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

indicating that the initial insolvency was a severe underestimate, allowing an inflation in voting power of `4,152,241`. When translated into the dollar equivalent of LQTY, this results in millions of dollars worth of possible inflation in voting power. 

It's worth noting that if we let Echidna run for even longer, we would see that it subsequently inflates the voting power even further as was done in the engagement, which demonstrated an inflation in the range of hundreds of millions of dollars. 

This is a common dilemma that must be faced when using optimization mode as it can often find continuously larger and larger values, but typically there is a point where the value is sufficiently maximized to prove a given severity (in this case, for example, maximizing any further wouldn't increase the severity as the value above already demonstrates a critical severity issue). 

> For more info about how to generate a shrunken reproducer with optimization mode see [this section](../writing_invariant_tests/optimizing_broken_properties.md)

So what was originally thought to just be a precision loss of 1 wei really turned out to be one second for all stake for each initiative, meaning that this value is very large once you start having a large amount of voting power and many seconds have passed. This could then be applied to every initiative, inflating voting power even further. 

## Conclusion

Fundamentally, a global property breaking should be a cause for pause, which you should use to reflect and consider further how the system works. Then you can determine the severity of the broken property using the three steps we showed above: an exact check, an exact check with bounds, and optimization mode. 

More generally, if you can't use an exact check to check your property and have to use greater than or less than instead, you can refactor the implementation into an optimization mode test to determine what the maximum possible difference is.

## Next Steps

This concludes the Recon bootcamp. You should now be ready to take everything you've learned here and apply it to real-world projects to find bugs with invariant testing. 

To learn more about techniques for implementing properties, check out [this section](../writing_invariant_tests/implementing_properties.md). For more on how to use optimization mode to determine the maximum severity of a broken property, check out [this section](../writing_invariant_tests/optimizing_broken_properties.md). 

For some real-world examples of how we used Chimera to set up invariant testing suites for some of our customers, check out the following repos from Recon engagements:
- [eBTC BSM](https://github.com/ebtc-protocol/ebtc-bsm/tree/main/test/recon-core)
- [Nerite](https://github.com/Recon-Fuzz/nerite/tree/invariant-testing/contracts/test/recon)
- [Liquity Governance V2](https://github.com/liquity/V2-gov/tree/main/test/recon)

If you have any questions or feel that we've missed a topic to help you get started with invariant testing, please reach out to the Recon team in the help channel of [our Discord](https://discord.gg/aCZrCBZdFd). 