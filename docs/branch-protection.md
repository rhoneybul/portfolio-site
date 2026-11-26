# Branch protection: rebase only, no merge-overwrite

`main` stays linear: every PR is rebased onto the current tip of `main` before it lands, and merge commits are not allowed.
This stops the merge-overwrite failure: a branch merges an old `main` into itself, is then merged back, and silently reverts newer work wherever the two overlap.
Requiring a fresh rebase before merge makes that impossible, because no merge commit can hide a stale base.
Naz and Etapa work the same way.

## The rule, in two settings

1. **A ruleset on `main`**, enforced by GitHub (`.github/rulesets/main-rebase-only.json`):
   - Require linear history: blocks merge commits.
   - Require branches to be up to date before merging: the merge button unlocks only once the branch is rebased onto the latest `main`.
   - Require a pull request, with Rebase as the only merge method.
   - Require the `All tests` check to pass (`.github/workflows/test.yml`).
   - Block force pushes and deletion of `main`.
2. **The merge buttons**: rebase merging on; merge commits and squash merging off.

The only way to land a change is then: rebase the branch onto the latest `main`, push, let `All tests` go green, and press **Rebase and merge**.

## How to apply it

Both need admin rights on the repository: a checked-in file can't switch them on by itself.

### A. Import the ruleset

1. Repo → **Settings → Rules → Rulesets → New ruleset → Import a ruleset**.
2. Pick `.github/rulesets/main-rebase-only.json`.
3. Check **Enforcement status = Active**, then **Create**.

Or with the GitHub CLI:

```bash
gh api -X POST repos/rhoneybul/portfolio-site/rulesets --input .github/rulesets/main-rebase-only.json
```

### B. The merge buttons

Repo → **Settings → General → Pull Requests**: uncheck **Allow merge commits** and **Allow squash merging**, keep **Allow rebase merging**, and check **Automatically delete head branches**.

Or:

```bash
gh api -X PATCH repos/rhoneybul/portfolio-site -F allow_merge_commit=false -F allow_squash_merge=false -F allow_rebase_merge=true -F delete_branch_on_merge=true
```

## The required check must always report

`All tests` runs on every PR into `main`, with no path filters: a required check that is skipped never reports, and the PR waits for it forever.
A new test job goes in `needs:` on `all-tests`, so it gates merges too.
