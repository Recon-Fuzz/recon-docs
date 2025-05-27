# Echidna Log Scraper

A web-based tool to convert Echidna traces into Foundry reproducer unit tests.

## How to Use

1. Run your Echidna fuzzing campaign and collect any failing property outputs
2. Copy the trace output from Echidna
3. Paste the trace into the Echidna Log Scraper tool
4. The tool will generate a Foundry unit test that reproduces the failing property

This tool is built on top of our [Log Parser](../oss/logs_parser.md) NPM package.

## Features

- Converts Echidna call sequences into readable Foundry tests
- Handles complex multi-call traces
- Generates properly formatted Solidity test code
- Works with any Echidna output format

Access the tool at: [https://getrecon.xyz/tools/echidna](https://getrecon.xyz/tools/echidna)
