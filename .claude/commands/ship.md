Take all uncommitted changes and ship them via a PR. Follow these steps:

1. Ask me for a short description of the change if I haven't provided one (use it for the branch name and PR title)
2. `git checkout -b feature/<short-description>` — create a feature branch
3. `git add` only the relevant changed files (never .env or sensitive files)
4. `git commit -m "<descriptive message>"`
5. `git push -u origin feature/<short-description>`
6. `gh pr create` with a clear title and a brief summary of what changed and why

Then:
7. Tell me the PR URL
8. Wait for CI checks to complete — poll `gh pr checks <PR-number>` every 30 seconds until all checks finish
9. Show me the final check results (pass/fail for each)
10. If all green, say so and wait for me to approve the merge. If any failed, show the details and stop.
