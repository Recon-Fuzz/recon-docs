# Invariant Testing with Chimera Framework Tutorial

## Introduction and Welcome

What's up, Twitter? Today, we have a banger for you. We're going to help you get started with invariant testing. We're starting in four minutes, so sit back, relax, and share it with a friend because I need more validation. They will scaffold Morpho, so we'll actually do pretty cool, simple contract. And before that, I'm going to introduce a few ideas.

Welcome. Thank you all for joining me. If you want to follow along, I'm going to share my screen a moment. And today we'll look at the Chimera framework, which is a framework pioneered by Antonio Vigiano and that we at Recon have been pushing forward.

## What is the Chimera Framework?

So today, we're going to talk about what the Chimera framework is. We're going to talk about Create Chimera App, and we're going to leak some incredible alpha. If you go on our Create Chimera App repo today, you'll see that we have an open pull request for the Vichu. And this is just the beginning of the nuggets we're going to drop. And today we'll end with scaffolding Morpho, which I believe is the simplest contract and the best way to learn how to write invariant tests.

This Thursday, actually, I'm preparing an awesome event with many of our customers so that they can talk to you about the blue side of invariant testing. Whereas today, we're going to have you a preview of what the invariant testing bootcamp look like. So I'm basically repurposing the first lecture of the invariant testing bootcamp to help onboard more people into the Chimera framework.

## The Core Concept

If you haven't heard about the Chimera framework, you can find it at reconfuzz slash Chimera. And the key idea of the Chimera framework is that you are going to write properties in one way and then we're going to abstract away all of the underlying ways to perform those assertions so that you effectively rewrite your test in Solidity and then you can run any other tool to verify them.

And so the bold claim from today is really that you're going to be able to write tests once and you're going to be able to run them with Foundry, Medusa, Halmos, and Control. I'm going to be following up on that promise, especially over this week. Most likely, we'll dedicate an entire day to the future where I'll show you how to run the different tools. Whereas today, we just want to get you started and we want to get you onboarded.

If you want to follow along, you can either go to the Morpho.org, Morpho.org, MorphoBlue repo, or you can fork Create Chimera App from Reconfuzz, where Create Chimera App is our template that uses the Chimera framework and implements all of our best practices.

## Background and Credentials

If you don't know about me, I am a security researcher at Spearbit. My contracts have handled hundreds of millions of TVL and the earnings is a bit stale. It's closer to five hundred K now of public contests and bug bounties. I co-founded Recon. We do invariant testing and audits and some of our awesome clients include Centrifuge, Badger, Korn, Liquity and Balancer DAO. And formerly I was a developer at Badger and I've been a judge. So I've seen a lot of other security researchers and our product stems from wanting to improve on that.

Our achievements, I mean, our work speaks for itself. If you haven't seen our suites, there's these public repositories that list most open source Ikedra and Medusa suites. We are amongst the most prolific writer of this type of invariant suites to the point where we found bugs in tools such as Medusa and also in the underlying engines such as hevm simply because we use the technology so often we personally use it so much.

I built a cloud platform for me and my customers called recon pro and whenever we do an invariant testing engagement we like to divide this into phases.

## The Four Phases of Invariant Testing Engagement

The reason why I'm telling you this is because I've been teaching this - you can look at our expanding team here in the Recon website. But all of these people, I basically had to train in writing this type of invariant testing. And so standardizing it and reducing decision-making fatigue is key to do a good job.

Because at the end of the day, the truth about testing is that the time spent writing the test is a sunken cost. There's really no value in writing a test in the sense of spending the time writing it. The value is only in the thinking, the value is in preventing bugs. Standardizing the way you write tests is key if you don't want to waste time thinking about stuff that it's going to just drag you down.

This is also why many security researchers don't use these techniques is because the activation energy, the barrier to entry is too high. And that's what we've been doing at Recon for over a year and four months is we've been reducing the upfront effort to get you to feedback faster.

