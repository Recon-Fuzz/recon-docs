# Dynamic Replacement

Demo: [https://getrecon.xyz/dynamic-replacement-demo](https://getrecon.xyz/dynamic-replacement-demo)

Use it: [https://getrecon.xyz/dashboard/dynamic-replacement](https://getrecon.xyz/dashboard/dynamic-replacement)


Dynamic Replacement allows you to replace the value of any variable in your contracts.


![Dynamic Replacement Field](../images/using_recon/dynamic_replacement.png)


This can be extremely useful if you're exploring multiple variants or behaviors in your code.

Many engineers write config files to track:
- Max Precision Loss
- Number of Actors

And other aspects of the suite

With Dynamic Replacement you can change one line, click a button, and run multiple jobs that have different configurations, without needing to manage multiple branches.

The code is replaced before running the fuzzer, with every other config remaining the same.

## Using Dynamic Replacement

Dynamic Replacement applies only to the `Setup.sol` file in your repository

- Inp


## When to use Dynamic Replacement

![Dynamic Replacement Constant](../images/using_recon/dynamic_replacement_constant.png)

- You want to toggle certain behaviour via a boolean or by adding specific calldata

In the example we want to allow certain unsafe ERC4626 Operations

We explicitly toggle them so that we don't need to maintain two forked branches

- You are using constants for Precision, Decimals, Hardcoded Addresses and want to test other configurations

In the example above we wrote the suite for an 18 decimal target.

The business requirements changed, so we used Dynamic Replacement to reuse the suite with an 18 decimals setup


![Dynamic Replacement Addresses](../images/using_recon/dynamic_replacement_addresses.png)

- You are performing fork testing and need to update addresses or targets

In the example you can see the common practice of hardcoding various addresses on a fork test

With Dynamic Replacement you can replace these in the same branch, performing fork testing on new targets, or new chains
