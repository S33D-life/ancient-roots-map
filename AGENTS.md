# S33D Agent Guide

## Source of truth
Local repo:
`/Users/ed/Documents/S33D CODE/ancient-roots-map`

Remote:
`https://github.com/S33D-life/ancient-roots-map`

## Rules
- Do not work directly on `main`.
- Pull latest `main` before starting.
- Create one branch per task.
- Keep changes small and reviewable.
- Run checks before committing.
- Summarise files changed, risks, and next steps.

## Commands
```bash
git checkout main
git pull origin main
git checkout -b agent/task-name
npm install
npm run dev
npm run build
```
