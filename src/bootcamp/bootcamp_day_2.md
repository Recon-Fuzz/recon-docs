# Adding Multi-dimensionality to Invariant Tests

## Introduction and Goals

What's up? I'm Alex from Recon. Happy Tuesday. Today we are resuming off of our previous session in which we quickly scaffolded an invariant testing suite for Morpho. And today we're going to reach one hundred percent coverage. We're also going to add multi-actors as well as a multi-asset setup. This is also going to be the first live in which we show the create kimera app version two which we open sourced as of yesterday so get ready we're gonna have an awesome live and maybe we'll even find a bug.

Today our goals are going to be to get one hundred percent coverage on the Morpho repo. If you're following along or if this is the first live, you can go on my GitHub, github.com and you can grab morpho-live-demo. The commit for F seven is the one from yesterday, and that's exactly where I'm going to get started from.

## Bug Fix and Setup

There's actually a bug I believe it's in the coverage mappings for echidna medusa where we have to set this bytecode hash to be basically we have to remove it otherwise we're not gonna get the coverage report and that was the bug I was running into yesterday so this is really the only change I applied. I did try to change the imports, but that wasn't necessary. So if you're following along, that's not going to matter.

As of now, we have a bunch of targets that are all unclamped. And then we have two clamped targets for supplying and for supplying collateral. So for the sake of today, we're going to use Medusa. So I'm just gonna run it with Medusa Fuzz.

What Medusa is gonna do is it's going to explore a bunch of paths. It's gonna build us a coverage report that will actually work. And so we're gonna just wait a few minutes to have it build that, because that's gonna be our eyes to understand how we can improve the state space exploration.

## How to Evaluate Coverage Reports

The first question is, how do we evaluate a coverage report? And the answer is fairly straightforward, although it takes a bit of getting used to. But fundamentally, anytime you see a green line, this means that the line was called. And anytime you see a red line, it means that the line wasn't called.

And so barring any weird issue with coverage, we basically will just trace a bunch of lines that are green, and then eventually we'll find a red line. And that red line means that the fuzzer was reverting there. And because we have these by modality where we can use the fuzzer to explore the state, but we can also use Foundry to debug the same handlers that have the same state, they have the same config, everything matches. 

That means that anytime the fuzzer gets stuck, we can just stop it, figure out the coverage, then build a quick repro in Foundry and then figure out how to get to a higher level of coverage.

## Key Insights for Handler Design

A key insight that we applied yesterday and that it's really important is that you want to reuse your unclamped handlers in your clamp handlers. That's because over time we may make these unclamped handlers such as Liquidate here to have a bunch of tracking and a bunch of pranking and a bunch of other features. You don't want to have to apply all of that stuff to all of your handlers.

As a general rule, the clamped handlers are a subset of the unclamped handlers. They are just calling that with less parameters. And then you want to keep this in mind. But any time we're going to build something too complex, we're going to introduce this simple modifier where we're going to run some sort of a test, and then we're going to revert it.

And that's because for fuzzing, reverting doesn't is not negative it doesn't cause a failure reverting simply means that the handler has no impact on the story it has no impact on the state and so we can do a bunch of crazy stuff like try to deposit and self-liquidate and close all the positions and that we can go back to the previous state so that that way we don't have this sort of a snapshot that new state. We simply go back.

## Avoiding Overly Complex Code

Something that most beginners do, this is literally a screenshot of one of our students at the environment testing boot camp, is they start writing this overly complex code that's really hard to track. And so generally speaking, you want to keep things simple.

The key insight that I'm going to share with you today and going to go deeper on, is this idea of having public handlers to switch a specific configuration so that you can have dynamic configurations that are tried by the buzzer.

## Actor Manager and Asset Manager

Specifically, with our open sourcing of our Create Chimaer App tool, we're going to open source the Actor Manager and the Asset Manager, which are basically these two contracts that completely abstract the need for you to handle multiple actors and for you to handle multiple tokens.

