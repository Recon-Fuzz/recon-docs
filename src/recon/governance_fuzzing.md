# Governance Fuzzing

Governance fuzzing allows us to simulate on-chain changes that modify the system state (function calls) or system configuration (governance function calls) in our forked testing setup to determine if the change causes a break in the existing properties.

## How It Works

To execute governance fuzzing on a system we first need to have a fork testing setup that achieves full coverage. 

The fork setup must include calls to the `vm.roll` and `vm.warp` cheatcodes because echidna does not automatically warp to the timestamp at the block that it’s forking from. This works around this by ensuring that echidna only makes calls after the relevant block timestamp from which it’s forking using Dynamic Block Replacement.

Governance fuzzing is triggered by listening to an event emitted on a contract of interest. This event then sets off a chain where a forked fuzzing job is executed and any values in the system setup that need to be replaced can be replaced with new values from the event or the forked chain state. 

The fuzzing job that's run is a normal fuzzing job except and will show up on the jobs page. 