Merge the open PR for the current branch.

1. `gh pr status` — confirm there is an open PR for the current branch
2. `gh pr checks <PR-number>` — verify all CI checks have passed
3. If any checks are failing or still running, show the status and stop — do not merge
4. If all green, merge using squash: `gh pr merge <PR-number> --squash`
5. `git checkout master && git pull` — return to master and sync

Tell me the merge commit and confirm master is up to date.