And the reason why we want to do that is because ninety nine percent of our customers they end up having some sort of a system where many addresses can perform calls and they end up having a token or some tokens. And so having a simplified way to manage that ensures that you don't have to waste time repeating the same basic configuration, which at the end of the day always boils down to having some sort of a variable and then having some sort of a function to switch it.

## Future Extensions and Use Cases

At the end of today, I'm going to show an extension that we built that effectively enables all of these use cases. This is going to be the first part talk about something that we're going to do tomorrow, where tomorrow we're going to scaffold a new repo called Rewards Manager. We're going to write some properties. We'll also talk about a critical bug we found when working with Liquity, where we found this critical bug that allowed us to mint hundreds of millions of dollars of forged loads.

So today is the prerequisite for you to be able to understand what we're gonna do tomorrow. So stick around, go through the code with us, and you're gonna have an awesome time.

## Coverage Analysis - Initial Results

At this point, we've run the fuzzer for a few minutes. I'm gonna stop it and every time medusa will just generate a coverage report we're going to grab it and we only have one contract we're looking into called morpho.sol.

This part is very repeated very tedious and we see that we have a seventy six percent coverage on morpho. It's important that when I say one hundred percent coverage, you don't blindly just look for one hundred percent because, for example, we may not need to track this extra load function. So we don't need to have one hundred percent coverage on the contract. We need to have one hundred percent coverage of the meaningful interactions. And so that includes borrowing, liquidating, et cetera.

## Analyzing Specific Coverage Issues

Basically, we see a line here that is green, and then we see a line here that is red. The number here is actually indicating that in the corpus, there were twenty-four calls that reached this point, and we have a red line here. My belief is going to be that Medusa is just passing a signature that is invalid, and because of that, this line always reverts, and so we never go here.

However, because we're using the optimizer in our Foundry.Tunnel, boundary.toml, there can be scenarios in which the coverage report is incorrect because coverage mappings by the compiler are incorrect in those cases.

We also see a lack of coverage on Flashlum. We see that we end here, which obviously is because we didn't implement a Flashlum provider. So we're just going to leave with this. From manual analysis, I don't quite see why we would care about having to look into reentrancy here. The only exception will be performing operations when we have a lower amount of tokens.

Then we see the meat and potatoes of the contract, which is the call to liquidate, which seems to be reverting here. So we most likely want to investigate that. Whereas here we see what I mentioned, where we have the repay having red lines here, but then we see green lines below. And this may indicate that repay is actually working.

## Implementing Canaries

In order to figure this out, we're going to use a canary. And then in order to work on the liquidate, we'll instead follow the Foundry approach of using Foundry first and figuring out whether the handlers is able to reach that coverage.

Let's grab the name Repay, go in the target functions. As I'm coding, I'm going to let Medusa run in the background because maybe the handler is already good enough. The idea that I stop pausing while working is dumb. That's also why we run invariant tests in the Cloud, because we want to just build a big corpus and obviously, the fuzzer is extremely wasteful in his attempts. And so the more time we just give it to try stuff, the better it's going to be.

So we see repair. We see that it's written in this way, very basic. So in order for us to introduce a canary, bool has repaid and then we will set bool as repaid to true after the call. And that's because, as we said, a revert would happen here and a revert wouldn't cause a failure, but a revert would mean that this line will never be hit. And so we simply want to make sure that this line is hit.

And then for the sake of proper coding, I'm going to go on properties and basically I'll add my first property, which is going to be called Canary. Canary has done repay. And I'm being fairly liberal on my coding convention. But as a general rule, we put an underscore to separate what we are aiming to do, such as canary, invariant, property, or target contracts, such as Morpho. And then we will typically do camel case on the rest.

Our assertion will simply assert that Azure Paid is always false. So we'll simply assert that Azure Paid is always false by saying T, which means true, not has repaid and basically we just say something like canary has not repaid because this is a canary property.

