# Glossary

## Invariant Testing

The techniques and the act of testing specific invariants and properties on Smart Contracts

## Property

A fact about a Smart Contract or System that can be tested

## Invariant

A property that always hold for the Smart Contract or System

## Fuzzer

We refer to Fuzzer to mean a engine / solver, a program that can perform stateful tests on a Smart Contract or System

Some fuzzers are concrete, other concolyc and other symbolic

## Handler

A specific target function

## Target Function

The list of functions that you want the fuzzer to call to explore state and properties for the Smart Contract or System

## Scaffolding

The set of contracts necessary to achieve a certain goal

Typically Invariant Testing Scaffolding is the set of Smart Contracts put into place to organize the code, and tell the fuzzer how to explore states and test properties

## Echidna

A Concrete Fuzzer written in Haskell, using HEVM as it's EVM engine

## Medusa

A Concrete Fuzzer written in Go, using GETH for the EVM engine

## Halmos

A Symbolic Fuzzer written in Python, using it's own SEVM for the EVM engine