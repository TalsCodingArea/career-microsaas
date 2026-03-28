# Claude Code Configuration — Career Evaluation MicroSaaS

## Identity — ALWAYS commit as:
```
git config user.name "TalsCodingArea"
git config user.email "Tals.Busi@gmail.com"
```
Set this at the start of EVERY session before any commit. No exceptions.
Never include "Co-Authored-By", "Generated with Claude", or any AI attribution in commit messages.

## This Project Only
This repo is ONLY for the Career Evaluation MicroSaaS.
- Frontend: React + Vite + TypeScript + Tailwind CSS (`frontend/`)
- Backend: Node.js + Express + TypeScript + MongoDB (`backend/`)
- Scraper: Python + Telethon + MongoDB (`scraper/`)
- DO NOT touch or reference files from other projects (personal-assistant, github-profile)

## Rules
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing an existing file over creating a new one
- NEVER commit secrets, .env files, or credentials
- ALWAYS run `npm run build` in frontend/ and backend/ before committing
- Keep files under 500 lines
- NEVER save working files to root — use frontend/src/, backend/src/, scraper/

## File Structure
```
career-microsaas/
├── frontend/          # React + Vite + Tailwind
│   └── src/
│       ├── components/
│       ├── context/
│       ├── data/          # questionnaire.json, consultants.json
│       ├── services/      # api.ts
│       ├── types/
│       └── utils/         # evaluate.ts (client-side scoring)
├── backend/           # Express + TypeScript
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       └── services/
└── scraper/           # Python + Telethon
    ├── listener.py
    ├── parser.py
    ├── db.py
    └── docker-compose.yml
```

## Build Commands
```bash
# Frontend
cd frontend && npm run build

# Backend
cd backend && npm run build

# Scraper
cd scraper && pip install -r requirements.txt
```

## Concurrency
- Batch ALL related operations in ONE message
- Spawn ALL agents in ONE message via Task tool
- Use swarm: hierarchical topology, max 8 agents, specialized strategy

## Git Workflow
```bash
git config user.name "TalsCodingArea"
git config user.email "Tals.Busi@gmail.com"
git add -A
git commit -m "feat/fix/chore: descriptive message"
git push origin main
```
