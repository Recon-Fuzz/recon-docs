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

If however you need to implement a more complex test that can't be implemented as a global or inlined test and requires multiple state changing calls you can use the `stateless` modifier which reverts all state changes after the function call:

```javascript
    modifier stateless() {
        _;
        revert("stateless");
    }
```

This ensures that the actual state exploration done by the fuzzer is handled only by the clean target functions which call one state changing function at a time, this keeps what we call the "story" clean in the case of a broken property where having individual handlers that each handle some change of state makes it easier to determine what's going on when looking at the reproducer unit test.

The `stateless` modifier on the `DoomsdayTargets` however allows testing for specific cases such as withdrawing an entire user's `maxWithdraw` amount and determining if this sets the user's `maxWithdraw` to 0 after: 

**TODO: code snippet for the above example**

If our assertion fails we'll get a reproducer in which the function is the last one called, however if it doesn't the fuzzer will revert the state changes and the function that will be used for exploring withdrawals will be the primary withdrawal function.

## Practical Exercise: Rewards Manager

For today I have a very cool exercise we're going to scaffold the rewards manager I'm going to use the extension and I'll try to reach coverage maybe I'll spend twenty minutes on this we mock tokens we mock volts and we're gonna focus on reaching coverage.

If you want to follow along you can go on my github gallup as well and the repo is going to be called rewards manager invariance and I've already cloned it locally and for the sake of time I've also deleted the test folder and because I have access to the recon extension I can just go on the Recon extension, select the rewards manager, and then click on scaffold.

And it's going to basically set up a ton of code for me. We're going to have the managers, the helpers, the mock token, the targets, and we're going to have all the targets already set up for us. You can see that we have epoch, token, et cetera. So we're definitely going to have to do some clamping. But at the same time, we're already in a decent spot.

## About the Rewards Manager Contract

Actually, something I have to say is I'm shocked nobody stole this code because to me, the rewards manager is like one of the coolest thing I ever built. You can put as many rewards as you want. It's all going to work and it's actually fairly gas efficient you can definitely spend more time to optimize it but it's already pretty decent.

And the way it works is you as the vault you would just call a notify transfer to say whether something was deposited something was withdrawn something was transferred and that would basically handle all of the crediting of the internal balances so technically speaking an eoa could could do this call and it could automatically generate a point system so in my opinion it's such a cool contract.

And then when we unload the policy we basically check the current epoch we are creating a user we include the vault and we give them some sort of points and so we're already you can already feel about something here where total supply would be the total amount of shares that we issued. Shares by user would be all the shares that the user has for a specific vault.

## Initial Property Planning

And so we can already start what I would call the invariants.md. which would basically be a quick doc where we would list some properties. And so the first property would simply mean be that total supply of Vault must match some of what was in balances, shares, some of shares for Vault and users.

And you can see that there's these, no, actually, yeah, there's these here, it's a square back of current epoch. So you can see how, over time the math can actually desync. I would just make a note that it's indexed by epoch. So it could break and I would expect this to break if we do a naive property, but I don't necessarily expect our system to be so naively insolvent, although we'll see. We'll see if that's the case.

We also have a function to accrue and basically then we have our good old rip and tear, which are functions to perform optimized claims that also destroy storage slots, meaning you no longer can claim on those past ebooks and they do that so that to trigger gas refunds, basically. So there's actually quite a lot of thought into this.

## Setting Up Actors and Assets

To get started, the first thing we want to do is we want to register some actors. So we'll do good old A one C three and we'll do good old Bob. And maybe we'll put another one. I guess we'll call it coffee. And so we're basically gonna have three actors. Each of these actors, we probably wanna give them some tokens. And obviously we also wanna have some tokens.

So let's do add assets. So we're going to have a, let's see what our asset was. It actually needs to be a new asset. So let's do new asset with eighteen decimals, a new asset with eight decimals and a new asset with six decimals. All of these will be mockier C-twenty. You could obviously extend our suite to have more types of tokens. But fundamentally, this means that our switch is going to use three different types of tokens with three actors plus this.

And for the sake of testing, we're going to use this as the admin, whereas every other actor is going to be considered a user. So what that means for us is that the we're going to go in our targets, in the awards manager targets. And so in the line that is tied to notifying, so notify transfer, we'll actually change it to as admin.

## Creating Clamped Handlers

