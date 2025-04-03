# Building Handlers 

## What Are Handlers?

Handlers are functions that help you test invariants by wrapping a call to a target contract with a function that allows you to add clamping (reduces the search space of the fuzzer) and properties all in the same execution. 

For example, if we want to test the deposit function of an ERC4626 vault, we can build a handler that will call the deposit function and then assert some property about the state of the vault after the deposit is complete.

```solidity
//This is the handler
function vault_deposit(uint256 assets, address receiver) public {  
    //We can add clamping here to reduce the search space of the fuzzer    
 assets = assets %  underlyingAsset.balanceOf(address(this));

    //This is the call to the target contract
 vault.deposit(assets, receiver);

    //We can add properties here to test the state of the vault after the deposit is complete
    eq(vault.balanceOf(receiver) == assets);
}
```

## Generating Handlers In Recon

To generate handlers in Recon all you need to do is paste the abi of the contract you'd like to build handlers for into the the text box on the _Build Handlers_ tab. To get the ABI of a contract in a foundry project just compile your project and look in the `out` directory for a file with the same name as your contract but with a `.json` extension. 

After pasting the ABI into the text box, click the _Build Handlers_ button and Recon will generate the handlers for you. 

You'll then be shown a screen where you can select the specific functions you'd like to add handlers for. You can toggle which functions are selected using the buttons next to the function name. 

## Adding Handlers To Your Project

Once you've generated the handlers for the functions of interest, you can add them to your project by clicking the _Download All Files_ button. 

This will download a zip file containing the handlers and necessary supporting files. 

You can then unzip these files and add the recon folder as a child of your test folder. Additionally, move the `medusa.json` and `echidna.yaml` config files into the same folder as your `foundry.toml` file. 

## Adding Dependencies To Your Project

Recon uses the Chimera dependency under the hood for all of the handlers generated using the builder, so you'll need to add Chimera as a dependency to your project. 

To do this, install Chimera with the following command:

```bash
forge install Recon-Fuzz/chimera --no-commit
```

You'll then need to add chimera to your remappings. If your project does this in the `foundry.toml` file, you can just add the following to the `remappings` array:

```toml
remappings = [
 '@chimera/=lib/chimera/src/'
]
```

If your project uses a remappings.txt file instead you can similarly add the following to the file:

```
@chimera/=lib/chimera/src/
```

## Running The Project

Now you're almost ready to run the project, you just need to make sure the `Setup.sol` file is correctly set up to deploy your system contracts. 

Once you've done this and can successfully compile using the foundry command:

```bash
forge build
```

You can then run the project using the following commands for fuzzing:

### Echidna
```bash
echidna . --contract CryticTester --config echidna.yaml
```

### Medusa
```bash
medusa fuzz
```