# Invariant Testing with Chimera Framework

## What is the Chimera Framework?

In this section going to look at what the [Chimera Framework](../oss/chimera.md) is and see how we've used it to create our [Create Chimera App](../writing_invariant_tests/create_chimera_app.md) template. 

We'll also look at an example of how we can use Chimera to scaffold Morpho, a simple real-world contract that will allow us to understand how we can write invariant tests.

### The Core Concept

The key idea of the Chimera Framework is that it allows you to write property tests using a single format and everything related to the underlying means by which you make the assertions is abstract away all so that you can effectively write your test in Solidity and use any tool ([Echidna](https://github.com/crytic/echidna), [Medusa](https://github.com/crytic/medusa), [Halmos](https://github.com/a16z/halmos) or [Kontrol](https://github.com/runtimeverification/kontrol)) to verify them.

In this first section we'll just be focused on understanding the Chimera Framework and will look at how to use each tool in later sections.

## The Four Phases of Invariant Testing
Before diving into the example let's first look at some of the key points of how to best execute invariant testing that will help reduce decision-making fatigue and allow you to do a better job.

We've developed this approach because at the end of the day, the time spent writing the test is a sunken cost. The primary value of invariant testing is in preventing bugs, so standardizing the way you write tests is key if you don't want to waste time on design decisions that you should be able to reuse between test suites and prevent you from finding more bugs. 

After looking at these different phases we'll get into scaffolding Morpho but you can skip ahead to the [Getting Started](#getting-started) section if you want to start right away.

### Phase 1: Setup Phase
In this phase your only goal should be to deploy the contracts in a meaningful state.

### Phase 2: Coverage
The next phase is all about achieving line coverage over the contracts of interest that you're testing. This is key because without it you can define any number of properties but they will be worthless because you won't be meaningfully testing them without actually reaching all possible states in your target system. 

### Phase 3: Write Properties
This phase is pretty straightforward, you define properties using your understanding of the system in English then translate them into implementations in Solidity.

### Phase 4: Iterate
The final phase is iteration, where you reflect on the properties you've written and determine if there are further properties that you could additionally implement. We'll see down below how this can often be limited by the way that we reached coverage as using things like mocks limits the state space we can explore in dependencies of the system.

The approach that we're taking with using stateful fuzzing is essentially just asking the tool for the steps that a normal user may execute in our system to achieve a specific goal instead of asking whether a state is feasible in our ways through a formal tool we simply want to get to the reproducer.

## The Philosophy of Testing

The key benefit of invariant testing is not necessarily the tests themselves but rather ability that they give you to think about and test edge cases and your understanding of the system.

The Chimera framework is here to offload the required thinking related to setting up the test suite to help you streamline your process and get you through achieving coverage and breaking properties as soon as possible.

## The Chimera Framework Contracts

The key idea behind the Chimera framework, is to use the following contracts:

- **Setup** - where deployment configurations are located
- **TargetFunctions** - explicitly state all the functions that should be called as part of state exploration
- **Properties** - used to explicitly state the properties to be tested
- **BeforeAfter** - an abstraction used to track variables over time to define more complex properties
- **CryticTester** - the entrypoint from which a given tool will execute test
- **CryticToFoundry** - used for debugging broken properties with Foundry

so that you don't have to make decisions about your test suite configuration and can get to writing and breaking properties faster (for more details on these checkout the [Chimera Framework](../writing_invariant_tests/chimera_framework.md#the-contracts) page). 

Our goal with this framework is to help you write 99% of the time using the same format that you're used to in Foundry, then give you an easy way to hook into other tools that we believe are way more powerful for testing with a particular method so that you can actually get to evaluating properties faster.

In `Setup`, we're going to put all of our deployment configuration. This can become very complex but as of now all you want to think about is that we need to specify how to deploy all the contracts of interest for all of our tools.

The `TargetFunctions` are the key of our opinionation, it allows you to explicitly state all the functions that should be called as part of state exploration. For more complex codebases you'll generally have multiple sub-contracts which specify target functions for each of the contracts of interest in the system which you can inherit into `TargteFunctions`. Fundamentally, any time you're thinking about exploring state the handler for the state changing call should be located in `TargetFunctions`.

The `BeforeAfter` contract is an abstraction that allows us to track variable transitions over time to assert more complex properties. 

## Why This Framework Exists

We mentioned above that Chimera allows you to simplify your invariant test suite creation process and run multiple tools to test the invariants you define, but we can say that more fundamentally this framework exists to standardize how state space is explored, meaning how the state of a smart contract state is altered. The primary reason we want to standardize this is because if we all agree on a way to explore state and check for properties, then we can all build tools that are interoperable.

But most importantly, we can optimize these tools so that we don't have to have this generic tool that is a hundred or a thousand times slower than what it could be if we just standardize it a bit. That's really our goal - we want to standardize how you explore state and we'll show you this today. We want to standardize how you check for global properties and how you debug repros. That's also something you'll see there today.

Our goal is really to help you be able to run other tools because the idea that there is one tool that does everything is just not true and so we believe you should be able to use as many tools as you want.

## Getting Started
To follow along, you can clone the [Morpho repository](https://github.com/morpho-org/morpho-blue). We'll then see how after you've cloned Morpho you can use the [Recon Builder](../free_recon_tools/builder.md) to get all the Chimera scaffoling for our contract of interest. 

Looking at our primary goals for this section they are: 
1. compilation - resolve all build errors so that the project compiles
2. setup - create the simplest setup possible that allows you to fully test the system's state
3. coverage - understand how to read a coverage report and resolve coverage issues 

## Practical Implementation - Setting Up Morpho

Once you've cloned the Morpho repo locally you can make the following small changes to speed up compilation and test run time: 
- disable `via-ir` in the `foundry.toml` configuration
- delete the entire existing test folder

**TODO: screenshot of the above changes**

Our next step is going to be getting all the Chimera scaffolding added to our repo which we'll do using our [Builder](https://getrecon.xyz/tools/builder) tool. You'll just need to first grab the ABI of the `Morpho` target contract from the `out` folder after building the project, then paste it into the available textbox. 

**TODO: screenshot of adding ABI**

> Note: you can also generate your Chimera scaffolding directly in your project using the [Recon Extension](../free_recon_tools/recon_extension.md#scaffold-your-target-functions)


You can see that all of my files are being created automatically for me. Most of these files should not be new to you if you follow the previous part of the presentation, but basically we'll have:
- The target functions which are custom to explore state
- Before after for those variables we have set up for deployment
- Create to foundry to translate all of the tests to foundry
- Critic tester is going to be the translator or the tool that allows us to run other tools such as the Kidron Medusa in our suite
- Properties is where we put all of our properties
- The Medusa and an echidna config

For the sake of this demo, I'll probably use Medusa because it's very simple to use and it tends to be the most straightforward tool.

## Fail Mode and Catch Mode

Something that our builder offers which could be useful to you is the fail mode and the catch mode. And the reason why you would use one of these modes is the fail mode will basically fail after a call is successful. And so this can help you, especially at the very early stages of engagement or early stages of testing, to figure out that you're going to reach coverage. I'll probably use one of these. We typically call them canaries.

And then the catch mode is useful to instead either skip or revert or to further test that. And that's because a key mindset shift of invariant testing or testing with Echidna and Medusa is that a revert is not a failure. A assertion failure is a failure, whereas a revert is just a call that you skip.

This is really important because you don't want to over clamp your pendlers. You don't want to under explore these state changes just because a revert is considered a failure. And so if you're ever gonna fuzz with Foundry, you should probably disable revert or failure on revert because it really is not the way you wanna think about this type of tests.

## Installation and Setup

Next up, I'm just gonna download all the files. By convention, we create a test folder and then we drop the recon recon.zip into it which I'm going to extract and then drop into the test folder. At this point, I'm left with a bunch of stuff. It may take a bit for you to adapt yourself, but the steps that you want to follow are not that many, they're not super complex, and we also have this installation help here.

Lastly, we have the template already done on Create Chimera app. If you find it easier to, for example, import the Morpho codebase into Create Chimera app, that could be a good way. It could be probably easier. The issue that I found with many Foundry repos is that nested imports tend to cause other issues and I don't quite want to spend a bunch of time debugging that today. I'm just going to show you the quick and dirty way.

Our first step will be to install Chimera, which is basically the helpers that will help us standardize our assertions. For the sake of clean coding, we can also grab Echidna and Medusa, and drop them in the root of our folder.

## Compilation Issues and Solutions

The simplest way is to do forge remappings greater than sign remappings.txt. And Chimera will require to have the app Chimera at the beginning. At this point, we should be in a decent spot. And this tends to be somewhat the motivating stage, because we basically have to fix all the compilation issues. So we'll just grind through them.

Because of our web app not knowing about relative path, we basically have to figure out where Morpho is coming from. And it's coming from SRC. So SRC. Morpho.sol. And then I believe we should have a bunch of issues here with the types.

[The transcript continues with detailed technical implementation of fixing compilation issues, setting up mocks, and working through the coverage process...]

## Running Medusa and Coverage Analysis

At this point, we have achieved compilation and our next step will simply be to figure out how far we can go with the coverage and the answer is going to be very low. But the first step of using the Chimera framework is to realize that anytime something works in Foundry, it will work with Echidna, Medusa, Halmos, and Control.

To run our suite we simply click or type medusa fuzz. This starts the second part of the testing engagement, where the first part was the setup. The second phase is reaching coverage.

Most likely, I'm getting a test failure because I used the try-catch mode where I'm always checking if it's going to revert. What Medusa is doing is it's going from the critic tester and since the critic tester is target function and target function is properties etc then echidna or in this case medusa will have access to all of these public functions and it's going to call them externally.

> The key insight that we are making as a part of our VTru of our framework is that clamping is always done separately. I'm going to show that today, but this is a really key insight. And we always clamp by having the clamped handlers generate a subset of all possible handlers. This is really key because obviously if once we agree on this, we can actually use other tools and even formal verification techniques to automatically generate a lot of these clamping.

## Coverage Reports and Debugging

The coverage report is vital to this type of stateful fuzzing because without the coverage report, you will literally not know what the fuzzer is doing effectively. You would have to poke an app test for all of it. And this can be a problem with all tools because if you don't know whether a call is reverting and you're not explicitly testing for specific reverts, then unless you have a way to check the coverage, you're not going to know whether some condition is unsatisfiable or whether something never happens.

What we built at Recon, and we have professional automations, but something we made for free for all people is this tool at tools slash Medusa. You can literally just grab the piece of the logs. And from the logs, we're going to automatically generate the Foundry Repro.

Now we are able to repro a broken sequence that was broken by Medusa. And we're reproing it with Foundry. And this is going to be key once we start breaking more interesting stuff. Although our goal for today is just to explore the coverage.

## Creating Mock Contracts

The first would be to enable the IRM, which we don't have. So we're gonna most likely have to mock it. We're gonna just create one. I'll create a new folder called mocks. I'll call it mock IRM dot sold.

The Oracle is actually perfectly fine as is. So we'll use the one from Morpho. And maybe we'll also use this mock right here, which uses set balance to set the balance of an account. So we'll probably just give the fuzzer away to add.

Next up, the Oracle mock. And then, technically speaking, we will want to have two ERC-s. So we probably want to deploy that. We can call it asset and liability.

## Market Creation and Handler Implementation

At this point, let's grab these market params. We're gonna declare here market params and params, memory params equals to market params, where each value is gonna be this. We'll basically put the loan token is gonna be the liability. The collateral token is gonna be the asset the oracle we have up there oracle mock then the irm is mock irm and the lltv is going to be eight seventeen.

And this is going to be cheating because one of our rule is that we don't want to cut out inputs from our handlers. But once we take this type of trade off, we just accept it. So it is what it is.

## Clamped Handlers

At this point, I'm gonna add the following line that says this is automatic handlers. Basically, these are the handlers that explore all of the state, whereas up here, we'll have the clamped handlers. And so whenever we're doing stuff like supply, we will basically define a function more for supply that only receives the assets, for example.

And so this is kind of how you will introduce clamping to your handlers. Because by doing this you're giving the tool a chance to explore more weird stuff but at the same time we're not gonna have to wait until tomorrow to get to coverage.

## Conclusion and Next Steps

That's fundamentally how you get started with this type of testing. It is not easy. It can be tedious. But at the same time, in about an hour, for some contracts, maybe four hours, maybe a bunch more for more complex ones. But you eventually get to coverage. And once you get to coverage, you can finally look into properties.

I'm gonna wrap up the session like this if you have questions feel free to dm me on twitter or on discord. And tomorrow, we're going to look into our newest version of Create Chimera App, where we add additional ways to explore more interesting states by having standardized assets and standardized colors, meaning that instead of having to set up all of these tokens yourself and also being limited to only having address Ds as the sender, we're actually going to show you how we can add more so that you can explore even more interesting transitions.

Thank you for joining me today and I'll see you tomorrow, same time, same Twitter account, and have an awesome rest of your day.