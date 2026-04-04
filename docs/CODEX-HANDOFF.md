# Codex Handoff

This file captures the persistent working context for new Codex sessions after a fresh clone.

## What This Repo Is

Gadget Seva Hub is a claim and device-service operations platform with:

- admin portal on React
- Spring Boot API backend
- hybrid Expo runner app
- public runner pickup portal
- supporting QA scenarios documented in `Docs/`

## Current Product Shape

### Admin Portal

Main operational areas:

- dashboard
- service requests
- pickup management
- hub operations
- service center
- estimates
- cashless
- quality check
- delivery
- billing
- notifications
- users
- reports
- settings
- audit

### Pickup Management

Key flows implemented:

- runner onboarding in admin portal
- assign pickup from `REQUEST_CREATED`
- rider-specific SMS and WhatsApp link generation
- runner browser inbox
- runner hybrid-app inbox
- public token-based runner portal
- 10 required pickup images plus optional extras

### Mobile App

The mobile app is intentionally hybrid:

- same runner flow
- same backend
- deep-link handoff through smart runner access route
- no separate business-logic fork should be introduced unless necessary

## Important Directories

- `backend`
- `frontend`
- `mobile`
- `Docs`

## Important Docs

- `Docs/architecture.md`
- `Docs/api.md`
- `Docs/db-schema.md`
- `Docs/menu-mapping.md`
- `Docs/test-scenarios.md`
- `Docs/Gadget-Seva-Hub-Platform-Overview.pptx`

## Local Development Defaults

- frontend: `http://localhost:5173`
- backend: `http://localhost:8081`
- swagger: `http://localhost:8081/swagger-ui/index.html`

Seeded credentials commonly used:

- username: `admin`
- password: `Admin@123`

## Business Rules To Preserve

- India platform, INR currency, rupee formatting
- runner onboarding must make the runner visible in assign-pickup dropdown
- runner mobile number is mandatory
- rider notifications must target only the scheduled rider
- same pickup flow must exist across browser runner flow and hybrid runner app
- show proper success/error popup messages for submit actions

## Playwright Framework Status

The dedicated advanced Playwright automation framework is no longer tracked in this repo.

If you keep that framework locally or in a separate repository, manage it independently from this application repository.

The application repo still contains some small frontend-level test files, but the heavy test framework, reports, and test workspace are intentionally separated.

## When Starting A New Codex Session

Recommended prompt:

```text
Read AGENTS.md and Docs/CODEX-HANDOFF.md first, then continue work in this repo without resetting the implemented India-first claim, pickup runner, and hybrid mobile flows.
```

## Limitation

`git clone` can carry repo files, docs, prompts, and handoff notes, but it cannot automatically carry the exact old live chat thread. These files are the repo-backed replacement for that missing chat memory.
