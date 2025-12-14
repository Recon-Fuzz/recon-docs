# Recon Magic

Recon Magic provides AI-powered automations for smart contract fuzzing. While [Fuzzing Jobs](./running_jobs.md) let you run fuzzing tools in the cloud with extensive features and functionality, **Recon Magic** offers AI agents that automate the setup and optimization process.

Access Recon Magic at: [getrecon.xyz/dashboard/magic](https://getrecon.xyz/dashboard/magic)

Works with both public and private repositories. For private repos, [install the Recon GitHub App](./getting_started.md#using-private-repositories) first.

## V2 Workflows

The V2 AI agents are designed to be used in sequence. You can start from code as long as it's somewhat valid. Each step builds on the previous one:

### Scout V2 (`workflow-fuzzing-scouting`)

Give Scout V2 any repository and it will essentially use the [Recon Extension](../free_recon_tools/recon_extension.md) for you. It analyzes your codebase and identifies invariants in your smart contracts.

**Input:** Any GitHub repository

### Setup V2 (`workflow-fuzzing-setup`)

Setup V2 fixes compilation issues and creates a professional fuzzing setup so your fuzzing campaign will be useful.

**Input:** Repository (can have compilation issues)
**Output:** Fixed compilation + professional fuzzing setup

### Coverage V2 (`workflow-fuzzing-coverage`)

Coverage V2 requires valid compilation and a valid setup. It then works to push your code toward better coverage.

**Input:** Repository with valid compilation and valid setup
**Output:** Improved coverage for your fuzzing campaign

**How it works:** Coverage V2 runs a multi-step workflow that:
1. Extracts target functions from your fuzzing suite
2. Analyzes build artifacts to identify all functions that need coverage
3. Creates clamped handlers with meaningful values for better fuzzing
4. Creates shortcut handlers to help the fuzzer reach coverage faster
5. Runs fuzzing and evaluates coverage
6. Iteratively improves handlers until coverage targets are met

Each step automatically commits changes to git, so you can track exactly what the AI modified.

## Using the Workflows

1. **Start with Scout V2** to analyze your repository and identify invariants
2. **Run Setup V2** to fix any compilation issues and establish a solid fuzzing foundation
3. **Use Coverage V2** to maximize your test coverage

Automatic chaining of these workflows is coming soon. Currently, running them separately provides better reliability.

## V1 Workflows

These are simpler, single-prompt workflows that run a sequence of agent phases:

### Identify Invariants (`properties-0`)

Analyzes your smart contracts and identifies potential invariants. Extract meaningful properties from your codebase.

**Input:** Any GitHub repository with smart contracts
**Output:** A document specifying a ton of properties for your system.

### Find Bugs (`audit-naive-0`) - Experimental

AI-powered audit workflow that attempts to find bugs in your smart contracts. P automated security analysis.

**Input:** Any GitHub repository with smart contracts
**Note:** An audit report.
