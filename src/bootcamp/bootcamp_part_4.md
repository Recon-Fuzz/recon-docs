# The Liquity Governance Bug Case Study

We'll now see how everything we've covered up to this point in the bootcamp was used to find a real world vulnerability in the V2 of Liquity's governance system in an engagement performed by [Alex The Entreprenerd](https://x.com/GalloDaSballo).

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

The key thing to note for our case is that the `newOuterAverageAge` calculation is subject to truncation where the because of the division operation that it performs. This had already been highlighted in a previous review and it had been thought that the maximum value lost to truncation would be 1 second, since the `newOuterAverageAge` represents time in seconds and the truncation would essentially act as a rounding down, eliminating the trailing digit. Since the maximum lost value of 1 second, the impact of this finding was judged as low severity. 

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
                allocatedLQTYSum >= totalCountedLQTY - TOLLERANCE &&
                allocatedLQTYSum <= totalCountedLQTY + TOLLERANCE
            ),
        "Sum of Initiative LQTY And State matches within absolute tollerance");

        t(
            votedPowerSum == govPower || (
                votedPowerSum >= govPower - TOLLERANCE &&
                votedPowerSum <= govPower + TOLLERANCE
            ),
        "Sum of Initiative LQTY And State matches within absolute tollerance");
    }
```

where 

```javascript
    uint256 constant TOLLERANCE = 1e19; // NOTE: 1e18 is 1 second due to upscaling
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

If there's any takeaway from this lesson, it shoul be that a global property breaking should make you reflect, should be a cause for pause and consideration about how the system works. Then you can can determine by how much a property breaks by using the three steps we showed above: using an exact check, an exact check with bounds, and optimization mode. 

More generally, if you can't create an exact check to allow you to check your property, you should refactor your property into an optimization mode test to determine what a possible difference is as it will still be valuable in helping you determine if a broken property leads to a low severity issue or a high severity one.

### Technical Details on Optimization Mode

After running in optimization mode for a few minutes with the other optimization tests commented out to increase the likelihood that we only optimize the value of interest we get a maximum value of X **TODO: replace with actual max value**:

**TODO: insert image of optimization logs**

Since Echidna will only apply shrinking to an optimization call sequence if it reaches the `testLimit`, the approach we need to take here is slightly differente from when we run in `assertion` moce. Once we have a large enough value like above to demonstrate that the severity is no longer what we previously expected, we can stop the job. 

So I'm going to show you how to get a repro in, you know, how to get a repro from a key in twenty twenty five from optimization mode. But fundamentally, Echidna will stop shrinking only when you're done. And so I think I ran it already, so I'm somewhat cheating. But basically, I'm just going to run with something like ten thousand tests.

And so what's going to happen is that the ten thousand tests are sufficient for Echidna to grab the previous corpus and replay it and give me the maximum value. But then they're going to be very quick on the CPU cycles, so that we get through those. And then after the ten thousand tests, Echidna will engage shrinking.

And you generally, for optimization mode, you want to let it run as much as you can. And this is also why in Create Chimera App True, our latest version of Create Chimera App, which is live and re-confused with Flash Create Chimera App, we have a shrink limit of one hundred thousand because it generally tends to be the sweet spot to get to shrink basically anything until it runs into bugs, which there's few, but they do exist.

### Handling Zero Values in Optimization

And then another thing to note is that anytime an optimization property gives you a zero, let's say this property gives a zero, that will trigger another bug that Echidna has where it will try to shrink an empty sequence and it just will crush the worker. And so to prevent that, you just have to comment out every property that returns a zero.

So if we go to the end here and we see max value zero for this liquidity underpay we just have to comment it out in the source code and then rerun the suite or rerun just the shrinking part of echidna to allow it to do it I learned this the hard way, but there's a reason why I'm so willing to talk about it.

### The Final Impact and Resolution

Yeah, we basically broke it through that property. And in terms of mitigation, the mitigation that I had suggested was to use a higher scale, higher precision scale. And I think it's actually in the same commit that I was running. Because originally that one second used to be literally one second so one way was one second whereas once you add a timestamp precision of one in twenty six that obviously once one way is or even this hundred fifty million has to be divided by one in twenty six meaning that we it's basically one and a half seconds of impact that will be left with the code as it was.

And I believe the liquidity team decided that was not acceptable and so they ended up changing to a slope intercept model which is different but yeah fundamentally that was it with the bug another bug that never made it to production.

## Conclusion and Next Steps

And it's really because it has led me, especially personally, to finding an incredible amount of bugs, preventing an insane amount of economic volume. And so I can casually say that we prevented a one hundred fifty million dollar voting bug because it really is through the power of this tool. And obviously our unwavering patience in using it, but the tool allowed us to do it.

And so you should do one hundred percent consider this. And hopefully this shows you what can be done at the highest level. And so obviously all of what we thought was just one way turned out to be one second for all take for each instance, meaning that it turned out to be a massive value once you start having a ton of voting power and a ton of seconds. And obviously you could do it for every initiative. And so that will lead, I think the hundred million bug is actually underestimated. I think the impact on this bug is literally infinite because you can probably repeat it every time the truncation line is hit.

If you enjoyed the video definitely let me know and then I'll see you tomorrow where we're gonna host building a safe protocol we're gonna have james from badger dub from corn Jerome from Centrifuge and Thomas from Credit Coupe. These are all previous customers of ours and they're going to share their insight into how to build a protocol that is safe and not run into a wall where you just have unsafe code and you literally can't ship.

Thank you for your time. Have an awesome rest of your day and I'll see you tomorrow. Have an awesome one.