For now, what we could do, will be to have the following set of limitations. It will be tokens, it will be vault equals to this, and then it will be users equals to the actor. So for now, we could simply start by just taking the most simple function, which is going to be flame reward.

And so we could just do a quick flame reward clamped. And I'm guessing the only thing we want to grab is going to be the epoch ID. And because we call the claim reward function, which already pranks, we're not going to add any additional checks here. We're just going to call this one.

And so the epoch ID will be a parameter. The vault is going to be address this. The token is going to be get asset and the user is going to be get after. So that's basically going to be our clamping for this function and then we could also do claim rewards, but I think for now this could be a good point in which to start the fuzzer.

## Running the Fuzzer and Debugging

At this point, this is where we will go take some sun and just wait a bit. But definitely stick around because the second part of the live is going to be around this bug. Let's just see what the tool can do in the meantime.

The nice thing about these type of tools is that they memoize their progress. So even though I have to restart it, this is a key that I quickly retriangle of its previous corpus, which means that I didn't waste five minutes in waiting for the fuzzer. I wasted maybe twenty seconds, thirty seconds, but it's still way more than what Foundry takes. And this is why we advocate for you using Foundry at all times. And then running the fuzzer for what it's best, which is actually breaking the property.

## Writing the First Properties

At this point, the fuzzer is running. Maybe I'll give it a few more minutes. And so I'm going to go back to my invariant nodes. And you can see how we have this total supply vault, sum of shares. And then we also have these implicit ones of sum of user balances. Must be less than equal to total supply, but I guess we have it. Whereas we probably want to check for rewards of user must always be less than the balance of the token.

So most likely this is the next property we want to investigate and I'm going to be writing them in a moment. So let's see if we have a way to know what the total rewards are. I guess we have these rewards info per address per epoch. So basically, what we could do is we could ask the contract what the latest epoch is, and then sum up the rewards, and then we should be able to figure this out.

So basically, we will go for each epoch, sum up all the rewards for this, and then get total and then assert total is less than equal to token dot balance of so I think we have the information we need to set up these two properties and now we're going to see whether they actually break.

## Implementing the Total Supply Solvency Property

We're going to go in properties dot solve and so we'll start with the first one property underscore let's call it total supply solvency. And so we're going to get the rewards manager, which is called rewards manager. We want to get the, what was it? We probably want to get the shares and we probably want to get the total supply.

And I'm pretty sure we're going to find something interesting here. So I'm going to write it in a fairly naive way. But most likely we want to do UH-FF-Six current epoch. is going to be equal to, is there a way to get the current epoch? Yeah. We're going to get the current epoch, which is based on time.

And so then we'll have a simple accumulator, image five, six, hack. Then we'll do while hack is less than equal to current epoch. We'll just increase it at the end as opposed to increment. And we'll then grab the, for each, what do we do? For each user, so we probably want to do a for loop, UH for six I, I less than, get actors, not left, I plus plus.

## Property Breaking and Debugging Process

And I'm pretty sure this party will break. So it's going to be interesting to look at this, but basically we'll just do epoch plus equals to rewards manager. And then we want to assert that the shares at epoch match the rewards manager dot total supply of the epoch at the vault, epoch at vault.

And because of how accrual works in this contract, I'm pretty sure this will break. But this is a good property to write naively and to debug. So I'd be happy whether it breaks or not. And so we'll say that the sum of user shares must match total supply. We'll see how this pairs.

So this is probably a good time to just stop and see what the fuzzer is going to do. So I'm going to stop. And then I'm going to check the coverage. Then I'm going to check the property. And then we're going to resume, just because other ways this can get too overwhelming. And obviously, at home, you can go at your own pace.

But I will typically do one property at the time, especially if I expect it to break. Because obviously, if it's right, I don't care. But if it's going to break, what's the point writing another one.

## Coverage Analysis

So now I'm using the extension to click this button, which is going to basically simplify the coverage report and only grab me the stuff that I want. And so we can see that we were able to get the notification system. A deposit was done. A withdrawal was done. A transfer was done. The accrual of a vault was done. This view function was not called. The check for the time left was called. The total stock price epoch was definitely called. And then user accruals were done.

So let's see if a user was able to claim. We see the claim rewards. We see a loop here with the call to claim reward emitting. And then we see that the user epoch total points were equal to zero. So it seems like we're having a bit of an issue in getting to claiming. because we always get to a user that has zero rewards.

## Property Failure Analysis

