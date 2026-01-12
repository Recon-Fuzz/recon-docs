# Writing pure assembly smart contract

Solidity is great

Yul with solidity is pretty straightforward

However, in order to advance our reverse engineering capabilities we need to go straight to the source

Writing assembly is not particularly difficult per-se

However, writing, debugging, deploying and testing pure assembly smart contracts is a daunting task

These are notes I'm taking as I'm learning about the underlying functionality of the EVM as a means to help us write beter

# Best Tools

As of today the best tool available is evm.codes

In the future we may release a better tool, which preserves comments, and replays execution, allowing for a more debuggable experience

Fundamental issues with evm.codes
- Inability to preview deployment state -> Harder to debug that
- Inability to test calls -> Harder to debug dispatch and functions
- Inability to preserve comements when converting between bytecode and mnemonic

# Rough Idea

Writing a contract requires:
- Writing the contract logic
- Initializing and returning the data

## Example Contract

```
// Set the state
PUSH5 0x47616c6c6f
PUSH1 0x00
MSTORE
PUSH1 0x20
PUSH1 0x00
RETURN
```

## Initialization Code Pattern

```
// Correct initialization code pattern
PUSH1 <size>     // Size of runtime code
PUSH1 <offset>   // Offset where runtime code begins in the full bytecode
PUSH1 <memory offset> // Destination offset in memory (0)
CODECOPY         // Copy runtime code to memory

PUSH1 <size>     // Size for return
PUSH1 <memory offset> // Offset for return
RETURN           // Return bytes from memory as the runtime code
```


## On Writing assembly

Annoying issues:
- You have to pass arguments in reverse
- Everything is a unsigned value
- Something about padding / encoding, which I don't really know about | This is prob a massive gotcha waiting to happen

---

## Writing our fist Contract

Let's write a contract that returns something

The key opcode we want to target is `RETURN`

This opcode requires 2 parameters, the offset and the size

We'd write the operation in Yul in this way:

```solidity
    return(offset, size)
```

The EVM is a stack machine, it will pop items off of the stack as it uses them

The items are passed to various opcodes as parameters

The gotcha is that because the EVM is stack machine, the item of depth 1 will be viewed as the first item for the opcode

Meaning we have to pass arguments in reverse order


We can start by getting some random string, let's say "Recon"

We can convert it to UTF-8 and get some bytes
52 65 63 6F 6E

That's 5 bytes, and will result in the following Mnemonic

0x5265636F6E

If we instead wanted to work with direct bytecode we'd remove the 0x as bytecode is implicitly written in hex

There's probably some additional set of conversions that are done by default by our OS (Since the characters 01 don't actually mean 01 in binary), I'm going to ignore this

But this is a good reason to test contract as the wrong encoding can result in bugs even if you follow the first-principles

As discussed we need to return(offset, size)

This means we have to put the value `0x5265636F6E` into memory first

Let's do that

### Putting Recon into Memory

[TODO] I'm not fully clear as to how memory works in the EVM as of now

My understanding is Memory is a sequential store of data

In which we can store one word (32 bytes) at a time

So even though we're only wanting to store 5 bytes, we'll have to use a full word


The code we want to write looks like this:

```
mstore(0, 0x5265636F6E) ## mstore(0, "RECON")
```

We have to reverse the order so:
Push To Stack 0x5265636F6E 
Push to Stack 0x
MSTORE

We can write it as follows:
```
PUSH5 0x5265636F6E
PUSH1 0x00 
MSTORE
```

### Returning Recon from Memory

Given that we have set the value "RECON" in Memory

```
return(0, 0x20) ## return (0, "RECON.LENGTH")
```

We can now return it

```
PUSH1 0x20
PUSH1 0x00
RETURN
```

Since mstore stores an entire word, we will return that

This is also consistent with how ABI ENCODING works

[TODO] Although I'm not 100% confident in this

-------

## Testing the contract |TODO

We can test this contract by using EVM.Codes

The UX is pretty good at this point

## Deploying

Deploying is easy, but what we'll do is going to fail

We need to add initialization code

## Writing initialization code

You need to calcualte the length of the initialization code

Offset by self

Calculate lenght of contract code

Add that

Then decide which memory region in which to store said value

Then return that

Basically you're doing some stuff, and then returning the entire length of the contract bytecode



# TODO: Experiments

- Call to a random address, that requires no parameter and returns nothing, that does change storage so we can prove it worked

- Real / Proper way to work with strings (padding, null terminators)

- Call a ERC20 and transfer it | All hardcoded for simplicity

- Working with Immutable parameters passed to the constructor