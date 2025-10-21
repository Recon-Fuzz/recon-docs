# Governance Fuzzing - WIP

Governance fuzzing allows us to simulate on-chain changes that modify the system state (function calls) or system configuration (governance function calls) in our forked testing setup to determine if the change causes a break in the existing properties.

**Video Tutorial:** [Governance Fuzzing](https://www.youtube.com/watch?v=nrPCa59nl9M) (2min)

## How It Works

To execute governance fuzzing on a system we first need to have a fork testing setup that achieves full line coverage over the contracts of interest. 

The fork setup must include calls to the `vm.roll` and `vm.warp` cheatcodes because Echidna does not automatically warp to the timestamp at the block that it’s forking from. This works around this by ensuring that Echidna only makes calls after the relevant block timestamp from which it’s forking using dynamic block replacement.

Once governance fuzzing is setup, it's triggered by listening to an event emitted on a contract of interest. This event then sets off a chain where a forked fuzzing job is started. Additionally, any values in the system setup that need to be replaced for effective testing can be replaced with new values from the triggering event or the forked chain state. 

The fuzzing job that's run is a normal cloud fuzzing job and will show up on the jobs page. 