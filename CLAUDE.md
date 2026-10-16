# Deployment

**Production branch is `claude/setup-quote-estimator-5p7Je`** — this is what Vercel (frontend) and Railway (backend) actually deploy from, NOT `main`, despite `main` looking like the conventional default.

https://github.com/eliaszoleta/cleaning-quote-estimator/tree/claude/setup-quote-estimator-5p7Je

This repo is also kept in sync with a second branch, `claude/website-indexing-audit-qf91rp` (push every commit to both).

**Always merge finished work to the production branch as part of finishing the task — do not leave fixes sitting unmerged on a dev branch.** This is an explicit standing rule from the user (2026-10-14): changes that never reach production can't be seen or tested, so "done" means merged and deployed, not just committed and pushed to a dev branch.

# Who to be when working on the calculator

The user's own framing for this work (2026-10-14, lightly cleaned up for grammar — keep this in mind for any task touching the pricing calculator, not just accuracy audits):

> "You have a degree in mathematics and you are an expert coder. You are also a cleaning business owner and a product cost expert in that business, with a degree in B2B marketing, and you've been an expert cleaning cost estimator for 10 years, giving cleaning estimates for the 10 services we have. Now, audit how reliable and accurate our cleaning calculator is. If there are issues, inconsistencies, bugs, calculation mistakes, UI mistakes, logic mistakes, or whatever else is found that makes our calculator inaccurate, fix them, improve it, and make sure the calculator is ready to be used by other cleaning businesses reliably. There should be no room for error, as this calculator is being sold and businesses use and rely on it to give job estimates."

In practice: approach every pricing question as someone who actually knows what a job costs and why (not just someone editing numbers in a config file), and treat "no room for error" as a literal constraint, not a figure of speech — the "Adding a new calculator scenario" rule below is this mindset applied as a concrete process.

# Adding a new calculator scenario

Standing rule from the user (2026-10-16), for any time a new or "complicated" real-world scenario gets added to the pricing calculator (a new job type, a new frequency, a new addon, a new condition tier, etc.):

1. **Research real pricing for it before inventing a number.** Don't back-calculate a figure from something else already in the system and call it done — actually look for published rates for that specific scenario (as done for the commercial one-time deep clean, the restroom rate, and the per-bed laundry rate). If a figure genuinely can't be sourced, say so explicitly in the code comment rather than presenting it as researched — this codebase already has a convention for flagging "estimated/interpolated, not independently sourced" vs. "cross-checked against published rates," and that distinction matters enough that it's worth asking the user if they want it researched before shipping an unsourced guess.
2. **Verify the change doesn't alter any other calculation.** Before considering the work done, confirm the new logic is strictly additive — only reachable when the new option is actually selected — and that every existing default/typical path produces byte-identical output to before. The reliable way to do this: extract the pre-change version of the touched backend files (e.g. `git archive <last-good-commit> backend | tar -x -C <scratch-dir>`) and run the same set of representative requests (covering all 12 services, not just the one touched) through both the old and new code, diffing totals and line-item adjustments — not just spot-checking the new scenario in isolation.

Both steps are required, not optional extras — this calculator is sold to and relied on by real cleaning businesses to quote real jobs, so an unresearched number or an unverified regression is a real-world accuracy failure, not just a code smell.
