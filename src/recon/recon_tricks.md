# Recon Tricks

We've been using Recon for over a year to run all of our cloud runs

Here's some tips and tricks:

## Run in exploration mode for an excessive amount of tests

Exploration mode is faster, and builds a corpus faster

While building your suite, make use of this mode

## Think about Corpus Reuse

Some runs can take days to explore all state

If you reuse corpus, these days worth of data can be replied within minutes

Always use corpus re-use

There's a reason why we prominently allow you download corpus and paste it into any job, it's because we know it works

## Don't acknowledge small precision losses before using Optimization Mode

Sometimes you'll break a property with a small precision threshold and think you're done

From our experience you should run some Optimization Tests

The way the corpus for Optimization is built is a bit different, so running Optimization tests can lead you to different results

## Share your Jobs as soon as they start

You can save a lot of back and forth by creating a share and sending it to your team or auditors

Recon jobs update automatically every minute, so once you know the job will work you can share it and go afk