# <a href="https://github.com/Recon-Fuzz/log-parser" target="_blank" rel="noopener noreferrer">Log Parser</a>

A TypeScript package to convert Medusa and Echidna traces into Foundry reproducer unit tests.

Available in an easy to use UI in our:
- [Echidna Log Scraper](../free_recon_tools/echidna_scraper.md)
- [Medusa Log Scraper](../free_recon_tools/medusa_scraper.md)

## NPM

[npm](https://www.npmjs.com/package/@recon-fuzz/log-parser)

## Installation

```bash
yarn add @recon-fuzz/log-parser
```


## Usage

```typescript
import { processLogs, Fuzzer } from '@recon-fuzz/log-parser';

// Process Medusa logs
const medusaResults = processLogs(medusaLogContent, Fuzzer.MEDUSA);

// Process Echidna logs
const echidnaResults = processLogs(echidnaLogContent, Fuzzer.ECHIDNA);
```

## API Reference

### `processLogs(logs: string, tool: Fuzzer): FuzzingResults`

Processes fuzzing logs and returns structured results.

#### Parameters
- `logs: string` - The raw log content as a string
- `tool: Fuzzer` - The fuzzer tool used (Fuzzer.MEDUSA or Fuzzer.ECHIDNA)

#### Returns: `FuzzingResults`
```typescript
interface FuzzingResults {
  duration: string;
  coverage: number;
  failed: number;
  passed: number;
  results: any[];
  traces: any[];
  brokenProperties: any[];
  numberOfTests: number;
}
```

## Medusa and Echidna Conversion to Foundry

### Converting Fuzzer Logs to Foundry Tests

Both Medusa and Echidna logs can be converted into Foundry test cases using the provided utility functions:

```typescript
// For Echidna logs
import { echidnaLogsToFunctions } from '@recon-fuzz/log-parser';

const foundryTest = echidnaLogsToFunctions(
  echidnaLogs,
  "test_identifier",
  "brokenProperty",
  { roll: true, time: true, prank: true }
);

// For Medusa logs
import { medusaLogsToFunctions } from '@recon-fuzz/log-parser';

const foundryTest = medusaLogsToFunctions(
  medusaLogs,
  "test_identifier",
  { roll: true, time: true, prank: true }
);
```

The conversion handles:
- VM state manipulation (block numbers, timestamps)
- Actor simulation (pranks for different senders)
- Function call sequences
- Special data types (addresses, bytes)

Generated tests will include the exact sequence of calls that triggered the property violation, making it easy to reproduce and debug issues found during fuzzing. 

