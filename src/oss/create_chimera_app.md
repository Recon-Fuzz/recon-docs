# <a href="https://github.com/Recon-Fuzz/create-chimera-app" target="_blank" rel="noopener noreferrer">Create Chimera App</a>

A Foundry template that allows you to bootstrap an invariant fuzz testing suite the [Chimera Framework](./chimera.md) that works out of the box with:
- Foundry for invariant testing and debugging of [broken property reproducers](../free_recon_tools/echidna_scraper.md)
- Echidna and Medusa for stateful fuzzing
- Halmos for invariant testing

It extends the default Foundry template used when running `forge init` to include example property tests supported by [Echidna](https://github.com/crytic/echidna) and [Medusa](https://github.com/crytic/medusa).

## Prerequisites
To use this template you'll need to have Foundry installed and at least one fuzzer (Echidna or Medusa):
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Echidna](https://github.com/crytic/echidna?tab=readme-ov-file#installation)
- [Medusa](https://github.com/crytic/medusa?tab=readme-ov-file#install)
- [Halmos](https://github.com/a16z/halmos?tab=readme-ov-file#installation)

## Usage
To initialize a new Foundry repo using this template run the following command in the terminal.

```shell
forge init --template https://github.com/Recon-Fuzz/create-chimera-app
```

### Build
This template is configured to use Foundry as it's build system for [Echidna](https://github.com/Recon-Fuzz/create-chimera-app-2/blob/271c3506a040b30011accfc15ba253cf99a4e6f1/echidna.yaml#L9) and [Medusa](https://github.com/Recon-Fuzz/create-chimera-app-2/blob/271c3506a040b30011accfc15ba253cf99a4e6f1/medusa.json#L73-L83) so after making any changes the project must successfully compile using the following command before running either fuzzer:

```shell
forge build
```

### Property Testing
This template comes with property tests defined for the `Counter` contract in the [`Properties`](https://github.com/Recon-Fuzz/create-chimera-app-2/blob/main/test/recon/Properties.sol) contract and in the function handlers in the [`TargetFunctions`](https://github.com/Recon-Fuzz/create-chimera-app-2/blob/14f651389623f23880723f01936c546b6d0234a1/test/recon/TargetFunctions.sol#L23-L51) contract.

#### Echidna Property Testing
To locally test properties using Echidna, run the following command in your terminal:
```shell
echidna . --contract CryticTester --config echidna.yaml
```

#### Medusa Property Testing
To locally test properties using Medusa, run the following command in your terminal:

```shell
medusa fuzz
```

### Foundry Testing
Broken properties found when running Echidna and/or Medusa can be turned into unit tests for easier debugging with Recon ([for Echidna](https://getrecon.xyz/tools/echidna)/[for Medusa](https://getrecon.xyz/tools/medusa)) and added to the `CryticToFoundry` contract.

```shell
forge test --match-contract CryticToFoundry -vv
```

### Halmos Invariant Testing
The template works out of the box with Halmos, however Halmos Invariant Testing is currently in preview

Simply run `halmos` on the root of this repository to run Halmos for Invariant Testing

## Expanding Target Functions
After you've added new contracts in the `src` directory, they can then be deployed in the `Setup` contract.

The ABIs of these contracts can be taken from the `out` directory and added to Recon's [Invariants Builder](../free_recon_tools/builder.md). The target functions that the sandbox generates can then be added to the existing `TargetFunctions` contract. 