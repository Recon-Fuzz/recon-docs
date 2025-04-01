# Introduction

## Target Functions rules

For each contract, for each function, grab each input, have the fuzzer generate said input

Prank the current actor (if necessary)

Call the contract and function with the parameters

### Clamping Target Functions

Clamped handlers  must be a subset of all target functions

They reduce the amount of inputs and add conditionality to call the unclamped handlers

### Disabling Target Functions

It's completely fine to disable a target function

As of now we either delete / comment it, or you could add a `alwaysRevert` modifier that just reverts

### Conditional Disabling

You can setup conditional disabling by setting a `bool constant FEATURE_ENABLED = bool(false)`

You can then go in the specific handlers and prefix the external call with:
```solidity
function handler(inputs...) public {
    require(FEATURE_ENABLED, "Feature Enabled");
}
```

This will allow you to use Dynamic Replacement to toggle the value on run setup and effectively test both variants of the suite, without creating massive complications

## Setup

A few rules we use in our engagements

- Don't blindly trust the dev
- Define programmatic deployments
- Figure out "implicit" clamping and base your properties on this

## Programmatic Deployment

## Ghost Variables

Avoid any reverts in Ghost Variables

Avoid

### Grouping Function types

Tbf you can just use `msg.sig`

## Inlined Fuzz Properties

Avoid repeating the same property in multiple places

This massively de-optimizes the tool and is semantically a waste

You're asking the fuzzer to break the property once and then to "not change the state" to break it in other places

Repeated inline properties should be refactroed to only be assessed once, either as inlined-properties or as Ghost Variable Properties


## Exploring Rounding Errors

### Identifying errors

- Start by using exact checks
- Change to Optimization
- Improve work and explore further
