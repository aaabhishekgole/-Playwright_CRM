# Codex Handoff

This file captures the persistent working context for new Codex sessions after a fresh clone.

## What This Repo Is

Gadget Seva Hub is a claim and device-service operations platform with:

- admin portal on React
- Spring Boot API backend
- hybrid Expo runner app
- public runner pickup portal
- advanced Playwright test framework

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
- `Advance-Playwright-Framework-Testing`
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

Automation framework location:

- `Advance-Playwright-Framework-Testing`

Framework structure:

- `src/pages`
- `src/modules`
- `src/tests`
- `src/api`
- `src/fixtures`
- `src/testdata`

Important specs currently present:

- `src/tests/login.spec.ts`
- `src/tests/service-requests.spec.ts`
- `src/tests/runner-inbox.spec.ts`
- `src/tests/admin-menu.spec.ts`
- `src/tests/claim-registration.spec.ts`
- `src/tests/pickup-runner-onboarding.spec.ts`
- `src/tests/pickup-assignment.spec.ts`

Validation commands:

```bash
cd Advance-Playwright-Framework-Testing
node_modules/.bin/tsc --noEmit
node scripts/rule-engine.js
node_modules/.bin/playwright test --project=chromium --workers=1
```

## Report Locations

- `Advance-Playwright-Framework-Testing/playwright-report/index.html`
- `Advance-Playwright-Framework-Testing/tta-report/index.html`
- `Advance-Playwright-Framework-Testing/test-results`

## When Starting A New Codex Session

Recommended prompt:

```text
Read AGENTS.md and Docs/CODEX-HANDOFF.md first, then continue work in this repo without resetting the implemented India-first claim, pickup runner, hybrid mobile, and Playwright framework flows.
```

## Limitation

`git clone` can carry repo files, docs, prompts, and handoff notes, but it cannot automatically carry the exact old live chat thread. These files are the repo-backed replacement for that missing chat memory.