The next step will be, let's say I'm going to comment this out. I'll show you how you can figure out that this will break. Basically, you'll see that Kidra is literally going to have issues. It's going to just start to chug because it's the same as driving a car without inserting any gear and so you're really just trying to basically crush the car.

And so anytime it will call this it's gonna have issues where it will just its performance is gonna massively decrease because we fundamentally have this check that once the epoch has increased will massively limit what the buzzer can do and so if you check the number here you'll see that it's stuck at ten thousand. And that's because every time a worker gets stuck, it's basically gonna be shoot with a line.

## Property Refinement Process

And another way to debug the property will be to go and create the Foundry obviously, and just call it. But basically, this is going to run out of gas, and it's going to break eventually. I mean, the fact that it takes this long is also an indicator of something being wrong.

So we'll just give it a few seconds for it to break the property. And then from there, we'll just grab the repo that is shrunken, hopefully, and we'll use it to investigate this property being broken.

The property is broken. And then we're going to just paste it in the tool, and we get this line like so. So let's go back to Critic Tester, paste the Foundry repo. And now we're not going to read the Echidna output. There's no point. We're just going to use the Foundry test because it's so much more efficient.

## Understanding the Property Break

And we can see that the sum of user shares must match the total supply. So obviously, this is still a bit dense. And the way you would, I mean, on one hand, you can debug with dash vv because this is okay in terms of why the property is broken. But what I like to do to open up properties would be to basically get the body of the property and just paste it.

So that way we get the all of the logic that is being used and then obviously we're just going to console I guess we don't need to console the log because we're going to get it but basically this is saying that the user share for zero is zero and instead the amount on the total supply is greater than zero.

And so this is actually a mistake that I made where the notify transfer function is open and it still allows to send tokens to anybody. And so as long as we allow anybody to receive these tokens, we basically are going to have this issue. So for the sake of demonstration, I'm just going to remove it.

## Finding Potential Bugs

This phase of writing properties is very common. You basically end up specifying some property, you didn't think about it too much, and it basically breaks. I believe in this case, though, the reason why is because any time we change a deposit we have to grab the previous vault and you'll see in a crew vault I'll show it in a moment but basically we have to bring back that value whereas for the user you actually don't need to do that.

And so I'm pretty sure the total supply should always be greater than the user shares and then to properly track the accounting in a more strict way we will most likely have to do a lot more work because we basically have to call these accrue functions.

We're seeing that the sum of user shares must match the total supply and we're seeing that the property is breaking with the share that epoch being greater than zero whereas the total supply at epoch being zero and so we will be able to fix this in many ways, but before we do that, I feel like we may have found a real bug, which would be interesting.

The reason why I say it is because my theory is anytime you notify a transfer, so anytime we notify a transfer, we have to get some accrual. We have to trigger some accrual of the vault which means that the total supply should always be updated to the latest value unless nothing happened this week, this epoch.

## The Liquity Governance Bug Case Study

So to top off this introduction, I want to talk about a bug we found on the liquidity Vichu governance repository. And basically we were engaged by Liquity to write their Vichu governance after it was already sketched out. And we spent quite some time rewriting a bunch of key flows. We added a final state machine. We really spent a lot of time trying to fix a bunch of issues and secure the system.

And we basically When we left off, we basically run in the cloud via Echidna, and we run it with what is called optimization mode. And optimization mode basically lets the buzzer try to give you the maximum value it can.

### The Properties That Led to Discovery

And you can see that we have a bunch of properties here. and the most you can see the name one of them is optimized property sum of initiative matches the total votes optimize the maximum claim insolvency optimize the sum of liquidity global user matches underpaying meaning it's underpaid instead of insolvent and then we add this underpaid claim which was which looked really big I think this is a three hundred million but this turned out to be a false positive.

But when you see a number like that you obviously don't want to just know be like oh okay I see you guys you actually want to investigate it and then the the the big number we found through this mode was optimizing the sum of initiative matching the total votes and we basically found this insolvency where summing up all of the votes of initiatives in the governance actually resulted in too many votes being available to users.

### The Root Cause: Calculate Average Timestamp

And so I'm going to show you exactly how we found it. To demonstrate the bug we go to a previous branch recon is actually surprisingly good archival of historical state. You can get the previous corpus from our run. You can see what the fuzzer actually did. And then we are basically going to the repo at this commit.

