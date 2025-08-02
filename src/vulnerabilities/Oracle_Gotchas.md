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


# Twap Oracles

Twap Oracles have famously been hacked in every possible way. 

- Inverse: https://rekt.news/inverse-finance-rekt
- Deus: https://rekt.news/deus-dao-rekt

That said these can be useful in some scenarios where their inaccuracy and manipulatability is acceptable, or fees are fairly high.

Generally speaking these are always available. However in my experience, very few implementations are safe.

Namely:
- UniV3 TWAP -> Safe when it has sufficient Cardinality and rounding down is acceptable (See: https://solodit.cyfrin.io/issues/m-2-oracle-tick-rounding-the-wrong-direction-can-lead-to-swapper-overpaying-for-swap-sherlock-none-splits-git)

- Curve (TODO: Find example)

NOTE: Balancer deprecated their Twap, I believe noone ever managed to write a safe implementation and use it in production.

# LP Oracles

Sturdy: https://rekt.news/sturdy-rekt
Sentiment: https://quillaudits.medium.com/decoding-sentiment-protocols-1-million-exploit-quillaudits-f36bee77d376
Curve: TODO Find exploit

LP oracles utilize the fact that the LP token maintain an invariant to price it.

- UniV3 - Using external oracle you can compute tick and reserves
- UniV2 - Using external oracle you can compute fair reserves
- Curve - Safe only when nonReentrant
- Balancer - Safe only when nonReentrant

I famously found an issue even when correctly pricing Lp tokens, this applies to scenarios in which you need a Bid and Ask price. We wrote about it here: https://getrecon.substack.com/p/the-dark-side-of-the-lp

# Fixed Rate Oracles

Fixed rate oracles are starting to become extremely popular for protocols that want to offer looping.

These tend to be very useful whenever we're dealing with short market fluctuations.

They do introduce riskier tail risks:
- Introduce more risk to lenders (as lenders will eat bad debt)
- Can be fully exploited in case of a real depeg

Fundamentally these can only be used when governance is trusted and has the ability to instantly shutdown the oracle or replace it.

That said, for day to day these oracles reduce risks to lenders which is nice.

# ERC4626 Oracles

ERC4626 Oracles have the goal of evaluating a wrapper (ERC4626 Vault) which contains some asset.

Given that ERC4626 offers bid and ask prices you'd expect this to be fairly simple.

However, in practice there are many footguns:
- `converToAssets` rounds down (good for borrow power, bad for redemptions / repayment)
- `previewRedeem` / `previewDeposit` should include cost of operations but many implementations do not

These tend to be fairly simple gotchas, that can be mitigated with a proper audit.

However, a bigger risk is present when dealing with ERC4626, the ability to reset the vault shares.

Whenever 100% of the total supply is controlled by one user, no matter the share value, a user can redeem 100% of the vault and reset the shares.

This can be very dangerous for complex DeFi flows (e.g. flashloans)

I famously wrote about this attack in the Euler Contest:
https://solodit.cyfrin.io/?b=false&f=&ff=&i=HIGH%2CMEDIUM%2CLOW&l=&maxf=&minf=&p=1&pc=&pn=Euler&qs=1&r=true&rf=alltime&rs=1&s=&sd=Desc&sf=Recency&t=&u=Alex+The+Entreprenerd&ur=true

And originally found in the Resonate codebase: https://immunefi.com/bug-bounty/resonate/information/

# Risk for All

All oracles share the same risk:
- The time between a new price is discovered and said price is pushed on the oracle

This can happen on chain as well, as an AMM may (expectedly) be updated faster than the oracle.

This leads to every system being at the mercy of Arbitrageurs.

Ultimately Oracle Drift (the discrepancy between the actual price and the oracle reported price) is a huge source of advantage for traders at the detriment of passive users.

This is why most of these systems need fees, as a lack of fees would open up for arbitrage due to the sheer inaccuracy of the onchain prices.

# System Specific Integration Risks

Some systems such as Borrowing, Liquidating and Redeeming may require different "Bid / Ask" pricing for assets.

A set of oracles that doesn't offer both may not be compatible with them, which would necessitate raising fees as to avoid arbitrage.

# Tools

You can compute oracle inaccuracy when using 2 oracles with this tool:

https://getrecon.xyz/tools/oracle-drift

You can read more about Oracle Drift attacks, by reading a collection of my reports here:

https://solodit.cyfrin.io/?b=false&f=&ff=&i=HIGH%2CMEDIUM%2CLOW&l=&maxf=&minf=&p=1&pc=&pn=&qs=1&r=true&rf=alltime&rs=1&s=oracle+drift&sd=Desc&sf=Recency&t=&u=Alex+The+Entreprenerd&ur=true