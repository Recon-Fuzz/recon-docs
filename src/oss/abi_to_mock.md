# <a href="https://github.com/Recon-Fuzz/abi-to-mock" target="_blank" rel="noopener noreferrer">ABI to Mock</a>

Given an ABI file generate a mock contract with functions that allow setting the return value of all view functions.

The simplest form of mocking that generates contracts that can be easily integrated into a fuzz testing suite.

Works well with the Recon Extension (coming soon) and the [ABI to Invariants](./abi_to_invariants.md) Builder.

## Features

- Generates fully functional Solidity mock contracts
- Supports complex data types including structs and nested arrays
- Maintains function signatures and event definitions
- Customizable contract names and output locations
- Available as both a CLI tool and JavaScript library

## Generated Mock Features

- Complete function signatures matching the original contract
- Setter functions for return values
- Complex type support (structs, arrays, mappings)

## Installation

```bash
npm install abi-to-mock
```

## Usage

### Command Line Interface

```bash
npx abi-to-mock <abi-file> [options]

Options:
  --out, -o   Output directory (default: "./out")
  --name, -n  Contract name (default: "Contract")
```

Example:
```bash
npx abi-to-mock ./MyContract.json --out ./mocks --name MyContract
```

### Using with Foundry
```bash
forge build

npx abi-to-mock out/ERC20Mock.sol/ERC20Mock.json --name Erc20Mock --out src/
```

### Programmatic Usage

```javascript
// Node.js
const AbiToMock = require('abi-to-mock');
// or ES Modules
import AbiToMock from 'abi-to-mock';

// From file
AbiToMock('./MyContract.json', './mocks', 'MyContract');

// From ABI object
const abi = [
  {
    "inputs": [],
    "name": "getValue",
    "outputs": [{"type": "uint256"}],
    "type": "function"
  }
];
AbiToMock.generateMock(abi, './mocks', 'MyContract');

// Browser usage
import { generateMockString } from 'abi-to-mock';
const mockCode = generateMockString(abi, 'MyContract');
```

## API Reference

```js
// Node.js API
AbiToMock(abiPath: string, outputDir?: string, name?: string): MockContract
AbiToMock.generateMock(abi: ABI[], outputDir: string, name: string): MockContract

// Browser API
generateMockString(abi: ABI[], name: string): string
```