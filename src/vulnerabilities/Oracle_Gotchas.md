Oracles are the weakest point in defi by far

Assuming a system is self-referential and sound
Oracles are always a "entry from the unkwnown" as the ultimately attempt to bring external prices into the equation

I believe there is no perfect oracle

However, due to my experience, this is CL Favouring discussion.

I pick CL because in spite the clear flaws, I think it has the least.

I will try my best to provide the reader with an exhaustive pros and cons for all oracles

# CL

CL oracle are push oracles, they are updated by trusted third parties.

This creates a clear risk when a certain amount of operators is hijacked, or returns the incorrect value.

While this has happened rarely, this is a huge risk, share with all oracles in this list.

Ultimately, except for oracles that are based on storage proofs, all oracles can return the incorrect price due to an operator mistake, bug or them turning rogue.

# Pyth

Pyth shares the same issue, but also the downside that prices can be updated on each block / whenever a price is available

This creates a huge gotcha for integrators, as they have to account for scenarios in which the oracle returns two different prices in the same block.

Not only that, but in theory Pyth could be made to return a wide range of prices, as many as the updates are available, on the same block.

This allows for arbitrage in many cases, and is the reason why I tend to not recommend Pyth to any developer.

I'm unaware of any safe way to consume pyth that doesn't end up having an admin only contract that pushes valid Pyth prices into it.

# Redstone

Restone seems to share the same risk as Pyth, every 40 seconds / 1 minute, anyone can push an update.

This reduces the risk by a bit, but not by much.

Smart Contract systems would have to protect against Redstone returning 2 distinct prices on the same block.

# Chronicle

Chronicle oracles seem to be on par with Chainlink.

However, they famously sometimes roll a different version of their oracle, called "OptimisicChronicle" which can take up to 20 minutes to update.

IMO the optimistic version is fairly risky, as any slow update creates information asymmetry at the benefit of arbitrageurs.

Famously Euler had unexpected liquidations because of this oracle.

This may boil down to SLA, however, I believe only the "Normal Chronicle" oracle should be used in prod, even if more expensive.

# Risk for All

All oracles share the same risk:
- The time between a new price is discovered and said price is pushed on the oracle

This can happen on chain as well, as an AMM may (expectedly) be updated faster than the oracle.

This leads to every system being at the mercy of Arbitrageurs.

Ultimately Oracle Drift (the discrepancy between the actual price and the oracle reported price) is a huge source of advantage for traders at the detriment of passive users.

This is why most of these systems need fees, as a lack of fees would open up for arbitrage due to the sheer inaccuracy of the onchain prices.

# Tools

You can compute oracle inaccuracy when using 2 oracles with this tool:

https://getrecon.xyz/tools/oracle-drift

You can read more about Oracle Drift attacks, by reading a collection of my reports here:

https://solodit.cyfrin.io/?b=false&f=&ff=&i=HIGH%2CMEDIUM%2CLOW&l=&maxf=&minf=&p=1&pc=&pn=&qs=1&r=true&rf=alltime&rs=1&s=oracle+drift&sd=Desc&sf=Recency&t=&u=Alex+The+Entreprenerd&ur=true