### Phase 1: Setup Phase
You have a setup phase where your only goal is to deploy the contracts in a meaningful state.

### Phase 2: Reach Coverage
Then you want to reach coverage. And that's because if you don't reach coverage, you're not going to be able to test properties meaningfully.

### Phase 3: Write Properties
Then the third phase will be writing the actual properties.

### Phase 4: Iterate
And then you want to iterate. And that's because reaching coverage and writing properties as these almost like a dependency in the sense that the way in which you reach coverage can inform the properties that you can write because of something I'll talk about later. Then writing properties is also, in a sense, informed by outreach coverage.

This issue only applies to stateful fuzzing tools and to tools that don't use weakest precondition. Whereas if your tool uses weakest precondition, then you technically will just assert that you want to use arbitrary storage, and then you're just going to focus on properties. The issue as a security researcher that I have with those tools is that they don't give you a repro, meaning that you don't actually know whether the state is technically feasible given the arbitrary storage.

The approach that we're taking with using stateful pausing is really that we want to just ask the tool for the steps that a normal person will take in order to achieve a specific goal instead of asking whether a state is feasible in our ways through a formal tool we simply want to get to the retro.

## The Philosophy of Testing

So I want to make it clear that I believe you should be writing a ton of tests but not because I think the tests per se are useful but it's really about the thinking the understanding of the system and the ability to think around edge cases so the thinking is what's really valuable and that's why we are unable to give you a tool that always breaks every property. It's really because you have to think and the day we are going to be able to abstract you from having to think is the day we're probably going to take your freedom away. So I hope you're going to actually engage with us and you're going to think for yourself.

That said, that's what the Chimera framework is here for, is to help you streamline your process and to help you get through coverage and to breaking properties as soon as possible.

## The Chimera Framework Files

And the idea behind the Chimera framework, which you can see live today on ReconFuzz dash create chimera app is to use the following files:

- **before after** - the critic tester 
- **credit to foundry** - properties setup and target functions
- **setup** - where we put all of our deployment configuration
- **target functions** - explicitly state all the functions that should be called as part of state exploration
- **properties** - the file that you would use to explicitly state the properties that you want to be testing
- **before after** - the abstraction that we use to track variables over time so that you could assert more complex properties

Critic to foundry has been effectively the invention of Antonio Vigiano and what he figured out was that there are ton of amazing tools that will give you a step-by-step process to break properties such as echidna medusa and debugging with them is absolutely awful and so once you get to array pro you want to debug with foundry that's because foundry is so much faster and that's also because everybody knows foundry.

So really our goal with this framework is to help you write ninety nine percent of the time in foundry and then give you an easy way to hook into other tools that we believe are way more powerful for their specific goal so that you can actually get to break those properties faster.

## The Key Characteristic of Recon Engagements

The key characteristic of a recon engagement is that we will set up all the contracts through Foundry and then we will run either Echidna or Medusa and then we'll give you back ArrayPro in Foundry. That's what we're going to do today. It's thanks to the critic to Foundry file.

In setup, we're going to put all of our deployment configuration. This can become very complex but as of now all you want to think about is that we need to specify how to deploy all these contracts for all of our tools and so everything deployment goes into setup.

Then we have target functions and this is the key of our opinionation. What we built is we believe you want to explicitly state all the functions that should be called as part of state exploration. You want to put them in target functions, and then over time you want to manage that complexity by having stub files. But fundamentally, anytime you're thinking about exploring state, that's where the handler or the function you want to call will go.

Before after is basically the abstraction that we use to track variables over time so that you could assert more complex properties. Most beginners don't need to look at before after. Whereas most advanced users spend most of their times in before, after and in properties.

## Why This Framework Exists

At this point, let's ask ourselves why this framework exists. And the answer is because we want to standardize how state space is explored, meaning how is a smart contract state altered? We want to standardize that. And the reason why we want to standardize it is because if we all agree on a way to explore state and check for properties, then we can all build tools that are interoperable, they all work with one another.

