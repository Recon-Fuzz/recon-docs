# First Steps

To make getting started with Recon as easy as possible, we created the [create-chimera-app](https://github.com/Recon-Fuzz/create-chimera-app/tree/main) repository which serves as a template that you can use to create a new project with invariant testing built in. 

This template uses our [Chimera framework](./chimera_framework.md) that lets you run invariant tests with Echidna and Medusa that can be easily debugged using Foundry. 

### Creating A New Project
If you haven't already, first create a recon account as described in the [create an account](./introduction.md#creating-an-account) section and download either [Echidna](https://github.com/crytic/echidna) or [Medusa](https://github.com/crytic/medusa). 

Next you'll need to create a new project using the create-chimera-app template. You can use the _Use this template_ button on GitHub to do this. This will automatically create a new repository using the create-chimera-app template on your GitHub account. 

Create-chimera-app ships with the [default foundry project](https://book.getfoundry.sh/projects/creating-a-new-project) as an example. This is a simple `Counter.sol` contract that you can use to test the fuzzing capabilities of Echidna and Medusa. 


### Testing 
An example invariant is implemented in the `Properties` contract and some in-line properties are defined in the `TargetFunctions` contract. 

You can run the default fuzzing tests using the following commands

#### Echidna
```bash
echidna . --contract CryticTester --config echidna.yaml
```

#### Medusa
```bash
medusa fuzz
```

<!-- To run your tests on Recon, follow the instructions in the [Running Jobs](./running_jobs.md) section.  -->

### Expanding The Example Project
Create-chimera-app is meant to be a starting point for your own project. You can expand the example project by adding your own contracts and properties. See the [Chimera Framework](./chimera_framework.md) section on what the role of each contract is and how to expand the example project. 

[This substack post](https://getrecon.substack.com/p/implementing-your-first-few-invariants?r=34r2zr) walks you through the process of converting invariants from English to Solidity using a ERC4626 vault on an example project using Chimera.

To add new contracts just delete the existing `Counter.sol` and `Counter.t.sol` files and add your own. 

After adding your new contracts, you can add handlers for the contracts you want to test using invariant testing by using the _Build Handlers_ page on Recon (see [this section](./building_handlers.md) for how to do this). 



