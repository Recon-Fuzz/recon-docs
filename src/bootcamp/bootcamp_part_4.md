# Liquity Governance Bug Case Study

We'll now see how everything we've covered up to this point in the bootcamp was used to find a real-world vulnerability in the V2 of Liquity's governance system in an engagement performed by [Alex The Entreprenerd](https://x.com/GalloDaSballo).

This issue was found in [this commit](https://github.com/liquity/V2-gov/tree/29471b270b365b655d4ddc74226322376e2ffe60) which was under review in the Liquity V2 codebase.

### The Root Cause: Calculate Average Timestamp

Before diving into the property we need to see the initial finding that inspired it to better understand how we can use the tools that fuzzing provides us to escalate the severity of a vulnerability. 

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
            newOuterAverageAge = votes / _newLQTYBalance;
        } else {
            uint88 deltaLQTY = _prevLQTYBalance - _newLQTYBalance;
            uint208 prevVotes = uint208(_prevLQTYBalance) * uint208(prevOuterAverageAge);
            uint208 newVotes = uint208(deltaLQTY) * uint208(newInnerAverageAge);
            uint208 votes = (prevVotes >= newVotes) ? prevVotes - newVotes : 0;
            newOuterAverageAge = votes / _newLQTYBalance;
        }

        if (newOuterAverageAge > currentTime) return 0;
        return uint120(currentTime - newOuterAverageAge);
    }
```

The intention of this calculation was to make flashloans unable to manipulate voting power by using the average amount of time for which a user was deposited to calculate voting power which in the case of a flashloan would be 0 and for any normal deposits their voting power would increase with the amount of time deposited. 

The key thing to note for our case is that the `newOuterAverageAge` calculation is subject to truncation because of the division operation that it performs. This had already been highlighted in a previous review and it had been thought that the maximum value lost to truncation would be 1 second, since the `newOuterAverageAge` represents time in seconds and the truncation would essentially act as a rounding down, eliminating the trailing digit. Since the maximum lost value was 1 second, the impact of this finding was judged as low severity. 

If we look at the `_allocateLQTY` function which is what actually handles user vote allocation using the `LQTY` token we see the following: 

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

So the user's LQTY allocation directly impacts the `averageStakingTimestamp` and the votes associated with each user. But in the case where `_prevLQTYBalance > _newLQTYBalance` indicating a user was decreasing their allocation:

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
            newOuterAverageAge = votes / _newLQTYBalance;
        }

        if (newOuterAverageAge > currentTime) return 0;
        return uint120(currentTime - newOuterAverageAge);
    }
```

it would be possible for an attacker to grief an initiative by removing some of the allocated LQTY which would cause the `newOuterAverageAge` to increase by too much because of the truncation, and because it increased by more than expected it would cause other voters to lose voting power. 

### The Property That Revealed the Truth

So to fully explore this and determine if the maximum severity of the issue was in fact only minimal griefing, the following property was implemented: 

```javascript
    function property_sum_of_initatives_matches_total_votes_strict() public {
        // Sum up all initiatives
        // Compare to total votes
        (uint256 allocatedLQTYSum, uint256 totalCountedLQTY, uint256 votedPowerSum, uint256 govPower) = _getInitiativeStateAndGlobalState();

        eq(allocatedLQTYSum, totalCountedLQTY, "LQTY Sum of Initiative State matches Global State at all times");
        eq(votedPowerSum, govPower, "Voting Power Sum of Initiative State matches Global State at all times");
    }
```

with the following helper function: 

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

which gives us the current state of all initiatives as well as the global state. This cancels out the time in the voting power so we can compare voting power as a scalar value to an amount of LQTY rather than the time-averaged amount which is difficult to reason about. 

### Escalating from Low to Critical Severity

After running the fuzzer on the property it was then found to break which led to the possibility of taking two possible paths: identifying exactly why the property breaks, or allowing a tolerance by which the strict equality in the two values being checked could differ. 

Given that the `_calculateAverageTimestamp` function was expected to have at least a 1 second variation, the approach of allowing a tolerance in a separate property was used to determine if the variation was ever greater than this: 

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

which meant that we allowed a 10 second tolerance bounding so anything beyond this would again break the property. And sure enough after running the fuzzer again, it once again broke the property, indicating that the initial classification as a low severity issue that would only be restricted to a 1 second difference was incorrect and now this would need further investigation to understand the root cause. 