By convention as of today we tend to support echidna most of the time and because we work with echidnas so often because medusa used to be a lot more unreliable. We always express properties that could be expressed as view properties as assertions so that we can always run them with Echidna. This can change in the future.

## Adding Liquidation Canary

At this point I introduce the canary for doing error pay. I should probably introduce a canary for the liquidation as well. So let's see more for liquidate. I'm just gonna take it slow here. But basically I'll just do more bool has liquidated.

Obviously this is also wasteful approach in the future we're gonna add some sort of a thing that says something like recon canary and it automatically generates this for you so use our framework and things are gonna get better over time.

I'm just gonna copy the logic for the canary with not has liquidated. I'll just replace the name here. And so fundamentally, these are canaries just for coverage.

## Corpus Reuse and Fuzzer Intelligence

So we're going to stop the fuzzer. We may or may not check it, but when we rerun the fuzzer, first of all, we're gonna have a compilation issue. But what I was saying is when we rerun the fuzzer, the fuzzer will use the corpus, which is the call sequences from the previous runs, meaning that the fuzzer is basically getting smarter over time. And this is why you wanna keep running the fuzzer.

Because of our template, we can just forge build to get a better formatted error. It says that the identifier is not recognized. So it's because I declared it here. So I'm just going to move the canaries to the setup file.

## Investigating Liquidation Handler

At this point, I'm going to investigate the liquidation. We had already set up this test demo where we borrow. So next up, we will simply want to set the price to something really small. And we want to see if we can perform a liquidation.

So let's go to MorphoLiquidate and we will simply liquidate ourselves. We've addressed this and then we've seized assets and repaid shares. We can quickly imagine how this is gonna be kind of an issue because we don't exactly know what these are. Whereas this one will always default to a empty volume.

All right, so this was successful, meaning that the liquidation went through. We can inspect the logs via decode internal. I believe there should be an event for liquidations. We see that the liquidation was successful. So what this means is that the tool is theoretically able to reach coverage.

## Tool Sophistication Limitations

And then it's going to probably struggle because of, honestly, because of lack of sophistication in it trying, especially when it comes to variables that have dependencies. I believe this is still something that is not fully explored and fully optimized in these tools and so hopefully one day they will but as of today we're gonna just increase our likelihood of getting to coverage by adding a clamped handler for liquidation.

We're also seeing the repay never went through it never broke so we probably want to investigate if repaying fails. And so this also works. So fundamentally what we're experiencing is the issue that the buzzer is fairly not sophisticated in being able to find the path.

## Creating Clamped Handlers

We could try running Echidna. This is what I personally will do. I tend to like Echidna more. But it could also just be that both tools require more than five minutes to reach a meaningful coverage. Maybe one hour, maybe four hours, something like that, will mean that on a zero configuration, we will still be able to reach this meaningful coverage.

Whereas if we're really know in a hurry and we don't want to wait we'll again we'll just create these two clamp handlers. I'm just going to copy the functions so I don't forget them. I'll paste them here for a second and basically write function morpho underscore liquidate underscore clamped.

And I'll call it assets because I want to use just this variable and so I'll just pass you into five sticks assets. And basically I'll just call the other version of the function where the borrower will be addressed is, and then the assets is gonna be seized assets, and then zero and then X with empty data. And so this is gonna be my plant assets liquidation.

## Echidna Results and Workflow

From my experience, a few lines of morph are really hard to hit. And they will be tied to this. Because in order to hit them, we will want to have the RPC, sorry, the the fuzzer have exactly zero collateral. And so a way to do that will be to have an exact liquidation where we pass the seized assets to be exactly equal to the collateral value.

You can see down here that Echidna is starting to do its job and quickly falsifying stuff. You can see the canary, both canaries have been hit very quickly. And in this case, it seems like there's an all zero chance that they're being called with the no clamp version, which is always cool. But fundamentally, we basically reached coverage for these operations.