The back story around this bug is tied to this function right here called calculate average timestamp. And I think this is the version that was already fixed. But basically, calculate average timestamp used to basically just be this uint-thirty-two for a block timestamp. will call this function average h which I think is not an average but it's literally just subtracting against the previous value so it's literally just a delta.

And then it will give a weighted value and it will perform this division with truncation of to generate a new outer average and then it will grab the current time which is basically right now minus the new outer average.

### The Voting Power Mechanism

This was very complex in my opinion, and I think everybody can agree that it was complex. But fundamentally, what it was trying to do is it was making it so that when you deposited a hundred million dollars in liquidity that you flash loaned, you will get zero voting power. And when you stay for one second, you will get the amount plus one second, et cetera, et cetera.

And anytime you withdraw, it will compute all of the value as time and it will subtract it, meaning that you will lose a lot of voting power. Whereas anytime you will deposit, it will socialize the time. that you wouldn't be able to receive more, meaning that depositing new stuff actually doesn't give you any new voting power. The voting power starts from now and it goes in the future.

### The Critical Truncation Issue

However, as you can imagine, give me a division line and I'll find you a crit. And the real problem is that this division obviously creates truncation. And truncation means, if you're not familiar with low-level programming, When the computer truncates a value, it means that it's literally going to remove that and it's not going to carry it.

And so the impact of truncation when we started the engagement was thought to be up to one second. That was what people thought, and it was me, other auditors, we all agreed that there was an impact, but this was a low severity impact.

### The Property That Revealed the Truth

And instead to fully explore this, we basically wrote this function called property sum of initiative matches the total votes strict. So property sum of initiatives And so in the governance properties, we basically wrote this very simple solvency property.

We have a function called get initiative state and global state. It basically grabs the current global state and the state of all the initiatives. It gives you the allocated liquidity sum, the total counter liquidity, the voted power sum and the governance powers.

And that's because instead of comparing the time and the amount, which was really complex to me, I basically just multiplied everything into times, time, times. amount so that it will give you a scalar value that was easy to compare. And I just match it at requiring that it would match exactly.

### Escalating from Low to Critical Severity

And so what actually happened was that the voting power was not and maybe even delicate liquid but basically this property was breaking and so anytime a absolute property breaks with the buzzer you only have two options one of them is to investigate the code which obviously you have to do eventually but the other option is to figure out if there's some sort of a clamp or sort of a limit to the error.

And when you start by the assumption that this line has a one-second bug, then your rational decision would simply be to put a tolerance and just ensure that the balances are correct within some bound. And that bound, in my opinion, shouldn't be considered absolute. You would have to compute it as seconds.

But fundamentally, This is not an uncommon way to ensure that a value that is incorrect, but it's incorrect by a certain amount, it actually is not more broken, basically. And so that was the idea. And it broke again.

### Using Optimization Mode

So what I did is I literally, unironically, I just grabbed this command and instead of having assertion mode from Echidna, I will use optimization mode. Then I would have to refactor the property from this absolute value to optimization property that uses this pattern which is a very common pattern for optimization.

Where you would have a sol in solvency at an underpaying pattern you grab one of the true values you do left greater than right or right greater than left and then you just take the int to five six of it and you return it and what we ended up finding literally I'll run it right now, but we ended up finding is that the insolvency that we thought was gonna be very marginal turned out to be in the hundreds of million of dollars of voting power.

### The Revelation and Impact

And so obviously once your optimization run shows you that, it doesn't matter because at the time the output from the tool was absolutely unintelligible but it really doesn't matter what the tool will spit out in terms of how to get to that point once you have done the diligence you are so confident in your assessment of the precision and the precision breaks and then you run the tool and you get this value in this case it's thirty two million in the local fuzzy run it should be over a hundred twenty million.

But basically you know that this is not gonna be abandoned and so that's where we were left for a few days, mostly due to my own limitations. But I'm going to show you what you would do from there to actually properly debug the bug.

### Key Takeaways

And so I hope this, if there's any takeaway from today, is that a global property breaking should make you reflect, should be a cause for pause and consideration about how the system works. And then you can escalate your own work through these three levels of the exact check, the exact check with bounds, and the optimization mode.

And given my extensive experience in being wrong, in thinking that the impact is low, I will generally say that if you can't do the equivalent check, you should always refactor your property into an optimization mode. Because once you let the fuzzer run for a bit and it starts giving you this value, let's see what it is. A hundred fifty one million. Like at this point, all you want is to get a repro.

### Technical Details on Optimization Mode

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