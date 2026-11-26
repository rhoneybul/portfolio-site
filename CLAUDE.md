# Fohm's website

The site at https://www.fohm.io: Next.js in `web/` (with the app builder and its MCP server), Sanity Studio in `studio/`.
`README.md` has the layout, local setup and deploys.
Vercel's project `fohm-site` deploys `main` to production and builds a preview for every pull request.

## How every change ships

Nothing lands on `main` except through a rebased PR, as in Naz and Etapa.

1. Branch off the latest `main`.
2. Commit there, push, and open the PR into `main`.
3. Let CI run, rebase onto the latest `main`, and **Rebase and merge** once `All tests` is green.
   Rebase is the only merge method: no merge commits, no squash.
   A branch that merged an old `main` and was then merged back can silently revert newer work; requiring a fresh rebase makes that impossible.
   If the merge button is blocked because the branch is behind, rebase onto `origin/main` and `git push --force-with-lease`: a merge commit is never the way past it.
   The ruleset and merge-button settings are in `docs/branch-protection.md`.

When resolving rebase conflicts, keep the intent of both sides: the branch's change applied on top of `main` as it is now.
Never resolve by taking one side of a file wholesale, and never paste in a copy of a file from before the rebase.
After the rebase, `git diff origin/main...HEAD` shows only what the PR means to change: a line it removes that the PR didn't set out to remove is `main`'s work being dropped, so put it back.

## Tests

CI runs the website's typecheck on every PR (`.github/workflows/test.yml`).
Locally, run `npm run typecheck` in `web/`, and check a change to a page in a browser at phone sizes (393×852, 412×915) and a laptop's.
