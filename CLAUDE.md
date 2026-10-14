# Deployment

**Production branch is `claude/setup-quote-estimator-5p7Je`** — this is what Vercel (frontend) and Railway (backend) actually deploy from, NOT `main`, despite `main` looking like the conventional default.

https://github.com/eliaszoleta/cleaning-quote-estimator/tree/claude/setup-quote-estimator-5p7Je

This repo is also kept in sync with a second branch, `claude/website-indexing-audit-qf91rp` (push every commit to both).

**Always merge finished work to the production branch as part of finishing the task — do not leave fixes sitting unmerged on a dev branch.** This is an explicit standing rule from the user (2026-10-14): changes that never reach production can't be seen or tested, so "done" means merged and deployed, not just committed and pushed to a dev branch.
