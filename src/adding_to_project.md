# Adding Recon To Your Project

After you've built your handlers, you can add them to your project by following the steps below. 

## Installing Dependencies (Chimera)

Before adding your test scaffolding files to your project you’ll need to install the Chimera dependency with the following command:

```bash
forge install Recon-Fuzz/chimera
```

After adding Chimera you need to add a remapping for it to your remappings array in your `foundry.toml` config:

```toml
remappings = [
  '@chimera/=lib/chimera/src/'
]
```

If your project uses a `remappings.txt` file instead of listing remapping in the foundry config file, you can add the Chimera remapping to your `remappings.txt` file by adding the following line:

```
@chimera/=lib/chimera/src/
```

## Add Recon Files To Project

The _Download all files_ button on the _Build your Handlers_ page allows you to add the files to your project. Add these files to a directory named `test` and unzip the `recon.zip` file to extract your test scaffolding. 

You'll also need to move the `echidna.yaml` and `medusa.json` config files into the root of your project (in the same location as the `foundry.toml` config file).

Your file structure should now look like this:

```
src/
├── test/
│   ├── recon/
│   │   ├── BeforeAfter.sol
│   │   ├── CryticTester.sol
│   │   ├── CryticToFoundry.sol
│   │   ├── Properties.sol
│   │   ├── Setup.sol
│   │   ├── TargetFunctions.sol
├── echidna.yaml
├── medusa.json
├── foundry.toml
```

Your project is now configured to run using the default commands provided in the `CryticTester` contract locally or using the Recon cloud runner. 

To run Echidna locally:
```bash
echidna . --contract CryticTester --config echidna.yaml
```

To run Medusa locally:
```bash
medusa fuzz
```