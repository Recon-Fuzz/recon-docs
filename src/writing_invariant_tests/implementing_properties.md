## TODO: 
- section defining properties generally 
- section on using assertion mode
- section on adding preconditions

# Implementing Properties 

Implementing properties is part skill and part art, we'll look at the different kinds of properties that can be defined (inlined or global) and the different techniques that you can use to implement your properties as code using an ERC4626 vault as an example.

## What are properties? 


## Inlined vs Global Properties
NOTE: we favor only using assertion mode in our properties, this has led us to the two types of properties below

Before we get into how we can implement properties it's important to understand the different types, at Recon after implementing many suites ourselves we realized that these fall into major categories: inlined and global. 

We call properties defined inside a function [handler](../using_recon/building_handlers.md#what-are-handlers) **inlined**:
- TODO: example of inlined property

Because these properties are defined within the handlers themselves they are only checked after the call to the target handler, this means that by definition they aren't required to hold for other function calls.

We call properties defined in the [Properties](../writing_invariant_tests/chimera_framework.md#properties) contract **global**:
- TODO: example of global property

Because global properties are publicly exposed functions they can be called by the fuzzer after any call to one of the state-changing handlers (just like how [boolean properties](https://secure-contracts.com/program-analysis/echidna/basic/testing-modes.html?highlight=boolean%20property#boolean-properties) normally work). This lets us check that a property holds for any function call. 

## Vault Properties 
Now with the two major types defined we'll look at how these get implemented for the following properties on an ERC4626 vault. 

1. 
