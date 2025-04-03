# Glossary

## Actor

The address that will perform the calls specific to TargetFunctions

## CryticTester

The Invariant Testing contract that we will deploy and that the fuzzer will use to explore state and properties

## CryticToFoundry

The Foundry Test contract we use to debug repros obtained with other tools

## Invariant Testing

The techniques and the act of testing specific invariants and properties on Smart Contracts

## Property

A fact about a Smart Contract or System that can be tested

## Invariant

A property that always holds for the Smart Contract or System

## Fuzzer

We refer to Fuzzer to mean an engine/solver, a program that can perform stateful tests on a Smart Contract or System.

Some fuzzes are concrete, others concolyc, and others symbolic.

## Handler

A specific target function

## Target Function

The list of functions that you want the fuzzer to call to explore state and properties for the Smart Contract or System

## Scaffolding

The set of contracts necessary to achieve a certain goal

Typically Invariant Testing Scaffolding is the set of Smart Contracts put into place to organize the code and tell the fuzzer how to explore states and test properties.

## Echidna

A Concrete Fuzzer written in Haskell, using HEVM as its EVM engine

## Medusa

A Concrete Fuzzer written in Go, using GETH for the EVM engine.

## Halmos

A Symbolic Fuzzer written in Python, using its own SEVM for the EVM engine