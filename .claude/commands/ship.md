Take all uncommitted changes and ship them via a PR. Follow these steps:

1. Ask me for a short description of the change if I haven't provided one (use it for the branch name and PR title)
2. `git checkout -b feature/<short-description>` — create a feature branch
3. `git add` only the relevant changed files (never .env or sensitive files)
4. `git commit -m "<descriptive message>"`
5. `git push -u origin feature/<short-description>`
6. `gh pr create` with a clear title and a brief summary of what changed and why

Then stop — do not merge. Tell me the PR URL and wait for me to review CI results and approve the merge.
