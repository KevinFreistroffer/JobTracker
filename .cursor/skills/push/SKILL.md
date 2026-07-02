---
name: push
description: Commits all changes and pushes the current branch to its remote upstream. Use when the user runs /push or asks to commit and push, or ship current work.
disable-model-invocation: true
---

# Cursor Skill: /push

## Purpose

Deploy the current work by committing all changes and pushing the currently checked out branch to its corresponding remote branch.

## Trigger

```
/push
```

## Instructions

When the user runs `/push`:

1. Determine the currently checked out Git branch.
2. Check `git status`.
3. If there are no changes:
   - Inform the user there is nothing to commit.
   - Exit.
4. Stage all modified, deleted, and new files.
5. Generate a concise, descriptive commit message based on the staged changes.
6. Commit the changes.
7. Push the current branch to its upstream remote.
   - If no upstream exists, push using:
     ```bash
     git push --set-upstream origin <current-branch>
     ```
8. Report:
   - Branch name
   - Commit hash
   - Commit message
   - Push result

## Commands

Determine branch:

```bash
git branch --show-current
```

Check status:

```bash
git status --short
```

Stage changes:

```bash
git add -A
```

Commit:

```bash
git commit -m "<generated commit message>"
```

Push:

```bash
git push
```

If no upstream exists:

```bash
git push --set-upstream origin <branch>
```

## Commit Message Guidelines

Use present tense and keep messages under 72 characters.

Examples:

- Add recruiter tracking spreadsheet
- Fix API authentication bug
- Improve TypeScript type safety
- Refactor deployment workflow
- Update interview preparation notes

## Safety Rules

- Never force push.
- Never amend commits unless explicitly requested.
- Never create or switch branches.
- Never pull or rebase.
- Never delete branches.
- If merge conflicts or push failures occur, stop and report the error.