And then in the background, what Echidna is doing is it's shrinking this massive sequence, right? Because this is ridiculous. How would you work with this? You will go on our tool, paste it, and you will still have, you know, four underlines of gibberish. So what the tool is actually doing in the background is shrinking it, and it's pretty efficient at it.

## Tool Configuration and Repro Generation

This really shows you what our workflow will look like. Once we get the repro, we will just grab it here. You can see that Echidna gives this beautiful, fully shrunk no extra unnecessary data in any of its sequence so we can just copy it put it in our critical foundry and now we have a quick way to debug stuff.

What we did in our template which you can access after recon pause slash create camera app is we already configured all of the tools. We're working to also make almost one hundred percent compatible so that every tool starts with the same state, the same address, the same config, so that you don't have to think about it. So when a tool such as Aquila prints out this address, this address always means the same thing for everybody.

## Remaining Coverage Issues

And so we effectively got the coverage we wanted. Something we will do in the background will be running in exploration mode so that the tool continues to give us further states that are interesting. And then in the meantime, we will go and we will inspect the coverage report off of Echidna.

We can see that everything is done here. We see this line right here is not being hit. And I'm not surprised because our shortcut handler is using, I believe it was using seized assets instead of repaid shares. So we most likely want to have a shortcut for that.

And the last thing we probably want to have a shortcut that uses exactly the collateral, which is basically the way to get the tools to explore the states very quickly.

## Creating Additional Handlers

It's important to note that even though we're adding all these shortcuts to quickly explore the state, we will still want you to run the suite for a while because all of the unclamped handlers at the bottom of the file, they may try combinations, that we are not thinking about by having all these clamped versions.

And so the key principle of the Chimera framework is that we are using a subset of the calls. We're not removing them because removing them means that you're not checking for those.

Now that we establish that, we can go create another handler to perform a liquidation with clamped shares where we will basically just pass shares here instead of assets. And we would expect this to be somewhat successful.

And then the last one will be to hit this line right here, which is position ID borrower dot collateral. So I'm going to have to think about it. But fundamentally, we just want to grab these positions.

## Multi-Dimensionality with Create Chimera App V2

That was basically it in terms of coverage. I think we're going to get to one hundred percent very shortly. And from here, what we're really missing will be adding the multidimensionality, which comes from the work we've done with the second version of Chimera, which is the current version available at the reconfuzz slash create Chimera app.

And so the changes to our template are going to be not that many, but we're fundamentally adding these managers. We're adding managers which we import from a helper setup, and then these managers work in the following way. Whenever you want to add a new color, you will simply add actor. Whenever you want to add a new token, you will simply call new asset. You then have a hook for finalizing deployment, and then you will simply use these modifiers that allow you to prank as admin or prank as actor.

## Extension Demo

To show you a quick demo, I'm actually going to use the extension, which is how we work now. We're going to let our customer use the extension for now, and then eventually we'll open source it to everybody. But basically, I'm just going to delete everything. Literally, I'm starting from scratch. There should be zero tests here.

And so I'm going to just go on the recon cockpit. Basically, I'll click on Morpho, which is one of the contracts we want to test for. Basically, I'll just click on Scaffold. If you don't have all the stuff installed, it's going to install it. It's going to then generate a recon.json that allows us to handle the different modes that we want to support with the extension.

Then it's going to install a bunch of stuff such as the managers, the helpers, a mock token, Your targets are going to be automatically generated. You can see literally all of the stuff we already built has been automatically generated for us.

## Manager Targets and Multi-Actor Setup

And then we're going to also have these manager targets, which introduce functions that allows us to switch between different actors, which is handled by the actor manager and assets, which is handled by the asset manager.

So this basically means that when you register a new token, right or register a new actor and then you add these boilerplate you basically now have a multi-token multi-asset multi-actor setup that works out of the box.

