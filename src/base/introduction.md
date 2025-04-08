# Introduction 

Recon is a tool for automatically scaffolding and running invariant testing in the cloud.

We also maintain a suite of tools that help with invariant testing and security research more generally.

## Creating An Account

To get started using Recon's free tools, you don't need to create an account and can use any of the tools in the [Free Recon Tools](../tools/medusa_scraper.md) section. 

To use more advanced features (running jobs in the cloud, alerts, etc.) you'll need to [create an account](https://getrecon.xyz/auth/signin?callbackUrl=https%3A%2F%2Fgetrecon.xyz%2Fdashboard) using your GitHub account and sign up for Recon Pro. 

Once you've created an account, you'll be redirected to the dashboard where you'll have access to all of the tools in the Recon suite.

## Learn Invariant Testing

Most of our guides and documentation are focused on using fuzzing tools, primarily [Echidna](https://github.com/crytic/echidna) and [Medusa](https://github.com/crytic/medusa) because we use them internally at Recon. However, we also support running other tools on our cloud infrastructure such as [Foundry](https://github.com/foundry-rs/foundry) (fuzzing), [Halmos](https://github.com/a16z/halmos) (formal verification), and [Kontrol](https://github.com/runtimeverification/kontrol) (formal verification). 

After having chosen a tool best suited to your needs and downloading it locally, you can get started by running jobs directly on the jobs pge.

If you're new to invariant testing, we recommend you starting with the following posts: 

1. [First Day At Invariant School](https://getrecon.substack.com/p/first-day-at-invariant-school?r=34r2zr)
2. [How To Define Invariants](https://getrecon.substack.com/p/how-to-define-invariants?r=34r2zr)
3. [Implementing Your First Smart Contract Invariants: A Practical Guide](https://getrecon.substack.com/p/implementing-your-first-few-invariants?r=34r2zr)

If you prefer a full end-to-end video bootcamp, checkout [this series](https://getrecon.xyz/bootcamp) on everything you need to know about invariant testing.

Once you've grasped the basics of invariant testing you can setup your first suite and run it on Recon. For a step-by-step guide on how to do this, check out the [First Steps](./first_steps.md) guide.

<!-- or use the documentation in the _Using Recon_ section to help guide you.  -->

If you have any questions about how to use Recon or invariant testing in general, you can reach out to our team on [Discord](https://discord.gg/aCZrCBZdFd).

## Additional Learning Resources

If you're looking for more resources to help you get started with invariant testing, please see the following: 

- [Recon Substack](https://getrecon.substack.com)
- [Recon Video Tutorials](https://getrecon.xyz/media)
- [Recon Twitter](https://x.com/getrecon)
- [Recon GitHub](https://github.com/Recon-Fuzz)
- [EVM Fuzzing Resources](https://github.com/perimetersec/evm-fuzzing-resources)

For more resources on Echidna and Medusa, please see the following: 

- [Echidna Documentation](https://secure-contracts.com/program-analysis/echidna/index.html)
- [Medusa Documentation](https://secure-contracts.com/program-analysis/medusa/docs/src/index.html)
- [Echidna Fuzzing Series](https://youtube.com/playlist?list=PLciHOL_J7Iwqdja9UH4ZzE8dP1IxtsBXI&si=Mar9xYrg4Ie-vc_0)



### Retrospectives

Deep dives into the work we've done with our elite customers:

- [Corn Retrospective](https://getrecon.substack.com/p/corn-engagement-retrospective)
- [eBTC Retrospective](https://getrecon.substack.com/p/ebtc-retrospective)
- [Centrifuge Retrospective part 1](https://getrecon.substack.com/p/lessons-learned-from-fuzzing-centrifuge)
- [Centrifuge Retrospective part 2](https://getrecon.substack.com/p/lessons-learned-from-fuzzing-centrifuge-059)


### (Video) Suggested Office Hours

Office hours is an initiative Alex has done for over half a year.

All talks are improvised so they are not as polished as structured content.

They provide a lot of hot takes and insights based on what the Recon Team was working on at the time.

- [Fuzz Fest](https://www.youtube.com/watch?v=Cqmu-mhSLt8) | The best Talks of 2024 on Fuzzing for Security
- [The Dangers of Arbitrary Calls](https://www.youtube.com/watch?v=8-qWL2Dcgpc) | How to write safe contracts that use arbitrary calls and the risk tied to them
- [Centrifuge Retrospective Pt1](https://www.youtube.com/watch?v=AT3fMhPDZFU) | On scaffolding and getting to coverage
- [Centrifuge Retrospective Pt2](https://www.youtube.com/watch?v=eBVp6WyEIx4) | On breaking properties and the importance of understanding the system you're testing
- [How we missed a bug with fuzzing!](https://www.youtube.com/watch?v=fXG2JwvoFZ0&t=8s) | On the dangers of clamping
- [Finding bugs with Differential Fuzzing](https://www.youtube.com/watch?v=AMCN1HP84BQ) | Using differential fuzzing to find bugs
- [Fuzzing Bytecode Directly](https://www.youtube.com/watch?v=RWvA9myV_LQ)

## Trophies 

A sample of the bugs we found thanks to Invariant Testing:

[https://getrecon.xyz/#trophies](https://getrecon.xyz/#trophies)