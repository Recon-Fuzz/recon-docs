![Recon Text Logo](../images/recon_text_logo.png)

[Recon](https://getrecon.xyz/#team) is a team of invariant testing engineers and security researchers that provide invariant testing as a service while also developing tools and educational content to make it easier for anyone to test invariants on their smart contracts.

Our goal is to make Invariant Testing a baseline for all projects building on the EVM.

We're amongst the most prolific invariant testing writers, with [our template being used over 300 times by multiple professionals](https://getrecon.xyz/pro#builder).

[Recon Pro](../using_recon/running_jobs.md) is a tool for running invariant tests in the cloud.

**Video Tutorial:** [Intro to Recon Pro V2](https://www.youtube.com/watch?v=Gmdlka30uqs) (1min)

The [Recon Extension](../free_recon_tools/recon_extension.md) is an open source VS Code Extension to scaffold a Invariant Testing Boilerplate using the [Chimera Framework](../writing_invariant_tests/chimera_framework.md).

## Navigating the Book

### Writing Invariant Tests
If you're new to invariant testing with fuzzing, use the [Learn Invariant Testing](../writing_invariant_tests/learn_invariant_testing.md) section to learn the background info you'll need to get started.

You can then follow along with the [Example Project](../writing_invariant_tests/example_project.md) to see how to set up a project using the [Chimera Framework](../writing_invariant_tests/chimera_framework.md) and [Create Chimera App](../writing_invariant_tests/create_chimera_app.md) template.

Once you've gotten the hang of writing invariants and are using them in real projects, check out the [Advanced Fuzzing Tips](../writing_invariant_tests/advanced.md) section for best practices we've developed after using our Chimera framework for over a year on dozens of engagements.

### Building Handlers
Learn how to use the Recon UI to [add a test harness](../using_recon/building_handlers.md) to your Foundry project.

### Running Jobs
Learn how to offload a fuzzing job using the [Recon cloud runner](../using_recon/running_jobs.md).

### Using Recipes
Learn how to reuse fuzzer configurations when running jobs on the Recon cloud runner using [recipes](../using_recon/recipes.md).

### Adding Alerts
Learn how to [add alerts](../using_recon/alerts.md) for jobs run on the Recon cloud runner that can notify you of broken properties via Telegram or webhook.

### Dynamic Replacement
You can test your existing invariant suite with different setup configurations without having to modify the existing setup using [dynamic replacement](../using_recon/dynamic_replacement.md).

### Governance Fuzzing
Simulate on-chain changes that modify the system state (function calls) or system configuration (governance function calls) in a forked testing environment so you can preview changes and their side effects before they happen on-chain using [governance fuzzing](../using_recon/governance_fuzzing.md).

### Useful Tips
Learn how to make the most of Recon's features so that you can [fuzz more effectively](../using_recon/recon_tricks.md).

### Recon Extension
The Visual Studio Code extension that combines our most useful fuzzing tools into one so you can get to fuzzing faster. Learn how to use it [here](../free_recon_tools/recon_extension.md).

### Recon Tools
Recon's free tools can help you turn fuzzer logs into Foundry reproducers ([Echidna](../free_recon_tools/echidna_scraper.md)/[Medusa](../free_recon_tools/medusa_scraper.md)).

Our bytecode tools can help you [compare the bytecode](../free_recon_tools/bytecode_compare.md) of two different contracts and [generate an interface](../free_recon_tools/bytecode_to_interface.md) for a given contract's bytecode.

### Open Source Contributions
Recon has created a number of open source tools to make invariant testing easier. These can be found in the OSS Repos section.

### OpSec
Learn about [best practices](../opsec/op_sec.md) for operational security for web3 teams and the services that Recon provides to help projects with this.

### Glossary
See the [glossary](../glossary.md) for terminology used throughout the book.

