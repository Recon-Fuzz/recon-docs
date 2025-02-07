# First Steps

To make getting started with Recon as easy as possible, we created the [create-chimera-app](https://github.com/Recon-Fuzz/create-chimera-app/tree/main) repository which serves as a template that you can use to create a new project with invariant testing built in. 

This template uses our [Chimera framework](./chimera_framework.md) that lets you run fuzzing tests with Echidna and Medusa that can be easily debugged using Foundry. 

## Getting Started

### Creating A New Project
If you haven't already, first create a recon account as described in the [Getting Started](./introduction.md#getting-started) section and download either [Echidna](https://github.com/crytic/echidna) or [Medusa](https://github.com/crytic/medusa). 

Next you'll need to create a new project using the create-chimera-app template. You can use the _Use this template_ button on GitHub to do this. This will automatically create a new repository with the create-chimera-app template project on your GitHub account. 

create-chimera-app ships with the [default foundry project](https://book.getfoundry.sh/projects/creating-a-new-project) as an example. This is a simple `Counter.sol` contract that you can use to test the fuzzing capabilities of Echidna and Medusa. 


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

To run your tests on Recon, follow the instructions in the [Running Jobs](./running_jobs.md) section. 

### Expanding The Example Project
create-chimera-app is meant to be a starting point for your own project. You can expand the example project by adding your own contracts and properties. 

To add new contracts just delete the existing `Counter.sol` and `Counter.t.sol` files and add your own. 

After adding your new contracts, you can add handlers for the contracts you want to test using invariant testing by using the _Build Handlers_ page on Recon (see [this section](./building_handlers.md) for how to do this). 