But most importantly, we can optimize these tools so that we don't have to have this generic tool that is a hundred or a thousand times slower than what it could be if we just standardize it a bit. That's really our goal - we want to standardize how you explore state and we'll show you this today. We want to standardize how you check for global properties and how you debug repros. That's also something you'll see there today.

Our goal is really to help you be able to run other tools because the idea that there is one tool that does everything is just not true and so we believe you should be able to use as many tools as you want and that's why we literally list foundry medusa almost and control in this live.

In terms of the overachieving goal is that once you standardize all of these practices you can turn them into an algorithm meaning you don't have to code all of this stuff so stick around perhaps on wednesday I'm gonna show you what I mean with that and you're gonna have your mind is gonna be blown on wednesday.

## Results and Success Stories

Those are the results we got. We prevented hundreds of millions in exploits via testing. And all of these bugs obviously never made it to prod because we found it during the testing phase, during the audit phase. And as of the most recent six months, we have consistently identified at least one bug that was missed by many of you.

I'm asking all of my previous customers to let us publish these trophies. It's a process that takes time, but that's something that I can tell you is that it took a long time to get to this point, but our techniques are sophisticated enough that sometimes when minor review falls short, the fuzzing actually ends up making a huge difference, which is the reason why I'm advocating this technique in the first place.

## Getting Started

In terms of getting started, you want to go on reconfuzz, create Chimera app. Always use this template. That's really the point of this live is to persuade you to try it. You don't need to install any new software. You can reuse all the open source tools that you know, Foundry, Echidna, Medusa, Halmos Control, all of those. Our tooling is compatible out of the box, just download, just clone this repo and put your contract and be done.

Then in terms of helping you get stuff done faster, we also introduced a tool called the Sandbox, which I'm going to use today to scaffold or to set up the target functions. Your key goal in working with the Chimera framework is to compile everything in Foundry, then use Echidna to explore the coverage, and then use sequences in CryptoFoundry to figure out if you can actually reach the coverage.

## The Clamping Insight

The key insight that we are making as a part of our VTru of our framework is that clamping is always done separately. I'm going to show that today, but this is a really key insight. And we always clamp by having the clamped handlers generate a subset of all possible handlers. This is really key because obviously if once we agree on this, we can actually use other tools and even formal verification techniques to automatically generate a lot of these clamping.

## The Setup Process

Step one is going to be about getting to compilation. In case I haven't made it clear, I'm going to start coding in a moment. But fundamentally, we want to go in the setup file, we want to ignore all the issues, all the compilation stuff, you don't want to get overwhelmed. You just want to go through each issue, fix it, get it done.

Shockingly enough, I'm going to use Visual Studio Code. I don't need Cursor to help me fix a couple of compilation issues. But just take your time with this, understand that everybody goes through the pain of the setup, and you just want to think about the cleanest, simplest setup you can.

Then from there you're gonna evaluate the coverage report I'm gonna show you how to do this in detail today and then that's gonna be kind of it for today so we're not gonna look at properties. Properties tend to be effectively worthless if you don't have coverage and so for the sake of our live demo we're gonna grab the morpho code base we're gonna deploy it mock a few contracts and then get to coverage.

## Practical Implementation - Setting Up Morpho

So I'm gonna do that right now and for the sake of time I already had the morpho repo downloaded and the only change I'm gonna make is I'm gonna disable via er because I respect my time and yours. For similar reasons, we're going to delete all of our test folder. I'm just going to see if it compiles and should. There's going to be quite a few small things we're going to have to do. The most annoying one is going to be the boilerplate. So we're just gonna get that done.

First of all, I'm gonna go to getrecon.xyz and I'll navigate to the bottom and get my sandbox, which is ABI to invariant test. And this sandbox basically allows me to scaffold an entire project. We have a really cool tool that we're gonna release soon to make this even faster but the way you're gonna do it is you just need to grab the abi of the contract that you want to fuzz for example in this case it's going to be morpho and I'm going to just paste it and I'm going to name this morpho.

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