# Running Jobs In The Cloud With Recon

The jobs page is where you can run new fuzzing jobs on Recon's cloud service and see existing jobs you've run.

Using Recon's Job running feature you can offload long-duration jobs to Recon's cloud service so you don't waste computational resources locally and can run long-term jobs without worrying about something failing at the last minute because of something you did on your local machine.

**Video Tutorial:** [Run Jobs with Recon Pro](https://www.youtube.com/watch?v=LWQeFSZ9kz4) (5min)

## How To Run A Fuzzing Job

![Jobs](../images/using_recon/job.png)

On the _Jobs_ tab you'll see a form for running a job. 

1. First select the tool you'd like to use to run your job. The Echidna, Medusa, and Foundry options use fuzzing. The Halmos and Kontrol options use formal verification. 

2. Next add the repository you'd like to fuzz or verify in the _GitHub Repo Url_ field. Additionally, you can specify a custom name for the job in the _Job Name_ field. If you don't specify a custom name, Recon will generate one for you that is a hash with numbers and letters. 

3. If you'd prefer to specify the organization, repo name, branch, and directory where the `foundry.toml` file is located, you can do so in the _Organization_, _Repo Name_, _Branch_ and _Directory_ fields. 

4. Next you can specify the configuration parameters for the tool you selected in step 1 using a config file or by specifying values in the form fields directly (NOTE: these will override any parameters set in the config file if one is passed in). 

5. If your project uses a dependency system in addition to foundry, you can select the custom preinstall process in the dropdown menu.

6. You can optionally add a custom **Job Name** to make it easier to identify your job later. If you don't provide one, Recon will generate a random hash.

7. Click **Run Job** to start the fuzzing or verification job in the cloud.

## Using Recipes

You can save time by using [recipes](./recipes.md) - pre-configured job templates that appear at the top of the Jobs page. Simply select a recipe and it will prefill all the form fields, which you can then modify as needed before running the job.

## Dynamic Replacement

For advanced use cases, you can enable [dynamic replacement](./dynamic_replacement.md) to replace variables in your `Setup.sol` file without modifying the code. This is useful for testing different configurations or running the same test suite against different deployments.

## Corpus Reuse

If you've run a similar job before, you can paste the corpus from a previous run into the **Target Corpus** field. This allows Recon to reuse the fuzzer's learned inputs, which can save days of exploration time. See [Recon Tricks](./recon_tricks.md) for more details.

## Job Status and Monitoring

Once a job starts, you can:
- Monitor its progress in real-time on the Jobs page (updates every minute)
- Share the job URL with team members or auditors - the page updates automatically
- Stop a running job if needed
- Download the corpus for reuse in future jobs
- View broken properties and download Foundry reproducers

## Billing Limits

- **Trial accounts** can only run one job at a time
- **Pro accounts** can run multiple jobs concurrently

## Tool-Specific Video Tutorials

- [Echidna Jobs](https://www.youtube.com/watch?v=JvPrJPGTjY8) (5min)
- [Foundry Jobs](https://www.youtube.com/watch?v=GIURs72Nqno) (2min)
- [Medusa Jobs](https://www.youtube.com/watch?v=xXd0CV92Rp8) (1min)
- [Halmos Jobs](https://www.youtube.com/watch?v=PxD7xSCtnPA) (1min)
