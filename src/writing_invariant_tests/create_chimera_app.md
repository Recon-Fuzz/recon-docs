# Create Chimera App

To make getting started with Invariant Testing as easy as possible, we created the [create-chimera-app](https://github.com/Recon-Fuzz/create-chimera-app/tree/main) template which you can use to create a new Foundry project with invariant testing built-in. 

This template uses our [Chimera framework](./chimera_framework.md) to let you run invariant tests with Echidna, Medusa, Halmos and Kontrol that can be easily debugged using Foundry. We've also incorporated contracts from our [Setup Helpers](../oss/setup_helpers.md) repo which make managing the test suite setup much simpler.

## Prerequisites 

To make use of the fuzzing/formal verification tools that create-chimera-app supports you'll need to install one of the following on your local machine: 
- [Echidna](https://github.com/crytic/echidna)
- [Medusa](https://github.com/crytic/medusa)
- [Halmos](https://github.com/a16z/halmos?tab=readme-ov-file#installation)
- [Kontrol](https://github.com/runtimeverification/kontrol?tab=readme-ov-file#fast-installation)

## Creating A New Project
First you'll need to create a new project using the create-chimera-app template. You can use the _Use this template_ button on GitHub to do this. This will automatically create a new repository using the create-chimera-app template on your GitHub account. 

> Note: you can also use the `forge init --template https://github.com/Recon-Fuzz/create-chimera-app` command to create a new project locally or just clone the repo directly using `git clone https://github.com/Recon-Fuzz/create-chimera-app`

Create-chimera-app ships with the [default Foundry template](https://book.getfoundry.sh/projects/creating-a-new-project) as an example. This is a simple `Counter` contract that you can use to get a feel for how invariant testing works. 

> If you want to intialize a clean project without the boilerplate from the default Foundry template you can use the [create-chimera-app-no-boilerplate](https://github.com/Recon-Fuzz/create-chimera-app-no-boilerplate) repo


## Testing 
An example invariant is implemented in the [`Properties`](https://github.com/Recon-Fuzz/create-chimera-app/blob/main/test/recon/Properties.sol) contract and some inline properties are defined in the [`TargetFunctions`](https://github.com/Recon-Fuzz/create-chimera-app/blob/main/test/recon/TargetFunctions.sol) contract. 

You can test these properties using Echidna and Medusa using the following commands:

### Echidna
```bash
echidna . --contract CryticTester --config echidna.yaml
```

### Medusa
```bash
medusa fuzz
```

> To run your tests on Recon, follow the instructions on the [Running Jobs](../using_recon/running_jobs.md) page. 

## Expanding The Example Project
create-chimera-app is meant to be a starting point for your own project. You can expand the example project by adding your own contracts and properties. See the [Chimera Framework](./chimera_framework.md) section on what the role of each contract is and see the [example project](../writing_invariant_tests/example_project.md) for how to implement properties using the framework. 

If you're new to defining properties, checkout [this substack post](https://getrecon.substack.com/p/implementing-your-first-few-invariants?r=34r2zr) which walks you through the process of converting invariants from English to Solidity using a ERC4626 vault as an example using Chimera.
 



