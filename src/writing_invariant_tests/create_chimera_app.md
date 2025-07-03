# Create Chimera App

To make getting started with Invariant Testing as easy as possible, we created the [create-chimera-app](https://github.com/Recon-Fuzz/create-chimera-app/tree/main) template which you can use to create a new Foundry project with invariant testing built-in. 

This template uses our [Chimera framework](./chimera_framework.md) to let you run invariant tests with Echidna, Medusa, Halmos, and Kontrol that can be easily debugged using Foundry. We've also incorporated contracts from our [Setup Helpers](../oss/setup_helpers.md) repo which make managing the test suite setup much simpler.

## Prerequisites 

To make use of the fuzzing/formal verification tools that create-chimera-app supports, you'll need to install one of the following on your local machine: 
- [Echidna](https://github.com/crytic/echidna)
- [Medusa](https://github.com/crytic/medusa)
- [Halmos](https://github.com/a16z/halmos?tab=readme-ov-file#installation)
- [Kontrol](https://github.com/runtimeverification/kontrol?tab=readme-ov-file#fast-installation)

## Creating A New Project
First, you'll need to create a new project using the create-chimera-app template. You can use the _Use this template_ button on GitHub to do this. This will automatically create a new repository using the create-chimera-app template on your GitHub account. 

> Note: you can also use the `forge init --template https://github.com/Recon-Fuzz/create-chimera-app` command to create a new project locally, or just clone the repo directly using `git clone https://github.com/Recon-Fuzz/create-chimera-app`

Create-chimera-app ships with the [default Foundry template](https://book.getfoundry.sh/projects/creating-a-new-project) as an example. This is a simple `Counter` contract that you can use to get a feel for how invariant testing works. 

> If you want to initialize a clean project without the boilerplate from the default Foundry template, you can use the [create-chimera-app-no-boilerplate](https://github.com/Recon-Fuzz/create-chimera-app-no-boilerplate) repo


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

### Configurations

The create-chimera-app template includes two main configuration files that control how the fuzzers operate. We've set the defaults in the configuration so they work out-of-the-box with most repos so we recommend keeping most configurations set to their default except where noted below. 

We've found that modifying configurations consistently can often be a source of errors and make it difficult for collaborators to understand what's going on. As a rule of thumb, we only modify our configuration at the beginning of an engagement (if at all), then leave it as is for the remainder of our testing campaign. 

> The only config we consistently change during testing is the `testLimit` for Echidna, by overriding the value with the `--test-limit` flag in the CLI.

#### [`echidna.yaml`](https://github.com/Recon-Fuzz/create-chimera-app/blob/main/echidna.yaml)

The `echidna.yaml` file configures [Echidna](https://secure-contracts.com/program-analysis/echidna/index.html). 

- **testMode**: Set to `"assertion"` to run assertion-based property tests which we [use as our default](../writing_invariant_tests/implementing_properties.md#testing-mode)
- **prefix**: Set to `"optimize_"` because we don't use property mode, so this prefix is only used for optimization tests
- **coverage**: Enables coverage-guided fuzzing and creates a corpus that can be reused in other runs for faster fuzzing
- **corpusDir**: Sets the name of the directory where the corpus file will be saved
- **balanceAddr**: Starting ETH balance for sender addresses
- **balanceContract**: Starting ETH balance for the target contract
- **filterFunctions**: List of function signatures to include or exclude from fuzzing (we recommend not using this and instead just not including function handlers in your [`TargetFunctions`](../writing_invariant_tests/chimera_framework.md#targetfunctions) if you don't want to test a given function because it's clearer for collaborators)
- **cryticArgs**: Additional arguments passed to the crytic-compile compilation process (leave this as is unless you need to link libraries)
- **deployer**: Address used to deploy contracts during the fuzzing campaign (set to `"0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496"` for consistency with Foundry)
- **contractAddr**: Address where the target contract is deployed (this will be the `CryticTester` contract)
- **shrinkLimit**: Number of attempts to minimize failing test cases by removing unnecessary calls from the sequence

**Additional configuration options:**
- **testLimit**: Number of transactions to execute before stopping (we typically run `100000000` or higher for thorough testing)
- **seqLen**: Maximum length of transaction sequences that Echidna will generate to try to break properties
- **sender**: Array of addresses that can send transactions to the target contracts (leave this set to the default because our framework switches senders via actors in the [ActorManager](../oss/setup_helpers.md#actormanager) instead)

The template is pre-configured to work with Foundry as the build system, allowing for seamless integration between compilation and fuzzing.

#### [`medusa.json`](https://github.com/Recon-Fuzz/create-chimera-app/blob/main/medusa.json)

The `medusa.json` file configures [Medusa](https://secure-contracts.com/program-analysis/medusa/docs/src/index.html). The configuration sections include:

**Fuzzing Configuration:**
- **workers**: Number of parallel workers to use during fuzzing (defaults to max workers possible on your system given the number of cores)
- **workerResetLimit**: Number of call sequences a worker executes before resetting (set to `50`)
- **timeout**: Maximum duration for the fuzzing campaign in seconds (set to `0` for indefinite)
- **testLimit**: Number of transactions to execute before stopping (set to `0` for indefinite)
- **callSequenceLength**: Maximum number of function calls to attempt to break a property (set to `100`)
- **corpusDirectory**: Directory where corpus items and coverage reports are stored (set to `"medusa"`)
- **coverageEnabled**: Whether to save coverage-increasing sequences for reuse (set to `true`)
- **deploymentOrder**: Order in which contracts are deployed (ensures `CryticTester` is the target)
- **targetContracts**: Array specifying which contracts to fuzz (ensures `CryticTester` is the target)
- **targetContractsBalances**: Starting ETH balance for each target contract (hex-encoded)
- **constructorArgs**: Arguments to pass to contract constructors (unneeded because the `CryticTester` should never have a constructor; deploy all contracts in the [`Setup`](https://github.com/Recon-Fuzz/create-chimera-app/blob/main/test/recon/Setup.sol))
- **deployerAddress**: Address used to deploy contracts during fuzzing (set to `"0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496"` for consistency with Foundry)
- **senderAddresses**: Account addresses used to send function calls (leave this set to the default because our framework switches senders via actors in the [ActorManager](../oss/setup_helpers.md#actormanager) instead)
- **blockNumberDelayMax**: Maximum block number jump between transactions (set to `60480`)
- **blockTimestampDelayMax**: Maximum timestamp jump between transactions (set to `604800`)
- **blockGasLimit**: Maximum gas per block (you may need to raise this if your setup is very large)
- **transactionGasLimit**: Maximum gas per transaction (set to `12500000`)

**Testing Configuration:**
- **stopOnFailedTest**: Whether to stop after the first failed test (set to `false`)
- **stopOnFailedContractMatching**: Whether to stop on bytecode matching failures (set to `false`)
- **stopOnNoTests**: Whether to stop if no tests are found (set to `true`)
- **testAllContracts**: Whether to test all contracts including dynamically deployed ones (set to `false` because we only want to test via `CryticTester`)
- **traceAll**: Whether to attach execution traces to failed tests (set to `false`)

**Assertion Testing Configuration:**
- **enabled**: Whether assertion testing is enabled (set to `true`)
- **testViewMethods**: Whether to test view methods for assertions (set to `true`)
- **panicCodeConfig**: Configuration for which panic codes should fail tests

**Optimization Testing Configuration:**
- **enabled**: Whether optimization testing is enabled (set to `false`)
- **testPrefixes**: Prefixes for optimization test functions (set to `["optimize_"]`)

**Chain Configuration:**
- **codeSizeCheckDisabled**: Allows deployment of large contracts (set to `true`)
- **cheatCodesEnabled**: Whether cheatcodes are enabled (set to `true` because we use the `vm.prank` cheatcode for switching actors)
- **forkConfig**: Configuration for forking mode (enable for when you want to test against the live chain state)

**Compilation Configuration (Do not change):**
- **platform**: Compilation platform (set to `"crytic-compile"`)
- **target**: Target directory for compilation (set to `"."`)
- **args**: Additional compilation arguments (set to `["--foundry-compile-all"]`)

#### Linking Libraries

If your project requires the use of libraries with `external` functions like the following `ChainlinkAdapter`:

```javascript
library ChainlinkAdapter {
    /// @notice Fetch price for an asset from Chainlink fixed to 8 decimals
    /// @param _source Chainlink aggregator
    /// @return latestAnswer Price of the asset fixed to 8 decimals
    /// @return lastUpdated Last updated timestamp
    function price(address _source) external view returns (uint256 latestAnswer, uint256 lastUpdated) {
        uint8 decimals = IChainlink(_source).decimals();
        int256 intLatestAnswer;
        (, intLatestAnswer,, lastUpdated,) = IChainlink(_source).latestRoundData();
        latestAnswer = intLatestAnswer < 0 ? 0 : uint256(intLatestAnswer);
        if (decimals < 8) latestAnswer *= 10 ** (8 - decimals);
        if (decimals > 8) latestAnswer /= 10 ** (decimals - 8);
    }
}
```

you'll need to link the library to its deployed bytecode manually, or you'll run into a runtime error in Echidna/Medusa that can't be debugged with Foundry. 

To link the libraries, you simply need to modify the configuration files mentioned above like so, being sure to not remove the `"--foundry-compile-all"` flag as this allows easier debugging of compilation issues. 

For Echidna:
```yaml
cryticArgs: ["--compile-libraries=(ChainlinkAdapter,0xf04),"--foundry-compile-all"]
deployContracts: [
  ["0xf04", "ChainlinkAdapter"]
]
```

For Medusa: 
```json
"fuzzing": {
    ...
    "deploymentOrder": [
      "ChainlinkAdapter"
    ],
    ...
},
"compilation": {
    ...
    "platformConfig": {
      ...
      "args": [
        "--compile-libraries",
        "(ChainlinkAdapter,0xf04)",
        "--foundry-compile-all"
      ]
    }
  },
```

--- 

## Expanding The Example Project
create-chimera-app is meant to be a starting point for your own project. You can expand the example project by adding your own contracts and properties. See the [Chimera Framework](./chimera_framework.md) section on what the role of each contract is and see the [example project](../writing_invariant_tests/example_project.md) for how to implement properties using the framework. 

If you're new to defining properties, check out [this substack post](https://getrecon.substack.com/p/implementing-your-first-few-invariants?r=34r2zr) which walks you through the process of converting invariants from English to Solidity using an ERC4626 vault as an example using Chimera.
 



