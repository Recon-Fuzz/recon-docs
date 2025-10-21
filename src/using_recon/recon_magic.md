# Recon Magic

Recon Magic uses AI-powered workflows to automatically generate invariant tests, unit tests, and perform security audits on your smart contracts.

## Available Workflows

Recon Magic offers four different AI workflow types:

### 1. Scaffold Invariant Tests to Coverage

Automatically generates a complete Chimera invariant testing suite for your project with the goal of achieving maximum line coverage. This workflow:
- Analyzes your contracts to identify testable functions
- Generates handlers for all public/external functions
- Creates a Setup.sol file with deployment logic
- Scaffolds invariant properties based on common patterns
- Aims for comprehensive code coverage

**Best for**: Projects that need a complete invariant testing suite from scratch

### 2. Setup Unit Tests for One Contract

Generates focused unit tests for a specific contract in your codebase. This workflow:
- Lets you select a specific contract from your repository
- Analyzes the contract's functions and state variables
- Generates unit tests covering edge cases and common scenarios
- Creates test fixtures and helper functions

**Best for**: Testing individual contracts or adding coverage to specific components

### 3. Identify Invariants in My Smart Contracts

Analyzes your smart contracts to automatically identify and suggest invariants (properties that should always hold true). This workflow:
- Examines contract logic and state transitions
- Identifies mathematical relationships and constraints
- Suggests invariant properties based on the contract's design
- Provides reasoning for each suggested invariant

**Best for**: Projects that need help defining what properties to test

### 4. Find Me Some Bugs (Experimental)

Performs an AI-powered security audit to identify potential vulnerabilities. This workflow:
- Analyzes contracts for common vulnerability patterns
- Checks for edge cases that could lead to unexpected behavior
- Identifies potential reentrancy, overflow, and access control issues
- Generates a report with findings and recommendations

**Best for**: Initial security reviews or finding low-hanging fruit before a full audit

## How To Use Recon Magic

1. **Navigate to the Magic page** in the Recon dashboard

2. **Enter your repository details**:
   - Paste the GitHub URL (e.g., `https://github.com/org/repo`) or
   - Manually enter Organization, Repository, and Branch names

3. **Select a workflow type** from the radio options

4. **(For Unit Tests only)** Click "Fetch Contracts" and select the specific contract you want to test

5. **Click "Start Job"** to begin the AI workflow

## Monitoring Magic Jobs

Once started, you can:
- View all your Magic jobs in the jobs list below the form
- Filter and search jobs by name, workflow type, status, or repository
- Sort jobs by creation date (newest or oldest first)
- Click on a job card to view detailed results and generated code
- Delete completed jobs you no longer need

## Job Status

Magic jobs can have the following statuses:
- **QUEUED** ⏳ - Job is waiting to start
- **RUNNING/STARTED/WIP** ▶️ - AI is actively working on your code
- **SUCCESS/DONE** 🟢 - Job completed successfully, results are ready
- **ERROR/FAILED** 🔴 - Job encountered an error
- **STOPPED** ⏹️ - Job was manually stopped

## Viewing Results

When a Magic job completes successfully, click "View Details" to see:
- A markdown summary of what was generated
- Generated code artifacts (tests, handlers, properties)
- Recommendations and next steps
- Download links for all generated files

## Requirements

- Your repository must be accessible to the Recon GitHub App
- The repository must contain valid Foundry project structure
- You must have an active Recon Pro subscription

## Tips

- Start with "Identify Invariants" to understand what properties matter in your contracts
- Use "Scaffold Invariant Tests to Coverage" to quickly get a working test suite
- Run "Find Me Some Bugs" early in development to catch issues before they become expensive
- Combine Magic-generated tests with manually written properties for best results

## Limitations

- AI-generated tests should be reviewed and validated before use in production
- The "Find Me Some Bugs" workflow is experimental and may produce false positives
- Complex contract interactions may require manual test refinement
- Generated code follows Recon's standard templates and conventions
