# The Recon Invariant Audit Process

As of today an Invariant Audit would be performed by:
- An Invariant Testing Engineer (Nicanor, 0xsi, kn0t)
- A Lead Auditor (Alex)

We're connected to a wide network of independent reviewers and can offer more complex audits if you need them

Feel free to reach out via this page: [https://landing.getrecon.xyz/](https://landing.getrecon.xyz/)


## Step 0: Scoping the Engagement

Different codebase can have different challenges, and require different times

Ideally you'd want:
- The Lead Auditor and the Team to go over the code along with the Invariants Engineers
- The Invariants Engineer to get a few weeks of head start to get the Suite to reach coverage and test most properties

So that the Lead Auditor will be able to use the suite once it's at it's full potential, with a well developed corpus that will save them time

## Step 1: Getting to Coverage

The Invariants Engineer will work hard to achieve full coverage of the system

In some cases this may not be possible or this may require more time

It's critical that we scoped a correct timeline

And engineers are trained on deciding "when to mock" some contracts as a means to speed the development time

## Step 2: Writing Properties

At the beginning of an Audit the development team knows the system better than us

For this reason, we ask teams to make their best effort at specifying properties they want us to test

We do this after going through an in-depth workshop explaining what properties and invariants are

## Step 2.1 Invariant Writing Workshop

We go through the workshop with the Engineering team as soon as possible, ideally before the engagement so that the Invariants Engineer will already have properties to write

The workshop is over one hour long and has us go through specific types of properties with examples, as well as a table our customers can use to provide us with the properties

We don't necessarily need the best property specification at this time, but rather want to understand what the customer is looking to prove

This also helps the Fuzzing Engineer focus exclusively on the problem of getting to Coverage and writing those properties which generally saves them from having to figure out too many things at once

## Step 3: Breaking Properties and Iterating

As coverage is increased, some properties will naturally break

The Invariants Engineer will investigate these, with the goal of leaving only true positives

They will also have ran the suite on Recon Pro for a long time, providing the team and the Auditor with an extensive corpus which they'll be able to reuse

Reusing corpus saves days of work to the Auditor, making the time investment worth every penny


## Step 4: Manual Review

Once the suite is in a good spot and the Auditor's engagement start, they'll do manual review

Every engagement is different with a different balance of:
- Fuzz Testing
- Differential Reviewing
- Economic Research

Based on the codebase as well as the areas that are deemed more important

The fuzzing suite will be an extremely useful tool for the Auditor

Because anytime they have a hunch they can't quickly verify, they can write a quick property and have the fuzzer give them a pre-condition to what could be a bug

## Step 5: Writing new Properties

Auditors tend to think very differently from Protocol Engineers

From my perspective (Alex), the experience of so many exploits leads to:
- A more critical, more if this then that, precondition based thinking
- A more aggressively focused mindset

The properties I tend to write are less about rigorous correctness of a spec, which is definitely useful for protocol developers, but more about breaking the core funtionalities, or giving me pre-conditions to ways to break said functionalities

Suffice to say, many protocol find a Auditor's specified properties to be very valuable

And they are a lot more valuable when there's a suite with corpus ready to quickly test them

## Step 6: Investigating Broken Properties and Escalating Severity

For each broken property, the auditor will then want to investigate the root case

Based on that, they will attempt to escalate the impact to it's highest one

The fuzzer can be extremely useful here, thanks to Optimization mode

## Step 7: Invariants Report

For each broken property, a Trophy is generated, a Foundry repro you can use to ensure once you fix the bug it won't come back

## Step 8: Audit Report

When performing an Audit, a GH Repo is opened, this allows to comment on each line of the contracts as well as to file issues

These issues will be used to generate an Audit Report


## Notes on remote work

Common sense notes about working remotely

### Make your work visible

If you don't post on social media you're dead

It's not the truth, but we fell it that way

Same for remote work, if we don't see it, it didn't happen

Make it a habit to:
- Post your progress daily in a non disruptive way
- Upload your notes for others to benefit

### Don't force others to ask stupid questions

Always clean up useless branches

Simplify PRs to ensure everyone's attention goes towards what matters

Send a latest run if possible

What's the point of asking you:
- What's the latest run?
- Where's the code?
- What's the last branch?

If you already know you'll be asked this, just make it visible

### Push the work, don't just check boxes

With AI there's close to zero value in someone that fills in some check boxes

Your work is as valuable as it's hard to turn into an algorithm

Your willingness to think about the needs of the customer or the enterprise is what makes your work valuable, not the effort itself

Think about this: Once a piece of software is done and fully specced, you could write a simple tool to build it instantly, the value you created was in figuring that out, not in simply following an algorithm