Knowing that the property broke and the initial severity classification was incorrect however meant that we could also create a test using Echidna's [optimization mode](https://secure-contracts.com/program-analysis/echidna/advanced/optimization_mode.html?highlight=optimization#optimizing-with-echidna) which would allow us to determine the maximum possible impact. 

### Using Optimization Mode

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

where we can see that we just return a max value as the difference of `int256(votedPowerSum) - int256(govPower)` if the `votedPowerSum > govPower`.  

> For more on how to define optimization properties, checkout [this page](../writing_invariant_tests/optimizing_broken_properties.md).

This test could then be run using the `echidna . --contract CryticTester --config echidna.yaml --format text --test-limit 10000000 --test-mode optimization` command or by changing to use `optimization` mode in the Recon cockpit.

### The Revelation and Impact

What we found was that after running this, we get the following result:

so this insolvency that was initially thought to be marginal turned out to result in the potential to inflate voting power by hundreds of million of dollars.

### Key Takeaways

If there's any takeaway from this lesson, it should be that a global property breaking should make you reflect, should be a cause for pause and consideration about how the system works. Then you can determine by how much a property breaks by using the three steps we showed above: using an exact check, an exact check with bounds, and optimization mode. 

More generally, if you can't create an exact check to allow you to check your property, you should refactor your property into an optimization mode test to determine what a possible difference is as it will still be valuable in helping you determine if a broken property leads to a low severity issue or a high severity one.

### Technical Details on Optimization Mode

After running in optimization mode for a few minutes with the other optimization tests commented out to increase the likelihood that we only optimize the value of interest we get a maximum value of X **TODO: replace with actual max value**:

**TODO: insert image of optimization logs**

Since Echidna will only apply shrinking to an optimization call sequence if it reaches the `testLimit`, the approach we need to take here is slightly different from when we run in `assertion` mode. Once we have a large enough value like above to demonstrate that the severity is no longer what we previously expected, we can stop the job. 

So now that we have a call sequence that maximizes the value which is saved to our corpus we can just run a job with a `testLimit` of 10,000 which will quickly be reached and allow Echidna to shrink the reproducer call sequence for us:

So Echidna will use the 10,000 tests to replay calls from the sequence in the corpus which will eventually reach the same maximum value, then it will enter shrinking mode as it stops which will remove calls that don't contribute to optimizing the desired value.

Generally we want to allow shrinking to run for as long as possible to ensure that we have all unnecessary calls removed from the sequence, which is why chimera comes with the `shrinkLimit` in the `echidna.yaml` configuration file set to 100,000.

> Note that as of the time of writing there's a bug in Echidna that effects shrinking [described here](../writing_invariant_tests/optimizing_broken_properties.md#zero-call-sequence)

We then pass this into our Echidna log scrapper and get the following reproducer:

which can normally be used for debugging but in this case since the source of the issue is already known, this simply serves as proof of how an attacker could use this to inflate their voting power.

### The Final Impact and Resolution

Yeah, we basically broke it through that property. And in terms of mitigation, the mitigation that I had suggested was to use a higher scale, higher precision scale. And I think it's actually in the same commit that I was running. Because originally that one second used to be literally one second so one way was one second whereas once you add a timestamp precision of one in twenty six that obviously once one way is or even this hundred fifty million has to be divided by one in twenty six meaning that we it's basically one and a half seconds of impact that will be left with the code as it was.

And I believe the Liquity team decided that was not acceptable and so they ended up changing to a slope intercept model which is different but yeah fundamentally that was it with the bug another bug that never made it to production.

## Conclusion and Next Steps

So what was originally thought to just be a precision loss of 1 wei, really turned out to be one second for all stake for each initiative, meaning that this value is very large once you start having a large amount of voting power and a many seconds have passed. This could then be applied to every initiative, inflating voting power even further. 

This concludes the Recon bootcamp, you should now be ready to take everything you've learned here and apply it to real-world projects to find bugs with invariant testing. 

For some real-world examples of how we used Chimera to set up invariant testing suites for some of our customers check out the following repos from Recon engagements:
- [eBTC BSM](https://github.com/ebtc-protocol/ebtc-bsm/tree/main/test/recon-core)
- [Nerite](https://github.com/Recon-Fuzz/nerite/tree/invariant-testing/contracts/test/recon)
- [Liquity Governance V2](https://github.com/liquity/V2-gov/tree/main/test/recon)

If you have any questions or feel that we've missed a topic to help you get started with invariant testing please reach out to the Recon team in the help channel of [our Discord](https://discord.gg/aCZrCBZdFd). 