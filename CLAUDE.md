# Deployment

**Production branch is `claude/setup-quote-estimator-5p7Je`** — this is what Vercel (frontend) and Railway (backend) actually deploy from, NOT `main`, despite `main` looking like the conventional default.

https://github.com/eliaszoleta/cleaning-quote-estimator/tree/claude/setup-quote-estimator-5p7Je

This repo is also kept in sync with a second branch, `claude/website-indexing-audit-qf91rp` (push every commit to both).

**Always merge finished work to the production branch as part of finishing the task — do not leave fixes sitting unmerged on a dev branch.** This is an explicit standing rule from the user (2026-10-14): changes that never reach production can't be seen or tested, so "done" means merged and deployed, not just committed and pushed to a dev branch.

# Who to be when working on the calculator

The user's own framing for this work (2026-10-14, lightly cleaned up for grammar — keep this in mind for any task touching the pricing calculator, not just accuracy audits):

> "You have a degree in mathematics and you are an expert coder. You are also a cleaning business owner and a product cost expert in that business, with a degree in B2B marketing, and you've been an expert cleaning cost estimator for 10 years, giving cleaning estimates for every service we offer. Now, audit how reliable and accurate our cleaning calculator is. If there are issues, inconsistencies, bugs, calculation mistakes, UI mistakes, logic mistakes, or whatever else is found that makes our calculator inaccurate, fix them, improve it, and make sure the calculator is ready to be used by other cleaning businesses reliably. There should be no room for error, as this calculator is being sold and businesses use and rely on it to give job estimates."

(Said "10 services" originally, back when the calculator had 10 — deliberately generalized here since the count has already grown once (now 12) and will keep growing. Don't hardcode a specific service count anywhere this persona/rule is referenced; it applies to whatever services exist at the time, current or future. The same applies to user-facing copy: a hardcoded "12 services" claim anywhere in the app goes stale the moment a 13th is added, the same way "10 services" just did here — worth deriving from the real service list instead of a typed-out number wherever that's practical.)

In practice: approach every pricing question as someone who actually knows what a job costs and why (not just someone editing numbers in a config file), and treat "no room for error" as a literal constraint, not a figure of speech — the "Adding a new calculator scenario" rule below is this mindset applied as a concrete process.

# Adding a new calculator scenario

Standing rule from the user (2026-10-16), for any time a new or "complicated" real-world scenario gets added to the pricing calculator (a new job type, a new frequency, a new addon, a new condition tier, etc.):

1. **Research real pricing for it before inventing a number.** Don't back-calculate a figure from something else already in the system and call it done — actually look for published rates for that specific scenario (as done for the commercial one-time deep clean, the restroom rate, and the per-bed laundry rate). If a figure genuinely can't be sourced, say so explicitly in the code comment rather than presenting it as researched — this codebase already has a convention for flagging "estimated/interpolated, not independently sourced" vs. "cross-checked against published rates," and that distinction matters enough that it's worth asking the user if they want it researched before shipping an unsourced guess.
2. **Verify the change doesn't alter any other calculation.** Before considering the work done, confirm the new logic is strictly additive — only reachable when the new option is actually selected — and that every existing default/typical path produces byte-identical output to before. The reliable way to do this: extract the pre-change version of the touched backend files (e.g. `git archive <last-good-commit> backend | tar -x -C <scratch-dir>`) and run the same set of representative requests (covering all 12 services, not just the one touched) through both the old and new code, diffing totals and line-item adjustments — not just spot-checking the new scenario in isolation.

Both steps are required, not optional extras — this calculator is sold to and relied on by real cleaning businesses to quote real jobs, so an unresearched number or an unverified regression is a real-world accuracy failure, not just a code smell.

# Adding a new country

Standing rule from the user (2026-10-17): pricing (region multipliers, per-service factors, currency) is only part of what changes when the calculator expands into a new country. Every time a new country is added, proactively audit — without waiting to be asked — whether any of the following also need localizing for that country's actual cleaning industry, applying the same "expert cleaning cost estimator" persona from the section above to each one:

- **Units of measurement** — sqft vs. sqm, imperial vs. metric room/area sizing, temperature, etc.
- **Terminology and trade naming** — a service, condition tier, or team-size label that's spelled fine but isn't what that country's cleaning industry actually calls it (the UK pilot's Flat Cleaning / Mould Removal / After Builders Clean vs. the US's Apartment / Mold Remediation / Post-Construction is the reference example).
- **Team/crew conventions** — if a country's industry norm is structured differently (e.g. different typical crew sizes, different standard visit lengths) in a way that would make a question or its answer options misleading.
- **Tax/legal disclosure norms** — whether that country's sales-tax-equivalent (GST/HST, VAT, etc.) needs any note on quotes, and if so how (see the Canada GST/HST note vs. the UK's deliberate no-VAT-note decision for the reasoning each time — this can and should land differently per country).
- **Anything else locale-specific** that would make a question, unit, or term inaccurate or confusing to a business or customer actually operating in that country, even if it wasn't explicitly listed here.

If an audit finds something worth changing, apply the same rigor as the "Adding a new calculator scenario" rule above — research it, don't guess, and verify it doesn't regress any other country's output. If something is genuinely ambiguous or a judgment call (as the VAT-note decision was), it's fine to make the call and explain the reasoning, but flag it clearly rather than silently deciding. This is a standing checklist for every future country, not a one-off for Canada/UK.

# Named reversible changes

A log of named, self-contained changes the user may later ask to revert by name ("revert the X change") instead of by describing it again. Each entry is one commit per branch (or a short, deliberately exact list of commits) -- when asked to revert one, `git revert` those exact commits on both `claude/setup-quote-estimator-5p7Je` and `claude/website-indexing-audit-qf91rp` (same dual-branch push pattern as any other change here), don't reconstruct the change from memory or description.

## partner-gated-lead-capture (2026-10-25)

What it does: on the 4 public entry points (homepage `App.js`, `CalculatorPage.js`, `EstimatorPage.js`, `ServiceCalculatorPage.js`), the lead-capture form (name/email/phone) only shows if the visitor's geolocation matches an active partner -- no partner in their area drops straight to the old zero-friction instant-on-screen-estimate flow instead. New opt-in `gateLeadByPartner` prop on `CleaningCalculator.js`, wired only into those 4 pages. Also fixed a real pre-existing bug found while building this: the partner-forwarding lookup and `EstimateSentScreen`'s own partner card were using the raw `embedded` flag instead of `embedded && !siteLanding`, which meant partner-lead forwarding silently never worked on `/calculator`, `/estimator`, or `/services/:slug` -- only ever on the bare homepage.

Commits:
- `claude/setup-quote-estimator-5p7Je`: `251af8e` "Gate public lead capture on whether there's a partner to forward it to"
- `claude/website-indexing-audit-qf91rp`: `be93a3e` (same commit, cherry-picked)

To revert: `git revert 251af8e` on production, `git revert be93a3e` on sync (or cherry-pick one revert's content to the other, same as any other dual-branch change). This also un-fixes the embedded/siteLanding partner-lookup bug described above -- if the user only wants the gating undone but wants to keep that bug fix, say so explicitly rather than reverting wholesale.
