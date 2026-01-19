# Recon Magic

Recon Magic provides AI-powered automations for smart contract fuzzing. While [Fuzzing Jobs](./running_jobs.md) let you run fuzzing tools in the cloud with extensive features and functionality, **Recon Magic** offers AI agents that automate the setup and optimization process.

Access Recon Magic at: [getrecon.xyz/dashboard/magic](https://getrecon.xyz/dashboard/magic)

Works with both public and private repositories. For private repos, [install the Recon GitHub App](./getting_started.md#using-private-repositories) first.

## Running Magic Jobs

This section covers how Magic Jobs work, regardless of which specific workflow you choose.

### How It Works

When you start a Magic Job, the following happens:

1. **Repository Creation**: A new GitHub repository is created for your job results (e.g., `your-repo-processed-1734567890`)
2. **User Invitation**: You (and any other GitHub users you specify) are automatically invited as collaborators to the new repository
3. **Initial Push**: Your original code is pushed to the new repository as the initial commit
4. **Workflow Execution**: The AI workflow runs, making changes and committing them step by step
5. **Results**: View the diff, generated documentation, and any artifacts directly in the dashboard

### Repository Access

#### Automatic Invitations

When you start a job, you are automatically invited to the results repository. The invitation is sent before the workflow begins, so you can follow along in real-time.

#### Inviting Additional Users

You can invite other GitHub users to the results repository at any time:

1. Navigate to your job's detail page in the dashboard
2. Find the "Invite GitHub user to repository" form
3. Enter the GitHub username of the person you want to invite
4. Click "Invite"

The invited user will receive a GitHub collaboration invite with push access to the repository.

### Code Updates and Commits

Magic Jobs commit changes after each workflow step. This provides:

- **Transparency**: See exactly what the AI modified at each step
- **Traceability**: Each step has its own commit hash you can reference
- **Real-time progress**: Changes are pushed to GitHub as they happen

In the job detail page, you can:

- View the workflow progress with step-by-step completion status
- Click on commit hashes to view them directly on GitHub
- Expand each step to see which files were changed
- Click on file names to view them at that specific commit

### Stopping a Job Early

If you need to stop a running job:

1. Navigate to the job's detail page
2. Click the "Stop Job" button (visible while the job is running)
3. The job will gracefully stop after the current step completes

The "Stop requested" badge will appear once your request is received. The job will finish its current step, commit any changes, and then stop. You'll still have access to all the work completed up to that point.

### Job Statuses

- **Queued**: Job is waiting to be processed
- **WIP (Work in Progress)**: Job is currently running
- **Done**: Job completed successfully
- **Stopped**: Job was stopped early by user request
- **Error**: Job encountered an error during execution

---

_See below for workflow-specific tutorials and details on each Magic Job type._

## V2 Workflows

## Scout + Setup + Properties + Coverage

The complete end-to-end workflow that takes you from raw code to a fully functional fuzzing suite with properties.

### Requirements

None. Works with any Solidity repository.

### What does it do?

- Analyzes your codebase to understand the system architecture
- Makes setup decisions including fuzzing suite architecture, what to test, and what to exclude
- Scaffolds the suite and creates the `Setup.sol` contract
- Generates target functions and creates foundry test wrappers
- Writes properties in `Properties.sol`
- Sorts sequences by coverage impact

### What is the expected outcome?

- A complete fuzzing suite ready to run
- `FUZZING_SETUP_COMPLETE.md` explaining what was done
- `Properties.sol` populated with properties ready to break the protocol
- Recommendations on where to focus your fuzzing efforts
- Documentation in the `magic` folder including additional properties to consider

### When to use it?

Use this when starting from scratch and want the AI to handle everything: setup, coverage, and property writing.

## Scout + Setup + Coverage

A streamlined workflow that sets up your fuzzing suite optimized for coverage, without writing properties.

### Requirements

None. Works with any Solidity repository.

### What does it do?

- Analyzes your codebase and makes setup decisions
- Scaffolds the project and implements `Setup.sol`
- Identifies target functions and creates handlers
- Creates clamped handlers for better fuzzing
- Optimizes for coverage

### What is the expected outcome?

- A working fuzzing suite targeted for coverage
- `Setup.sol` with documented setup decisions
- Handler functions ready for fuzzing

You do **not** get properties written. You'll need to write those yourself or run a properties workflow afterward.

### When to use it?

Use this when you want AI help with setup and coverage but prefer to write your own properties, or when you plan to run a separate properties workflow later.

## Setup + Properties + Coverage

A comprehensive workflow for scaffolded projects that handles setup, property writing, and coverage optimization.

### Requirements

Requires a scaffolded project with valid compilation.

### What does it do?

- Analyzes your codebase to understand the system architecture
- Creates a setup based on the code and populates `Setup.sol`
- Writes clamped handlers for coverage generation
- Creates target function wrappers in `CryticToFoundry.sol` and runs initial Echidna fuzzing campaign for corpus generation
- Writes extensive properties that are expected to hold true in the system

### What is the expected outcome?

- A populated `Setup.sol` with setup decisions
- Clamped handlers written to reach maximum coverage
- Properties written for stress testing the protocol
- Setup decision notes in the `magic` folder
- Properties decisions documented in the `magic` folder

### When to use it?

Use this when you have already scaffolded your project and want Magic to handle setup, write properties, and optimize coverage for you.

## Setup + Coverage

A focused workflow for scaffolded projects that creates setup and optimizes coverage without writing properties.

### Requirements

Requires a scaffolded project with valid compilation.

### What does it do?

- Analyzes your contracts to understand the system
- Creates `Setup.sol` with setup decisions
- Documents decisions in `magic/setup-decisions.json` and `magic/setup-notes.md`
- Creates comprehensive target functions including `AdminTargets` and `ManagerTargets`
- Populates `CryticToFoundry.sol` with functions for validation

### What is the expected outcome?

- A configured `Setup.sol` with documented setup decisions
- Comprehensive target functions for ensuring high coverage
- Setup notes and documentation in the `magic` folder

You do **not** get properties written. You'll need to write those yourself or run a properties workflow afterward.

### When to use it?

Use this when you have a scaffolded project and want to create setup and achieve high coverage quickly, but prefer to write the properties yourself.

## Coverage V2

Workflow name in the Magic dashboard: `workflow-fuzzing-coverage`

A coverage-focused workflow that creates extensive handlers to maximize fuzzing coverage.

### Requirements

Requires a scaffolded project with valid compilation.

### What does it do?

- Makes setup decisions and populates `Setup.sol`
- Creates comprehensive coverage with clamped handlers and shortcuts
- Generates `DoomsdayTargets` for edge case testing
- Generates `AdminTargets` for privileged function testing
- Iteratively improves handlers until coverage targets are met

### What is the expected outcome?

- Extensive test coverage through well-crafted handlers
- Clamped handlers with meaningful values
- Shortcut handlers to help the fuzzer reach coverage faster

You get coverage optimization only. No properties are written.

### When to use it?

Use this when you already have a scaffolded project and want to maximize coverage before writing properties.

## Implement Properties from Setup

Workflow name: `workflow-properties-full`

A fast workflow that writes properties based on your existing setup.

### Requirements

Requires an existing setup in place (`Setup.sol` must exist).

### What does it do?

- Populates `Properties.sol` with comprehensive properties for your system
- Generates `BeforeAfter.sol` with state tracking
- Creates detailed documentation on properties organized by property classes

### What is the expected outcome?

- `Properties.sol` populated with properties that should hold in your system
- Populated `BeforeAfter.sol` for state comparison
- Documentation in the `magic` folder showing properties across different categories

### When to use it?

Use this when you already have coverage in place and want help writing properties. This is faster than full workflows since it focuses solely on property generation.

## Implement Properties from Setup (Opus)

Same as Implement Properties from Setup but uses the Claude Opus model for higher quality output.

### Requirements

Requires an existing setup in place (`Setup.sol` must exist).

### What does it do?

- Uses the most advanced Opus model to analyze your system
- Creates comprehensive properties with deeper analysis
- Generates extensive documentation on choices and reasoning

### What is the expected outcome?

- `Properties.sol` with high-quality properties generated by Opus
- Populated `BeforeAfter.sol` for state comparison
- Extensive documentation in the `magic` folder explaining the AI's reasoning and property choices

### When to use it?

Use this when you want the best possible help writing properties and are willing to wait a bit longer for higher quality output.

## Identify Invariants (V1)

A lightweight analysis workflow that identifies invariants without modifying your codebase.

### Requirements

None. Works with any Solidity repository.

### What does it do?

- Analyzes your smart contracts for potential invariants
- Documents a comprehensive list of properties that could be tested
- Identifies contract dependencies
- Lists discarded properties with reasoning

This workflow does **not** scaffold, does **not** create `Setup.sol`, and does **not** write `Properties.sol`.

### What is the expected outcome?

- Documentation in the `magic` folder containing:
  - A comprehensive list of invariants and properties to test
  - Contract dependency analysis
  - Discarded properties with explanations

### When to use it?

Use this when you want to understand which invariants might be valuable for your system before committing to a full setup. Ideal if you prefer to write the properties yourself.

## Find Bugs (V1)

Workflow name: AI Powered Audit

_Experimental._

An AI-powered audit workflow that attempts to find bugs in your smart contracts.

### Requirements

Any GitHub repository with Solidity smart contracts.

### What does it do?

- Performs automated security analysis
- Attempts to identify vulnerabilities and bugs

### What is the expected outcome?

- An audit report highlighting potential issues

### When to use it?

Use this for a quick automated security check. Note that this is experimental and results may vary.

## Choosing the Right Workflow

| Workflow                              | Setup   | Coverage | Properties | Best For                                                      |
| ------------------------------------- | ------- | -------- | ---------- | ------------------------------------------------------------- |
| Scout + Setup + Properties + Coverage | Yes     | Yes      | Yes        | Starting from scratch, want everything automated              |
| Scout + Setup + Coverage              | Yes     | Yes      | No         | Want AI setup but prefer writing own properties               |
| Setup + Properties + Coverage         | Yes     | Yes      | Yes        | Have scaffolded project, want setup, coverage, and properties |
| Setup + Coverage                      | Yes     | Yes      | No         | Have scaffolded project, want setup and coverage only         |
| Coverage V2                           | Partial | Yes      | No         | Already have setup, need better coverage                      |
| Implement Properties from Setup       | No      | No       | Yes        | Have coverage, need help with properties                      |
| Implement Properties (Opus)           | No      | No       | Yes        | Want highest quality property generation                      |
| Identify Invariants (V1)              | No      | No       | Docs only  | Research phase, want to understand invariants first           |
| Find Bugs (V1)                        | No      | No       | No         | Quick automated security audit (experimental)                 |
