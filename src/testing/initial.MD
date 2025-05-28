# Testing

The most important aspect of testing is speed of iteration

Do everything you can to make that faster

- Use cached values (e.g fork-block)
- Use the faster tool

Always ask yourself: "Am I doing this in the easiest way possible?" 

Do not accept overly complex practices, slowing your speed of iteration down will kill your results


## Fork Testing with Foundry

```solidity
    function setUp() public virtual {
        // Select an specific block number to maintian the same state, once we want to test different scensarios, we can have varius forkIds
        string memory RPC_URL = vm.envString("RPC_URL"); // RPC URL to fork, ideally Anvil with an instance of Berachain testnet
        console2.log("Forking from: %s", RPC_URL);
        bool USE_RPC_CACHE = vm.envOr("RPC_CACHE_BLOCK", false);
        if(USE_RPC_CACHE) {
            uint256 RPC_BLOCK = vm.envUint("RPC_BLOCK");
            console2.log("Forking from: %s", RPC_URL);
            console2.log("At block %s", RPC_BLOCK);
            forkId = vm.createSelectFork(RPC_URL, RPC_BLOCK);
        } else {
            forkId = vm.createSelectFork(RPC_URL);
        }
```

## Writing Assertions

Always write an assertion with an accompanying description script

No matter how simple the assertion is, these can stack onto each other

Figuring out which assertion failed when you have 50 is an exercise in futility

Add a unique string, no matter how basic (`e.g. deposit 1`)
So that you can grep the codebase