To quickly scaffold this I'm gonna set up the admin as this. I'll then add a new actor so I'll just call it address wax A one C three and then we'll add Bob. And in terms of assets, we can just do new asset. The. Eighteen and then a second you asked the dating and basically will have the implicit understanding that one of them is the collateral and the other one is the debt.

## Modifier Usage and Clamped Handlers

We then need to grab the modifiers. And basically, we're going to be able to set our targets. I believe the extension automatically does it. You can see here and the extension also enables all these toggles. You have as admin, you have as actor, and you also have the modes that we showed you the other day, the catch mode, the fail mode, the normal mode.

The only piece missing would be that you would want to use, basically you would want to have some logic to set a new market. So probably we would add a handler and the generic handles we typically put in the target function. 

And so if we wanted to kind of close this idea, we will probably do function, create new market and you basically will just create a new market with the assumption that the active token is a collateral and the other tokens is or other token is that.

## Mock Generation Feature

Another cool thing that the extension does is it allows us to mock stuff. So yesterday when I showed you how to mock, I had to grab an ABI. But the way we can mock with the extension is we can literally right-click, Generate Solidity Mock.

And it's going to use an idea that we want to explore further with the Chimera framework, which is going to be inductive proving, where we basically mock everything except one contract at a time. But these mocks allow us to do this. Basically, this will allow you to have a handler to set that will be returned by the functions that will be instead returned by the contract, meaning that we basically figure out all the view functions and that we give you sectors for all of them, one hundred percent automatically.

## Advanced Multi-Asset Features

Once we have scaffolded the project now given the create chimera version two we also have the ability of having these multiple actors and the multiple tokens and anytime we need to create a clamp so let's say we want to create a clamp like we did for liquidation we will still be able to grab it we have a separate section here to add the clamp handlers.

And so we will remove the borrower and instead we will, for example, just get the actor. And this will mean that we are trying to liquidate the current actor that is live. Technically speaking, you basically would only perform self liquidations in this way. But if you wanted to instead grab a specific actor and a specific index, you would simply do get actors and then pass whatever index you want.

There's also, I believe, a way to get a random actor. which you will be able to do by, you would basically just pass actors entropy. And so you probably just wanna add a utility function to do that and then you will still be able to clamp in a similar way to how we did where you would only pass some values and then you would use everything else as our code.

## Dynamic Market Creation

And if you wanted it to be further simplified we would simply do a module get assets dot length plus one so that you always get some value that is going to be within those limits. And so from here, you would basically keep the function open. Obviously we would add the code we had the other day to create a market.

Basically you will do something like this and now anytime the fuzzer calls this function it will actually deploy a new market with these tokens and obviously if you wanna make this even more chaotic even more advanced you would actually go in the asset manager or sorry in the manager targets and you would actually enable this function called add a new asset which allows the fuzzer to literally deploy a new token meaning it literally continues to possibly register new tokens and try new decimal combination which could be interesting.

## Conclusion and Next Steps

On thursday we're gonna have another live with some of our customers hopefully we'll talk about this technique more in detail but generally speaking for basic testing you would comment this out because having the multiple assets here plus the actors should be sufficient to help explore the vast majority of interesting states.

If you're interested in giving this a shot go on GitHub recon-puzz create Chimera app and coming soon with open source more stuff. That was it from my end. If you wanna look for more resources, there's a bunch of YouTube videos and podcasts that I did. This one is with Shafu, scaffolding MicroStable. We also scaffold a mock landing protocol with Austin. I gave you a demo of the extension.

Join me tomorrow at the same time where we're going to instead write new properties for a contract called the rewards manager, which is an audited contract that I wrote that was never deployed. So there's a no zero chance we'll find something. And I'm also going to show you how by using these techniques and this template we were able to turn a low severity truncation bug right one way or ten ways of error into a critical that impacted hundreds of millions of dollars of forced votes.

That said thank you for watching and I'll see you tomorrow you have an amazing rest of your day.